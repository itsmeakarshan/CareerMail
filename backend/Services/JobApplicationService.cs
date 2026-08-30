using System.Text.RegularExpressions;
using CareerMail.Api.Data;
using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Services;

public interface IJobApplicationService
{
    Task<List<JobApplication>> GetAllApplicationsAsync(long userId);
    Task<JobApplication> GetApplicationByIdAsync(long userId, long id);
    Task<JobApplication> CreateApplicationAsync(long userId, JobApplicationRequest request);
    Task<JobApplication> UpdateApplicationAsync(long userId, long id, JobApplicationRequest request);
    Task<JobApplication> UpdateStatusAsync(long userId, long id, string statusStr);
    Task DeleteApplicationAsync(long userId, long id);
    Task<List<JobApplication>> SearchApplicationsAsync(long userId, string? query);
}

public class JobApplicationService : IJobApplicationService
{
    private readonly AppDbContext _context;

    public JobApplicationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<JobApplication>> GetAllApplicationsAsync(long userId)
    {
        return await _context.JobApplications
            .Include(ja => ja.TimelineEvents.OrderByDescending(te => te.EventDate))
            .Include(ja => ja.Interviews)
            .Include(ja => ja.FollowUps)
            .Where(ja => ja.UserId == userId)
            .OrderByDescending(ja => ja.DateApplied)
            .ToListAsync();
    }

    public async Task<JobApplication> GetApplicationByIdAsync(long userId, long id)
    {
        var app = await _context.JobApplications
            .Include(ja => ja.TimelineEvents.OrderByDescending(te => te.EventDate))
            .Include(ja => ja.Interviews)
            .Include(ja => ja.FollowUps)
            .FirstOrDefaultAsync(ja => ja.Id == id && ja.UserId == userId);

        if (app == null)
        {
            throw new ArgumentException($"Job application not found with ID: {id}");
        }

        return app;
    }

