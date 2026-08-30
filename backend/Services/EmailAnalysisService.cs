using System.Text.RegularExpressions;
using CareerMail.Api.Data;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Models.Enums;
using CareerMail.Api.Services.Analyzer;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Services;

public interface IEmailAnalysisService
{
    Task<EmailAnalysisService.ProcessOutcome> ProcessEmailAsync(Email email, User user);
    Task ReprocessAllUserEmailsAsync(User user);
}

public class EmailAnalysisService : IEmailAnalysisService
{
    private readonly IEmailAnalyzer _emailAnalyzer;
    private readonly AppDbContext _context;

    public EmailAnalysisService(IEmailAnalyzer emailAnalyzer, AppDbContext context)
    {
        _emailAnalyzer = emailAnalyzer;
        _context = context;
    }

    public record ProcessOutcome(
        bool IsJobRelated,
        bool ApplicationCreated,
        bool ApplicationUpdated,
        bool InterviewCreated,
        bool FollowUpCreated
    );

    public async Task<ProcessOutcome> ProcessEmailAsync(Email email, User user)
    {
        var result = _emailAnalyzer.Analyze(email.Subject, email.Body, email.Sender, email.SenderEmail);

        if (!result.JobRelated)
        {
            email.IsJobRelated = false;
            email.Classification = null;
            email.DetectedCompany = null;
            email.DetectedRole = null;
            email.DetectedStatus = null;
            email.ProcessedAt = DateTime.UtcNow;
            return new ProcessOutcome(false, false, false, false, false);
        }

        email.IsJobRelated = true;
        email.DetectedCompany = result.Company;
        email.DetectedRole = result.JobTitle;
        email.DetectedStatus = result.Status.HasValue ? result.Status.Value.ToString() : ApplicationStatus.APPLIED.ToString();
        email.DetectedRecruiterName = result.RecruiterName;
        email.DetectedRecruiterEmail = result.RecruiterEmail;
        email.DetectedRecruiterTitle = result.RecruiterTitle;
        email.DetectedRecruiterType = result.RecruiterType;
        email.DetectedRecruiterConfidence = result.ContactConfidence;
        email.Classification = result.Classification;
        email.ProcessedAt = DateTime.UtcNow;

        var company = !string.IsNullOrWhiteSpace(result.Company) ? result.Company : "Unknown Company";

        // Thread Matching first
        JobApplication? matchedApp = null;
        if (!string.IsNullOrWhiteSpace(email.GmailThreadId))
        {
            var threadEmail = await _context.Emails
                .Include(e => e.JobApplication)
                .FirstOrDefaultAsync(e => e.UserId == user.Id && e.GmailThreadId == email.GmailThreadId && e.JobApplicationId != null);
            matchedApp = threadEmail?.JobApplication;
        }

        // Company Name Matching second
        if (matchedApp == null && !string.Equals(company, "Unknown Company", StringComparison.OrdinalIgnoreCase))
        {
            matchedApp = await _context.JobApplications
                .FirstOrDefaultAsync(ja => ja.UserId == user.Id && EF.Functions.ILike(ja.Company, company));
        }

        if (matchedApp == null && result.Classification == EmailClassification.NEW_OPPORTUNITY)
        {
            return new ProcessOutcome(true, false, false, false, false);
        }

        JobApplication app;
        var appCreated = false;
        var appUpdated = false;
        var interviewCreated = false;
        var followUpCreated = false;

        if (matchedApp != null)
        {
            app = matchedApp;
            appUpdated = true;

            if (!string.IsNullOrWhiteSpace(company) && !company.Equals("Unknown Company", StringComparison.OrdinalIgnoreCase))
            {
                app.Company = company;
                app.CompanyLogo = Regex.Replace(company.ToLowerInvariant(), "[^a-z0-9]", "");
            }
            if (!string.IsNullOrWhiteSpace(result.JobTitle) && !result.JobTitle.Equals("Applicant", StringComparison.OrdinalIgnoreCase))
            {
                app.Title = result.JobTitle;
            }

            if (result.Status.HasValue && ShouldUpgradeStatus(app.Status, result.Status.Value))
            {
                app.Status = result.Status.Value;
            }

            if (result.Salary != null && app.Salary == null)
            {
                app.Salary = result.Salary;
            }

            if (!string.IsNullOrWhiteSpace(result.RecruiterName))
            {
                var shouldUpdate = app.RecruiterName == null
                    || (result.RecruiterType == RecruiterType.HUMAN_RECRUITER && app.RecruiterType != RecruiterType.HUMAN_RECRUITER)
                    || (result.ContactConfidence.HasValue && (!app.ContactConfidence.HasValue || result.ContactConfidence.Value > app.ContactConfidence.Value));

                if (shouldUpdate)
                {
                    app.RecruiterName = result.RecruiterName;
                    app.RecruiterEmail = result.RecruiterEmail;
                    app.RecruiterTitle = result.RecruiterTitle;
                    app.RecruiterPhone = result.RecruiterPhone;
                    app.RecruiterLinkedin = result.RecruiterLinkedin;
                    app.RecruiterType = result.RecruiterType;
                    app.ContactConfidence = result.ContactConfidence;
                    app.ContactExtractionSource = result.ContactExtractionSource;
                }
            }

            var emailDate = DateOnly.FromDateTime(email.Timestamp);
            if (!app.DateApplied.HasValue || emailDate < app.DateApplied.Value)
            {
                app.DateApplied = emailDate;
            }

            app.LastActivityDate = DateOnly.FromDateTime(DateTime.UtcNow);
            app.ActivitySubtitle = ComputeSubtitle(app.Status);

            app.TimelineEvents.Add(new TimelineEvent
            {
                Title = email.Subject,
                Description = result.TimelineNote ?? email.Preview ?? email.Subject,
                EventDate = email.Timestamp,
                EventType = result.Status?.ToString() ?? app.Status.ToString()
            });

            _context.JobApplications.Update(app);
        }
        else
        {
            appCreated = true;
            app = new JobApplication
            {
                UserId = user.Id,
                Company = company,
                Title = !string.IsNullOrWhiteSpace(result.JobTitle) ? result.JobTitle : "Applicant",
                Location = result.Location,
                EmploymentType = result.EmploymentType,
                Salary = result.Salary,
                DateApplied = DateOnly.FromDateTime(email.Timestamp),
                LastActivityDate = DateOnly.FromDateTime(DateTime.UtcNow),
                Status = result.Status ?? ApplicationStatus.APPLIED,
                Priority = ComputePriority(result.Status ?? ApplicationStatus.APPLIED),
                RecruiterName = result.RecruiterName,
                RecruiterEmail = result.RecruiterEmail,
                RecruiterTitle = result.RecruiterTitle,
                RecruiterPhone = result.RecruiterPhone,
                RecruiterLinkedin = result.RecruiterLinkedin,
                RecruiterType = result.RecruiterType,
                ContactConfidence = result.ContactConfidence,
                ContactExtractionSource = result.ContactExtractionSource,
                Source = "Gmail Auto-Detection",
                CompanyLogo = Regex.Replace(company.ToLowerInvariant(), "[^a-z0-9]", ""),
                ActivitySubtitle = ComputeSubtitle(result.Status ?? ApplicationStatus.APPLIED),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            app.TimelineEvents.Add(new TimelineEvent
            {
                Title = $"Discovered: {app.Title} at {app.Company}",
                Description = result.TimelineNote ?? $"Detected from email: {email.Subject}",
                EventDate = email.Timestamp,
                EventType = app.Status.ToString()
            });

            _context.JobApplications.Add(app);
            await _context.SaveChangesAsync();
        }

        email.JobApplicationId = app.Id;

        // Auto-create Interview
        if (result.Classification == EmailClassification.INTERVIEW_INVITATION ||
            result.Classification == EmailClassification.INTERVIEW_SCHEDULED ||
            result.Status == ApplicationStatus.INTERVIEW ||
            result.Status == ApplicationStatus.FINAL_INTERVIEW)
        {
            var intDate = result.InterviewDateTime ?? DateTime.UtcNow.AddDays(3).Date.AddHours(11);
            var exists = await _context.Interviews.AnyAsync(i => i.UserId == user.Id && i.JobApplicationId == app.Id && i.InterviewDate == intDate);

            if (!exists)
            {
                var interview = new Interview
                {
                    UserId = user.Id,
                    JobApplicationId = app.Id,
                    Company = app.Company,
                    Title = app.Title,
                    InterviewDate = intDate,
                    Type = result.InterviewType ?? "Technical Interview",
                    Interviewer = result.RecruiterName ?? "Hiring Team",
                    Location = result.InterviewLink != null ? "Online / Video" : "Online",
                    MeetingLink = result.InterviewLink,
                    DaysAwayBadge = "In 3 days",
                    CompanyLogo = app.CompanyLogo,
                    PreparationNotes = $"Prepare technical background and experience for {app.Company}.",
                    Status = InterviewStatus.SCHEDULED
                };
                _context.Interviews.Add(interview);
                interviewCreated = true;
            }
        }

        // Auto-create Follow-up
        if (result.Classification == EmailClassification.ASSESSMENT || result.Deadline.HasValue)
        {
            var dueDate = result.Deadline ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5));
            var exists = await _context.FollowUps.AnyAsync(f => f.UserId == user.Id && f.JobApplicationId == app.Id && f.DueDate == dueDate);

            if (!exists)
            {
                var days = dueDate.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber;
                var followUp = new FollowUp
                {
                    UserId = user.Id,
                    JobApplicationId = app.Id,
                    Company = app.Company,
                    Role = app.Title,
                    DueDate = dueDate,
                    AppliedSubtitle = "Assessment Active",
                    DaysDueBadge = $"Due in {days} days",
                    CompanyLogo = app.CompanyLogo,
                    Notes = $"Complete online coding assessment for {app.Company} before deadline.",
                    Status = FollowUpStatus.PENDING
                };
                _context.FollowUps.Add(followUp);
                followUpCreated = true;
            }
        }

