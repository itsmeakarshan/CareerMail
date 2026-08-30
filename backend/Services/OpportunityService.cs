using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Web;
using CareerMail.Api.Data;
using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Services;

public interface IOpportunityService
{
    Task<List<OpportunityDTO>> GetOpportunitiesAsync(User user);
    Task<JobApplication> ConvertOpportunityAsync(User user, long emailId, JobApplicationRequest? customRequest);
    Task<Dictionary<string, object>> ScanGmailForOpportunitiesAsync(User user);
}

public class OpportunityService : IOpportunityService
{
    private readonly AppDbContext _context;
    private readonly IGoogleOAuthService _googleOAuthService;
    private readonly IGmailService _gmailService;
    private readonly IEmailAnalysisService _emailAnalysisService;
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpportunityService> _logger;

    private static readonly string[] OpportunityKeywords = new[]
    {
        "new opportunity", "job opportunity", "career opportunity", "exciting opportunity",
        "opportunity for", "opportunity at", "opportunity with", "role opening",
        "position open", "job opening", "we are hiring", "is hiring", "hiring for",
        "thought you'd be a great fit", "thought you might be a fit", "thought of you for",
        "job match", "job alert", "recruiter reachout", "reaching out regarding",
        "wanted to reach out regarding", "found your profile", "impressed with your background",
        "open role", "new role for", "role opening at", "explore opportunities"
    };

    public OpportunityService(
        AppDbContext context,
        IGoogleOAuthService googleOAuthService,
        IGmailService gmailService,
        IEmailAnalysisService emailAnalysisService,
        HttpClient httpClient,
        ILogger<OpportunityService> logger)
    {
        _context = context;
        _googleOAuthService = googleOAuthService;
        _gmailService = gmailService;
        _emailAnalysisService = emailAnalysisService;
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<List<OpportunityDTO>> GetOpportunitiesAsync(User user)
    {
        var allEmails = await _context.Emails
            .Include(e => e.JobApplication)
            .Where(e => e.UserId == user.Id)
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync();

        var opportunities = new List<OpportunityDTO>();
        var seenSubjects = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var email in allEmails)
        {
            var isExplicitOpportunity = email.Classification == EmailClassification.NEW_OPPORTUNITY;
            var isUnlinkedRecruiter = email.JobApplicationId == null && (
                email.Classification == EmailClassification.RECRUITER_MESSAGE ||
                email.DetectedRecruiterType == RecruiterType.HUMAN_RECRUITER
            );

            var combined = $"{email.Subject} {email.Body}".ToLowerInvariant();
            var matchesKeywords = OpportunityKeywords.Any(kw => combined.Contains(kw));

            if (isExplicitOpportunity || isUnlinkedRecruiter || (email.JobApplicationId == null && matchesKeywords))
            {
                var dedupeKey = $"{email.Subject?.Trim()}|{email.SenderEmail}";
                if (!seenSubjects.Add(dedupeKey))
                {
                    continue;
                }

                opportunities.Add(MapEmailToOpportunity(email));
            }
        }

        return opportunities;
    }

