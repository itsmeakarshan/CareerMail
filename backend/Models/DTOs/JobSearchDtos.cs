namespace CareerMail.Api.Models.Dtos;

public class CvProfileDto
{
    public long Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public List<string> ExtractedSkills { get; set; } = new();
    public List<string> TargetRoles { get; set; } = new();
    public int ExperienceYears { get; set; }
    public string EducationLevel { get; set; } = string.Empty;
    public string PreferredLocation { get; set; } = string.Empty;
    public bool IsRemotePreferred { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class ConvertJobToApplicationRequest
{
    public string Title { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string EmploymentType { get; set; } = "Full-time";
    public string Salary { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class SaveJobRequest
{
    public string JobId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string EmploymentType { get; set; } = string.Empty;
    public string Salary { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public int MatchScore { get; set; }
}
