using CareerMail.Api.Models.Enums;

namespace CareerMail.Api.Services.Analyzer;

public class AnalysisResult
{
    public bool JobRelated { get; set; }
    public string? Company { get; set; }
    public string? JobTitle { get; set; }
    public ApplicationStatus? Status { get; set; }
    public EmailClassification? Classification { get; set; }
    public string? Location { get; set; }
    public string? EmploymentType { get; set; }
    public string? Salary { get; set; }
    public string? RecruiterName { get; set; }
    public string? RecruiterEmail { get; set; }
    public string? RecruiterTitle { get; set; }
    public string? RecruiterPhone { get; set; }
    public string? RecruiterLinkedin { get; set; }
    public RecruiterType RecruiterType { get; set; } = RecruiterType.NO_RECRUITER_IDENTIFIED;
    public int? ContactConfidence { get; set; }
    public string? ContactExtractionSource { get; set; }

    public DateOnly? Deadline { get; set; }
    public DateTime? InterviewDateTime { get; set; }
    public string? InterviewType { get; set; }
    public string? InterviewLink { get; set; }
    public string? TimelineNote { get; set; }
    public double Confidence { get; set; }

    public static AnalysisResult NonJob() => new() { JobRelated = false, Confidence = 0.0 };
}