    public async Task<JobApplication> ConvertOpportunityAsync(User user, long emailId, JobApplicationRequest? customRequest)
    {
        var email = await _context.Emails
            .Include(e => e.JobApplication)
            .FirstOrDefaultAsync(e => e.Id == emailId && e.UserId == user.Id);

        if (email == null)
        {
            throw new ArgumentException($"Email not found with ID: {emailId}");
        }

        var company = !string.IsNullOrWhiteSpace(customRequest?.Company)
            ? customRequest.Company.Trim()
            : (!string.IsNullOrWhiteSpace(email.DetectedCompany) ? email.DetectedCompany : ExtractCompanyFromSender(email));

        var role = !string.IsNullOrWhiteSpace(customRequest?.Title)
            ? customRequest.Title.Trim()
            : (!string.IsNullOrWhiteSpace(email.DetectedRole) ? email.DetectedRole : "Software Engineer");

        var status = ApplicationStatus.APPLIED;
        if (!string.IsNullOrWhiteSpace(customRequest?.Status))
        {
            status = ApplicationStatusExtensions.FromString(customRequest.Status);
        }

        var app = new JobApplication
        {
            UserId = user.Id,
            Company = company,
            Title = role,
            Status = status,
            Location = customRequest?.Location ?? "Remote / Hybrid",
            EmploymentType = customRequest?.EmploymentType ?? "Full-time",
            Salary = customRequest?.Salary ?? ExtractSalary(email.Body),
            DateApplied = DateOnly.FromDateTime(DateTime.UtcNow),
            LastActivityDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Source = "Gmail Opportunity Lead",
            CompanyLogo = Regex.Replace(company.ToLowerInvariant(), "[^a-z0-9]", ""),
            Priority = Priority.HIGH,
            RecruiterName = !string.IsNullOrWhiteSpace(email.DetectedRecruiterName) ? email.DetectedRecruiterName : email.Sender,
            RecruiterEmail = !string.IsNullOrWhiteSpace(email.DetectedRecruiterEmail) ? email.DetectedRecruiterEmail : email.SenderEmail,
            RecruiterType = email.DetectedRecruiterType ?? RecruiterType.HUMAN_RECRUITER,
            ContactConfidence = 85,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        app.TimelineEvents.Add(new TimelineEvent
        {
            Title = "Converted Opportunity",
            Description = $"Converted from Gmail opportunity reachout: {email.Subject}",
            EventDate = DateTime.UtcNow,
            EventType = "OPPORTUNITY_CONVERTED"
        });

        _context.JobApplications.Add(app);
        await _context.SaveChangesAsync();

        email.JobApplicationId = app.Id;
        email.IsJobRelated = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully converted opportunity email ID {EmailId} into JobApplication ID {AppId} ({Company}) for user {Email}",
            emailId, app.Id, app.Company, user.Email);

        return app;
    }

    public async Task<Dictionary<string, object>> ScanGmailForOpportunitiesAsync(User user)
    {
        var account = await _context.ConnectedAccounts
            .FirstOrDefaultAsync(ca => ca.UserId == user.Id && ca.Provider == "google");

        if (account == null || string.IsNullOrWhiteSpace(account.AccessToken))
        {
            throw new InvalidOperationException("No Google account connected. Please connect Gmail in Settings first.");
        }

        var accessToken = await _googleOAuthService.GetValidAccessTokenAsync(account);
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new InvalidOperationException("Google authentication expired. Please reconnect Gmail in Settings.");
        }

        const string query = "newer_than:100d (\"new opportunity\" OR \"job opportunity\" OR \"career opportunity\" OR \"exciting opportunity\" OR \"opportunity with\" OR \"opportunity at\" OR \"role opening\" OR \"job opening\" OR \"we are hiring\" OR \"thought you'd be a great fit\" OR \"hiring for\")";
        var endpoint = $"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=60&q={HttpUtility.UrlEncode(query)}";

        var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var listResp = await _httpClient.SendAsync(request);

        var scanned = 0;
        var opportunitiesFound = 0;

        if (listResp.IsSuccessStatusCode)
        {
            using var listDoc = JsonDocument.Parse(await listResp.Content.ReadAsStringAsync());
            if (listDoc.RootElement.TryGetProperty("messages", out var messages) && messages.ValueKind == JsonValueKind.Array)
            {
                foreach (var m in messages.EnumerateArray())
                {
                    var msgId = m.GetProperty("id").GetString()!;
                    var threadId = m.GetProperty("threadId").GetString()!;

                    var detailUrl = $"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msgId}?format=full";
                    var detailReq = new HttpRequestMessage(HttpMethod.Get, detailUrl);
                    detailReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                    var detailResp = await _httpClient.SendAsync(detailReq);

                    if (detailResp.IsSuccessStatusCode)
                    {
                        using var detailDoc = JsonDocument.Parse(await detailResp.Content.ReadAsStringAsync());
                        var email = await _context.Emails.FirstOrDefaultAsync(e => e.UserId == user.Id && e.GmailMessageId == msgId);
                        if (email == null)
                        {
                            email = _gmailService.ParseGmailMessage(detailDoc.RootElement, user, msgId, threadId);
                            _context.Emails.Add(email);
                        }

                        email.Classification = EmailClassification.NEW_OPPORTUNITY;
                        email.IsJobRelated = true;
                        await _context.SaveChangesAsync();

                        await _emailAnalysisService.ProcessEmailAsync(email, user);
                        scanned++;
                        opportunitiesFound++;
                    }
                }
            }
        }