    public async Task<JobApplication> CreateApplicationAsync(long userId, JobApplicationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Company))
        {
            throw new ArgumentException("Company is required");
        }
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ArgumentException("Title is required");
        }

        var app = new JobApplication
        {
            UserId = userId,
            Company = request.Company.Trim(),
            Title = request.Title.Trim(),
            Location = !string.IsNullOrWhiteSpace(request.Location) ? request.Location.Trim() : "Remote",
            EmploymentType = !string.IsNullOrWhiteSpace(request.EmploymentType) ? request.EmploymentType.Trim() : "Full-time",
            Salary = !string.IsNullOrWhiteSpace(request.Salary) ? request.Salary.Trim() : null,
            DateApplied = request.DateApplied ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Status = ApplicationStatusExtensions.FromString(request.Status),
            Priority = PriorityExtensions.FromString(request.Priority),
            RecruiterName = request.RecruiterName?.Trim(),
            RecruiterEmail = request.RecruiterEmail?.Trim(),
            RecruiterTitle = request.RecruiterTitle?.Trim(),
            RecruiterPhone = request.RecruiterPhone?.Trim(),
            RecruiterLinkedin = request.RecruiterLinkedin?.Trim(),
            ContactConfidence = request.ContactConfidence,
            ContactExtractionSource = request.ContactExtractionSource,
            Source = !string.IsNullOrWhiteSpace(request.Source) ? request.Source.Trim() : "Direct Application",
            Notes = request.Notes?.Trim(),
            NextFollowUpDate = request.NextFollowUpDate,
            CompanyLogo = !string.IsNullOrWhiteSpace(request.CompanyLogo)
                ? request.CompanyLogo.Trim()
                : Regex.Replace(request.Company.ToLowerInvariant(), "[^a-z0-9]", ""),
            ActivitySubtitle = !string.IsNullOrWhiteSpace(request.ActivitySubtitle)
                ? request.ActivitySubtitle.Trim()
                : "Applied recently",
            LastActivityDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (!string.IsNullOrEmpty(request.RecruiterType) && Enum.TryParse<RecruiterType>(request.RecruiterType, true, out var rType))
        {
            app.RecruiterType = rType;
        }

        app.TimelineEvents.Add(new TimelineEvent
        {
            Title = $"Applied for {app.Title}",
            Description = $"Application submitted to {app.Company}",
            EventDate = DateTime.UtcNow,
            EventType = "APPLIED"
        });

        _context.JobApplications.Add(app);
        await _context.SaveChangesAsync();

        return app;
    }

    public async Task<JobApplication> UpdateApplicationAsync(long userId, long id, JobApplicationRequest request)
    {
        var app = await GetApplicationByIdAsync(userId, id);

        if (!string.IsNullOrWhiteSpace(request.Company)) app.Company = request.Company.Trim();
        if (!string.IsNullOrWhiteSpace(request.Title)) app.Title = request.Title.Trim();
        if (request.Location != null) app.Location = request.Location.Trim();
        if (request.EmploymentType != null) app.EmploymentType = request.EmploymentType.Trim();
        if (request.Salary != null) app.Salary = request.Salary.Trim();
        if (request.DateApplied.HasValue) app.DateApplied = request.DateApplied.Value;

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var newStatus = ApplicationStatusExtensions.FromString(request.Status);
            if (newStatus != app.Status)
            {
                app.Status = newStatus;
                app.LastActivityDate = DateOnly.FromDateTime(DateTime.UtcNow);
                app.TimelineEvents.Add(new TimelineEvent
                {
                    Title = $"Status changed to {newStatus.GetDisplayName()}",
                    Description = "Updated application status",
                    EventDate = DateTime.UtcNow,
                    EventType = newStatus.ToString()
                });
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Priority)) app.Priority = PriorityExtensions.FromString(request.Priority);
        if (request.RecruiterName != null) app.RecruiterName = request.RecruiterName.Trim();
        if (request.RecruiterEmail != null) app.RecruiterEmail = request.RecruiterEmail.Trim();
        if (request.RecruiterTitle != null) app.RecruiterTitle = request.RecruiterTitle.Trim();
        if (request.RecruiterPhone != null) app.RecruiterPhone = request.RecruiterPhone.Trim();
        if (request.RecruiterLinkedin != null) app.RecruiterLinkedin = request.RecruiterLinkedin.Trim();
        if (!string.IsNullOrEmpty(request.RecruiterType) && Enum.TryParse<RecruiterType>(request.RecruiterType, true, out var rType))
        {
            app.RecruiterType = rType;
        }
        if (request.ContactConfidence.HasValue) app.ContactConfidence = request.ContactConfidence.Value;
        if (request.ContactExtractionSource != null) app.ContactExtractionSource = request.ContactExtractionSource;
        if (request.Source != null) app.Source = request.Source.Trim();
        if (request.Notes != null) app.Notes = request.Notes.Trim();
        if (request.NextFollowUpDate.HasValue) app.NextFollowUpDate = request.NextFollowUpDate.Value;
        if (request.CompanyLogo != null) app.CompanyLogo = request.CompanyLogo.Trim();
        if (request.ActivitySubtitle != null) app.ActivitySubtitle = request.ActivitySubtitle.Trim();
        app.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return app;
    }

    public async Task<JobApplication> UpdateStatusAsync(long userId, long id, string statusStr)
    {
        var app = await GetApplicationByIdAsync(userId, id);
        var newStatus = ApplicationStatusExtensions.FromString(statusStr);

        if (app.Status != newStatus)
        {
            app.Status = newStatus;
            app.LastActivityDate = DateOnly.FromDateTime(DateTime.UtcNow);

            var subtitle = newStatus switch
            {
                ApplicationStatus.ASSESSMENT => "Assessment invited",
                ApplicationStatus.RECRUITER_SCREEN => "Screening call",
                ApplicationStatus.INTERVIEW => "Technical Interview",
                ApplicationStatus.FINAL_INTERVIEW => "Final Round",
                ApplicationStatus.OFFER => "Offer Received",
                ApplicationStatus.REJECTED => "Application closed",
                ApplicationStatus.WITHDRAWN => "Application withdrawn",
                _ => "Applied recently"
            };
            app.ActivitySubtitle = subtitle;

            app.TimelineEvents.Add(new TimelineEvent
            {
                Title = $"Moved to {newStatus.GetDisplayName()}",
                Description = "Application stage updated on Kanban board",
                EventDate = DateTime.UtcNow,
                EventType = newStatus.ToString()
            });

            app.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return app;
    }

    public async Task DeleteApplicationAsync(long userId, long id)
    {
        var app = await GetApplicationByIdAsync(userId, id);

        var emails = await _context.Emails.Where(e => e.JobApplicationId == id).ToListAsync();
        foreach (var email in emails)
        {
            email.JobApplicationId = null;
        }

        _context.JobApplications.Remove(app);
        await _context.SaveChangesAsync();
    }

    public async Task<List<JobApplication>> SearchApplicationsAsync(long userId, string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return await GetAllApplicationsAsync(userId);
        }

        var q = query.Trim().ToLowerInvariant();
        return await _context.JobApplications
            .Include(ja => ja.TimelineEvents.OrderByDescending(te => te.EventDate))
            .Include(ja => ja.Interviews)
            .Include(ja => ja.FollowUps)
            .Where(ja => ja.UserId == userId && (
                ja.Company.ToLower().Contains(q) ||
                ja.Title.ToLower().Contains(q) ||
                (ja.Location != null && ja.Location.ToLower().Contains(q)) ||
                (ja.RecruiterName != null && ja.RecruiterName.ToLower().Contains(q))
            ))
            .OrderByDescending(ja => ja.DateApplied)
            .ToListAsync();
    }
}