        await _context.SaveChangesAsync();
        return new ProcessOutcome(true, appCreated, appUpdated, interviewCreated, followUpCreated);
    }

    public async Task ReprocessAllUserEmailsAsync(User user)
    {
        var interviews = await _context.Interviews.Where(i => i.UserId == user.Id).ToListAsync();
        _context.Interviews.RemoveRange(interviews);

        var followUps = await _context.FollowUps.Where(f => f.UserId == user.Id).ToListAsync();
        _context.FollowUps.RemoveRange(followUps);

        var userApps = await _context.JobApplications
            .Where(a => a.UserId == user.Id && (a.Source == "Gmail Auto-Detection" || a.Source == null))
            .ToListAsync();

        foreach (var app in userApps)
        {
            var linked = await _context.Emails.Where(e => e.UserId == user.Id && e.JobApplicationId == app.Id).ToListAsync();
            foreach (var e in linked)
            {
                e.JobApplicationId = null;
                e.IsJobRelated = false;
            }
            _context.JobApplications.Remove(app);
        }

        await _context.SaveChangesAsync();

        var allEmails = await _context.Emails.Where(e => e.UserId == user.Id).OrderBy(e => e.Timestamp).ToListAsync();
        foreach (var email in allEmails)
        {
            await ProcessEmailAsync(email, user);
        }
    }

    private static bool ShouldUpgradeStatus(ApplicationStatus current, ApplicationStatus incoming)
    {
        if (current == incoming) return false;
        if (current == ApplicationStatus.OFFER && incoming != ApplicationStatus.REJECTED && incoming != ApplicationStatus.WITHDRAWN)
        {
            return false;
        }
        return GetStatusWeight(incoming) >= GetStatusWeight(current);
    }

    private static int GetStatusWeight(ApplicationStatus status) => status switch
    {
        ApplicationStatus.APPLIED => 1,
        ApplicationStatus.ASSESSMENT => 2,
        ApplicationStatus.RECRUITER_SCREEN => 3,
        ApplicationStatus.INTERVIEW => 4,
        ApplicationStatus.FINAL_INTERVIEW => 5,
        ApplicationStatus.OFFER => 6,
        ApplicationStatus.REJECTED => 7,
        ApplicationStatus.WITHDRAWN => 8,
        _ => 1
    };

    private static Priority ComputePriority(ApplicationStatus status) =>
        status is ApplicationStatus.OFFER or ApplicationStatus.FINAL_INTERVIEW or ApplicationStatus.INTERVIEW
            ? Priority.HIGH
            : Priority.MEDIUM;

    private static string ComputeSubtitle(ApplicationStatus status) => status switch
    {
        ApplicationStatus.ASSESSMENT => "Assessment active",
        ApplicationStatus.RECRUITER_SCREEN => "Screening call",
        ApplicationStatus.INTERVIEW => "Technical Interview",
        ApplicationStatus.FINAL_INTERVIEW => "Final Round",
        ApplicationStatus.OFFER => "Offer Received 🎉",
        ApplicationStatus.REJECTED => "Application closed",
        ApplicationStatus.WITHDRAWN => "Application withdrawn",
        _ => "Applied recently"
    };
}
