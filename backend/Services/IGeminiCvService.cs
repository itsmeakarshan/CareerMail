namespace CareerMail.Api.Services;

public class GeminiStructuredCvProfileDto
{
    public List<string> TechnicalSkills { get; set; } = new();
    public List<string> ProgrammingLanguages { get; set; } = new();
    public List<string> Frameworks { get; set; } = new();
    public List<string> Databases { get; set; } = new();
    public List<string> CloudPlatforms { get; set; } = new();
    public List<string> Tools { get; set; } = new();
    public List<string> DataSkills { get; set; } = new();
    public List<string> AiMlSkills { get; set; } = new();
    public List<string> SoftSkills { get; set; } = new();
    public List<string> JobTitles { get; set; } = new();
    public int? ExperienceYears { get; set; }
    public List<string> Education { get; set; } = new();
    public List<string> NormalisedSkills { get; set; } = new();
}

public interface IGeminiCvService
{
    Task<(bool Success, string Message)> TestApiKeyAsync(string apiKey);
    Task<GeminiStructuredCvProfileDto?> ExtractStructuredCvAsync(string rawCvText, string apiKey);
    Task<string?> ResolveRealJobUrlAsync(string jobTitle, string companyName, string location, string? currentUrl, string? apiKey);
}
