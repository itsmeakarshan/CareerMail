using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CareerMail.Api.Models.Entities;

[Table("cv_profiles")]
public class CvProfile
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Column("user_id")]
    public long UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Column("file_name")]
    public string FileName { get; set; } = string.Empty;

    [Column("raw_text")]
    public string RawText { get; set; } = string.Empty;

    [Column("extracted_skills")]
    public string ExtractedSkillsJson { get; set; } = "[]";

    [Column("target_roles")]
    public string TargetRolesJson { get; set; } = "[]";

    [Column("experience_years")]
    public int ExperienceYears { get; set; }

    [Column("education_level")]
    public string EducationLevel { get; set; } = string.Empty;

    [Column("preferred_location")]
    public string PreferredLocation { get; set; } = string.Empty;

    [Column("is_remote_preferred")]
    public bool IsRemotePreferred { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
