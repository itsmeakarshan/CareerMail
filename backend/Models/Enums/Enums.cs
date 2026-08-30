using System.Text.Json.Serialization;

namespace CareerMail.Api.Models.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ApplicationStatus
{
    APPLIED,
    ASSESSMENT,
    RECRUITER_SCREEN,
    INTERVIEW,
    FINAL_INTERVIEW,
    OFFER,
    REJECTED,
    WITHDRAWN
}

public static class ApplicationStatusExtensions
{
    public static string GetDisplayName(this ApplicationStatus status) => status switch
    {
        ApplicationStatus.APPLIED => "Applied",
        ApplicationStatus.ASSESSMENT => "Assessment",
        ApplicationStatus.RECRUITER_SCREEN => "Recruiter Screen",
        ApplicationStatus.INTERVIEW => "Interview",
        ApplicationStatus.FINAL_INTERVIEW => "Final Interview",
        ApplicationStatus.OFFER => "Offer",
        ApplicationStatus.REJECTED => "Rejected",
        ApplicationStatus.WITHDRAWN => "Withdrawn",
        _ => "Applied"
    };

    public static ApplicationStatus FromString(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return ApplicationStatus.APPLIED;
        var normalized = text.Trim().ToUpper().Replace(" ", "_").Replace("-", "_");
        if (Enum.TryParse<ApplicationStatus>(normalized, true, out var status))
        {
            return status;
        }
        foreach (ApplicationStatus val in Enum.GetValues<ApplicationStatus>())
        {
            if (string.Equals(val.GetDisplayName(), text.Trim(), StringComparison.OrdinalIgnoreCase))
                return val;
        }
        return ApplicationStatus.APPLIED;
    }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EmailClassification
{
    APPLICATION_SUBMITTED,
    APPLICATION_RECEIVED,
    RECRUITER_MESSAGE,
    INTERVIEW_INVITATION,
    INTERVIEW_SCHEDULED,
    ASSESSMENT,
    REJECTION,
    OFFER,
    STATUS_UPDATE,
    NEW_OPPORTUNITY,
    OTHER_JOB_RELATED
}

public static class EmailClassificationExtensions
{
    public static string GetDisplayName(this EmailClassification classification) => classification switch
    {
        EmailClassification.APPLICATION_SUBMITTED => "Application Submitted",
        EmailClassification.APPLICATION_RECEIVED => "Application Received",
        EmailClassification.RECRUITER_MESSAGE => "Recruiter Message",
        EmailClassification.INTERVIEW_INVITATION => "Interview Invitation",
        EmailClassification.INTERVIEW_SCHEDULED => "Interview Scheduled",
        EmailClassification.ASSESSMENT => "Assessment / Coding Test",
        EmailClassification.REJECTION => "Rejection",
        EmailClassification.OFFER => "Job Offer",
        EmailClassification.STATUS_UPDATE => "Status Update",
        EmailClassification.NEW_OPPORTUNITY => "New Opportunity",
        EmailClassification.OTHER_JOB_RELATED => "Other Job Related",
        _ => "Job Related"
    };
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EmailFolder
{
    INBOX,
    SENT,
    DRAFTS,
    ARCHIVE,
    TRASH
}

public static class EmailFolderExtensions
{
    public static EmailFolder FromString(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return EmailFolder.INBOX;
        return Enum.TryParse<EmailFolder>(text.Trim().ToUpper(), true, out var folder) ? folder : EmailFolder.INBOX;
    }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FollowUpStatus
{
    PENDING,
    COMPLETED,
    DISMISSED
}

public static class FollowUpStatusExtensions
{
    public static FollowUpStatus FromString(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return FollowUpStatus.PENDING;
        return Enum.TryParse<FollowUpStatus>(text.Trim().ToUpper(), true, out var status) ? status : FollowUpStatus.PENDING;
    }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InterviewStatus
{
    SCHEDULED,
    COMPLETED,
    CANCELLED
}

public static class InterviewStatusExtensions
{
    public static InterviewStatus FromString(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return InterviewStatus.SCHEDULED;
        return Enum.TryParse<InterviewStatus>(text.Trim().ToUpper(), true, out var status) ? status : InterviewStatus.SCHEDULED;
    }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Priority
{
    LOW,
    MEDIUM,
    HIGH
}

public static class PriorityExtensions
{
    public static Priority FromString(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return Priority.MEDIUM;
        return Enum.TryParse<Priority>(text.Trim().ToUpper(), true, out var priority) ? priority : Priority.MEDIUM;
    }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RecruiterType
{
    HUMAN_RECRUITER,
    POSSIBLE_RECRUITER,
    AUTOMATED_SYSTEM,
    NO_RECRUITER_IDENTIFIED
}
