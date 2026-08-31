using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using CareerMail.Api.Models.Enums;

namespace CareerMail.Api.Models.Entities;

[Table("users")]
public class User
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Email { get; set; } = string.Empty;

    [JsonIgnore]
    [Required]
    public string Password { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    [JsonIgnore]
    [Column("gemini_api_key")]
    public string? GeminiApiKey { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public List<JobApplication> JobApplications { get; set; } = new();

    [JsonIgnore]
    public List<Email> Emails { get; set; } = new();

    [JsonIgnore]
    public List<Interview> Interviews { get; set; } = new();

    [JsonIgnore]
    public List<FollowUp> FollowUps { get; set; } = new();

    [JsonIgnore]
    public List<ConnectedAccount> ConnectedAccounts { get; set; } = new();
}

[Table("connected_accounts")]
public class ConnectedAccount
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long UserId { get; set; }

    [JsonIgnore]
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [Required]
    public string Provider { get; set; } = "google";

    public string? ProviderEmail { get; set; }

    public string? ProviderAccountId { get; set; }

    [JsonIgnore]
    [Column(TypeName = "text")]
    public string? AccessToken { get; set; }

    [JsonIgnore]
    [Column(TypeName = "text")]
    public string? RefreshToken { get; set; }

    public DateTime? TokenExpiry { get; set; }

    public string? Scope { get; set; }

    public DateTime? LastSyncedAt { get; set; }

    public int TotalEmailsScanned { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("job_applications")]
public class JobApplication
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long UserId { get; set; }

    [JsonIgnore]
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [Required]
    public string Company { get; set; } = string.Empty;

    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Location { get; set; } = "Remote";

    public string? EmploymentType { get; set; } = "Full-time";

    public string? Salary { get; set; }

    public DateOnly? DateApplied { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    public ApplicationStatus Status { get; set; } = ApplicationStatus.APPLIED;

    public Priority Priority { get; set; } = Priority.MEDIUM;

    public string? RecruiterName { get; set; }
    public string? RecruiterEmail { get; set; }
    public string? RecruiterTitle { get; set; }
    public string? RecruiterPhone { get; set; }
    public string? RecruiterLinkedin { get; set; }

    public RecruiterType RecruiterType { get; set; } = RecruiterType.NO_RECRUITER_IDENTIFIED;

    public int? ContactConfidence { get; set; }
    public string? ContactExtractionSource { get; set; }

    public string? Source { get; set; }

    [Column(TypeName = "text")]
    public string? Notes { get; set; }

    public DateOnly? LastActivityDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateOnly? NextFollowUpDate { get; set; }

    public string? CompanyLogo { get; set; }
    public string? ActivitySubtitle { get; set; } = "Applied recently";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<TimelineEvent> TimelineEvents { get; set; } = new();

    public List<Interview> Interviews { get; set; } = new();

    public List<FollowUp> FollowUps { get; set; } = new();

    [JsonIgnore]
    public List<Email> Emails { get; set; } = new();
}

[Table("timeline_events")]
public class TimelineEvent
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long JobApplicationId { get; set; }

    [JsonIgnore]
    [ForeignKey(nameof(JobApplicationId))]
    public JobApplication JobApplication { get; set; } = null!;

    [Required]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string? Description { get; set; }

    [Required]
    public DateTime EventDate { get; set; } = DateTime.UtcNow;

    public string? EventType { get; set; }
}

[Table("emails")]
public class Email
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long UserId { get; set; }

    [JsonIgnore]
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [Required]
    public string Sender { get; set; } = string.Empty;

    [Required]
    public string SenderEmail { get; set; } = string.Empty;

    public string? RecipientEmail { get; set; }

    [Required]
    public string Subject { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string? Preview { get; set; }

    [Required]
    [Column(TypeName = "text")]
    public string Body { get; set; } = string.Empty;

    [Required]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public bool IsRead { get; set; } = false;
    public bool IsStarred { get; set; } = false;
    public bool IsImportant { get; set; } = false;

    public EmailFolder Folder { get; set; } = EmailFolder.INBOX;

    public string? Labels { get; set; }

    public long? JobApplicationId { get; set; }

    [ForeignKey(nameof(JobApplicationId))]
    public JobApplication? JobApplication { get; set; }

    public bool IsJobRelated { get; set; } = false;
    public string? DetectedCompany { get; set; }
    public string? DetectedRole { get; set; }
    public string? DetectedStatus { get; set; }

    public string? DetectedRecruiterName { get; set; }
    public string? DetectedRecruiterEmail { get; set; }
    public string? DetectedRecruiterTitle { get; set; }

    public RecruiterType? DetectedRecruiterType { get; set; }
    public int? DetectedRecruiterConfidence { get; set; }

    public EmailClassification? Classification { get; set; }

    public string? GmailMessageId { get; set; }
    public string? GmailThreadId { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

[Table("interviews")]
public class Interview
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long? JobApplicationId { get; set; }

    [ForeignKey(nameof(JobApplicationId))]
    public JobApplication? JobApplication { get; set; }

    public long UserId { get; set; }

    [JsonIgnore]
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [Required]
    public string Company { get; set; } = string.Empty;

    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public DateTime InterviewDate { get; set; }

    public string? Type { get; set; } = "Technical Interview";
    public string? Interviewer { get; set; }
    public string? Location { get; set; } = "Google Meet";
    public string? MeetingLink { get; set; }

    [Column(TypeName = "text")]
    public string? PreparationNotes { get; set; }

    public InterviewStatus Status { get; set; } = InterviewStatus.SCHEDULED;

    public string? DaysAwayBadge { get; set; }
    public string? CompanyLogo { get; set; }
}

[Table("follow_ups")]
public class FollowUp
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long? JobApplicationId { get; set; }

    [ForeignKey(nameof(JobApplicationId))]
    public JobApplication? JobApplication { get; set; }

    public long UserId { get; set; }

    [JsonIgnore]
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [Required]
    public string Company { get; set; } = string.Empty;

    public string? Role { get; set; }

    [Required]
    public DateOnly DueDate { get; set; }

    public string? AppliedSubtitle { get; set; }
    public string? DaysDueBadge { get; set; }
    public string? CompanyLogo { get; set; }

    public FollowUpStatus Status { get; set; } = FollowUpStatus.PENDING;

    [Column(TypeName = "text")]
    public string? Notes { get; set; }
}
