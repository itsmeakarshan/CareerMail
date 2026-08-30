using System.ComponentModel.DataAnnotations;
using CareerMail.Api.Models.Enums;

namespace CareerMail.Api.Models.DTOs;

// --- Auth DTOs ---
public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record RegisterRequest(
    [Required] string Name,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password
);

public record AuthResponse(
    string Token,
    long Id,
    string Name,
    string Email,
    string? AvatarUrl
);

public record UserDto(
    long Id,
    string Name,
    string Email,
    string? AvatarUrl
);

// --- Job Application DTOs ---
public class JobApplicationRequest
{
    public string? Company { get; set; }
    public string? Title { get; set; }
    public string? Location { get; set; }
    public string? EmploymentType { get; set; }
    public string? Salary { get; set; }
    public DateOnly? DateApplied { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? RecruiterName { get; set; }
    public string? RecruiterEmail { get; set; }
    public string? RecruiterTitle { get; set; }
    public string? RecruiterPhone { get; set; }
    public string? RecruiterLinkedin { get; set; }
    public string? RecruiterType { get; set; }
    public int? ContactConfidence { get; set; }
    public string? ContactExtractionSource { get; set; }
    public string? Source { get; set; }
    public string? Notes { get; set; }
    public DateOnly? NextFollowUpDate { get; set; }
    public string? CompanyLogo { get; set; }
    public string? ActivitySubtitle { get; set; }
}

public record StatusUpdateRequest(
    [Required] string Status
);

// --- Email DTOs ---
public record EmailComposeRequest(
    [Required, EmailAddress] string To,
    [Required] string Subject,
    [Required] string Body,
    long? JobApplicationId,
    string? RecruiterName
);

// --- Interview DTOs ---
public class InterviewRequest
{
    public long? JobApplicationId { get; set; }
    public string? Company { get; set; }
    public string? Title { get; set; }
    public DateTime? InterviewDate { get; set; }
    public string? Type { get; set; }
    public string? Interviewer { get; set; }
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
    public string? PreparationNotes { get; set; }
    public string? Status { get; set; }
    public string? CompanyLogo { get; set; }
}

// --- FollowUp DTOs ---
public class FollowUpRequest
{
    public long? JobApplicationId { get; set; }
    public string? Company { get; set; }
    public string? Role { get; set; }
    public DateOnly? DueDate { get; set; }
    public string? Notes { get; set; }
    public string? Status { get; set; }
    public string? CompanyLogo { get; set; }
}

// --- Opportunity DTOs ---
public record OpportunityDTO(
    long Id,
    string Company,
    string Role,
    string RecruiterName,
    string RecruiterEmail,
    string Subject,
    string Snippet,
    string Body,
    DateTime Timestamp,
    string Location,
    string Salary,
    string Type,
    bool Converted,
    long? ApplicationId,
    List<string> Tags,
    bool Dismissed
);

// --- Analytics DTOs ---
public class AnalyticsResponse
{
    public long TotalApplications { get; set; }
    public long Interviews { get; set; }
    public long Offers { get; set; }
    public long Rejections { get; set; }
    public int ResponseRate { get; set; }

    public long ThisMonthApplications { get; set; }
    public long ThisMonthInterviews { get; set; }
    public long ThisMonthOffers { get; set; }
    public long ThisMonthRejections { get; set; }
    public int ThisMonthResponseRateDelta { get; set; }

    public List<MonthlyTrend> ApplicationsOverTime { get; set; } = new();
    public List<MonthlyTrend> Last12MonthsTrends { get; set; } = new();
    public List<MonthlyTrend> Last6MonthsTrends { get; set; } = new();
    public List<MonthlyTrend> Last3MonthsTrends { get; set; } = new();
    public List<MonthlyTrend> ThisMonthTrends { get; set; } = new();
    public List<MonthlyTrend> DailyTrendsThisMonth { get; set; } = new();
    public List<MonthlyTrend> DailyTrendsLast14Days { get; set; } = new();
    public List<MonthlyTrend> DailyTrendsLast7Days { get; set; } = new();

    public List<StatusDistribution> ApplicationStatus { get; set; } = new();

    public record MonthlyTrend(string Month, int Count, string? FormattedLabel = null);
    public record StatusDistribution(string Status, long Count, int Percentage, string Color);
}

// --- Assistant DTOs ---
public class AssistantQueryRequest
{
    public string? Query { get; set; }
    public string? Action { get; set; }
    public long? SelectedApplicationId { get; set; }
}

public class AssistantCardDTO
{
    public string Type { get; set; } = string.Empty;
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Badge { get; set; } = string.Empty;
    public string BadgeColor { get; set; } = "blue";
    public string ActionType { get; set; } = "ATTENTION";
    public string Link { get; set; } = "/tracker";
    public string? Company { get; set; }
    public string? Role { get; set; }
    public string? Status { get; set; }
    public string? Date { get; set; }
    public string? RecruiterName { get; set; }
    public string? RecruiterEmail { get; set; }

    public AssistantCardDTO() {}

    public AssistantCardDTO(string type, long id, string title, string subtitle, string badge, string badgeColor,
                            string actionType, string link, string? company, string? role, string? status,
                            string? date, string? recruiterName, string? recruiterEmail)
    {
        Type = type;
        Id = id;
        Title = title;
        Subtitle = subtitle;
        Badge = badge;
        BadgeColor = badgeColor;
        ActionType = actionType;
        Link = link;
        Company = company;
        Role = role;
        Status = status;
        Date = date;
        RecruiterName = recruiterName;
        RecruiterEmail = recruiterEmail;
    }
}

public record AssistantEmailDraftDTO(
    string RecipientEmail,
    string Subject,
    string Body,
    string RecruiterName,
    string Company,
    string Role,
    string DraftType
);

public class AssistantQueryResponse
{
    public string Reply { get; set; } = string.Empty;
    public List<string> Suggestions { get; set; } = new();
    public List<AssistantCardDTO>? ActionCards { get; set; }
    public AssistantEmailDraftDTO? EmailDraft { get; set; }
    public object? Metadata { get; set; }

    public AssistantQueryResponse() {}

    public AssistantQueryResponse(string reply, List<string> suggestions, List<AssistantCardDTO>? actionCards = null,
                                  AssistantEmailDraftDTO? emailDraft = null, object? metadata = null)
    {
        Reply = reply;
        Suggestions = suggestions;
        ActionCards = actionCards;
        EmailDraft = emailDraft;
        Metadata = metadata;
    }
}

// --- Gmail DTOs ---
public record GmailStatusResponse(
    bool Connected,
    string? Email,
    string Provider,
    DateTime? LastSyncedAt,
    int TotalEmailsScanned,
    bool Configured,
    string? Scope,
    bool HasSendPermission
);

public record GmailSyncResponse(
    bool Success,
    int TotalScanned,
    int JobRelatedFound,
    int ApplicationsCreated,
    int ApplicationsUpdated,
    int InterviewsCreated,
    int FollowUpsCreated,
    int TotalProcessed,
    string Message,
    DateTime Timestamp
);

public record GoogleAuthUrlResponse(
    string Url,
    string? State
);