        var currentOpportunities = await GetOpportunitiesAsync(user);

        return new Dictionary<string, object>
        {
            ["success"] = true,
            ["scannedCount"] = scanned,
            ["opportunitiesFound"] = opportunitiesFound,
            ["opportunitiesCount"] = currentOpportunities.Count,
            ["message"] = $"Found {currentOpportunities.Count} extracted opportunities from your Gmail inbox.",
            ["opportunities"] = currentOpportunities
        };
    }

    private static OpportunityDTO MapEmailToOpportunity(Email email)
    {
        var company = !string.IsNullOrWhiteSpace(email.DetectedCompany)
            ? email.DetectedCompany
            : ExtractCompanyFromSender(email);

        var role = !string.IsNullOrWhiteSpace(email.DetectedRole)
            ? email.DetectedRole
            : ExtractRoleFromSubject(email.Subject);

        var recruiterName = !string.IsNullOrWhiteSpace(email.DetectedRecruiterName)
            ? email.DetectedRecruiterName
            : email.Sender;

        var recruiterEmail = !string.IsNullOrWhiteSpace(email.DetectedRecruiterEmail)
            ? email.DetectedRecruiterEmail
            : email.SenderEmail;

        var snippet = !string.IsNullOrWhiteSpace(email.Preview)
            ? email.Preview
            : (email.Body.Length > 140 ? email.Body[..140] + "..." : email.Body);

        var tags = new List<string>();
        if (email.DetectedRecruiterType == RecruiterType.HUMAN_RECRUITER)
        {
            tags.Add("Direct Recruiter Reachout");
        }
        else
        {
            tags.Add("Curated Lead");
        }
        tags.Add("Full-time");
        tags.Add("Remote / Hybrid");

        var salary = ExtractSalary(email.Body);
        var oppType = email.DetectedRecruiterType == RecruiterType.HUMAN_RECRUITER ? "Recruiter Reachout" : "Job Match Lead";

        return new OpportunityDTO(
            email.Id,
            company,
            role,
            recruiterName,
            recruiterEmail,
            email.Subject,
            snippet,
            email.Body,
            email.Timestamp,
            "Remote / Hybrid",
            salary ?? "Competitive",
            oppType,
            email.JobApplicationId.HasValue,
            email.JobApplicationId,
            tags,
            false
        );
    }

    private static string ExtractCompanyFromSender(Email email)
    {
        if (!string.IsNullOrWhiteSpace(email.Sender) && !email.Sender.Equals("Recruiter", StringComparison.OrdinalIgnoreCase) && !email.Sender.Contains("@"))
        {
            return Regex.Replace(email.Sender, @"(?i)(Careers|Recruiting|Team|Talent|Jobs)", "").Trim();
        }
        if (!string.IsNullOrWhiteSpace(email.SenderEmail) && email.SenderEmail.Contains("@"))
        {
            var domain = email.SenderEmail[(email.SenderEmail.IndexOf("@") + 1)..];
            var name = domain.Split('.')[0];
            return char.ToUpper(name[0]) + name[1..];
        }
        return "Discovered Lead";
    }

    private static string ExtractRoleFromSubject(string subject)
    {
        if (string.IsNullOrWhiteSpace(subject)) return "Software Engineer";
        var match = Regex.Match(subject, @"(?i)(?:for|as a|position:|role:)\s+([A-Za-z0-9\s/\-]+?)(?:at|with|in|\||-|$)", RegexOptions.IgnoreCase);
        if (match.Success)
        {
            var extracted = match.Groups[1].Value.Trim();
            if (extracted.Length > 3 && extracted.Length < 50)
            {
                return extracted;
            }
        }
        return "Software Engineer";
    }

    private static string? ExtractSalary(string? body)
    {
        if (string.IsNullOrWhiteSpace(body)) return null;
        var match = Regex.Match(body, @"(?i)(\$[0-9]{2,3}(?:,[0-9]{3})*(?:\s*-\s*\$[0-9]{2,3}(?:,[0-9]{3})*)?(?:\s*(?:k|k/yr|/year|per year))?)");
        return match.Success ? match.Groups[1].Value.Trim() : null;
    }
}
