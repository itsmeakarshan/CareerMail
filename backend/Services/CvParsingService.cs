using System.Text.RegularExpressions;
using System.Text.Json;
using DocumentFormat.OpenXml.Packaging;
using UglyToad.PdfPig;
using CareerMail.Api.Data;
using CareerMail.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Services;

public interface ICvParsingService
{
    Task<CvProfile> ParseAndSaveCvAsync(long userId, Stream fileStream, string fileName);
    CvProfile ExtractProfileFromText(string rawText, long userId, string fileName);
}

public class CvParsingService : ICvParsingService
{
    private readonly IGeminiCvService _geminiCvService;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CvParsingService> _logger;

    private static readonly string[] SkillTaxonomy = new[]
    {
        "C#", ".NET", "ASP.NET", "EF Core", "Entity Framework",
        "React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind CSS", "Next.js", "Vue", "Angular", "Sass",
        "Python", "Django", "FastAPI", "Flask", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Scikit-Learn",
        "Java", "Spring Boot", "Kotlin", "Swift", "Flutter", "React Native",
        "C++", "Rust", "Go", "Golang", "PHP", "Laravel", "Ruby", "Ruby on Rails",
        "SQL", "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Elasticsearch", "Cassandra",
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Cloud", "DevOps", "Terraform", "CI/CD", "GitHub Actions",
        "REST API", "GraphQL", "gRPC", "Microservices", "System Design", "WebSockets", "OAuth", "JWT",
        "Git", "Linux", "Unix", "Bash", "Shell", "Jira", "Agile", "Scrum",
        "Unit Testing", "Integration Testing", "Jest", "Cypress", "Selenium",
        "Machine Learning", "Artificial Intelligence", "Deep Learning", "NLP", "Data Science", "Data Engineering",
        "UI/UX", "Figma", "Cybersecurity", "Embedded Systems", "Product Management"
    };

    private static readonly string[] RoleTaxonomy = new[]
    {
        "Software Engineer", "Full Stack Developer", "Frontend Developer", "Backend Developer",
        "Web Developer", "Software Developer", "Dotnet Developer", "React Developer", "Python Developer",
        "Data Scientist", "Data Analyst", "Data Engineer", "Machine Learning Engineer", "AI Engineer",
        "DevOps Engineer", "Cloud Engineer", "Systems Architect", "Solutions Architect",
        "Product Manager", "Project Manager", "Scrum Master", "Technical Lead", "Engineering Manager",
        "QA Engineer", "Mobile Developer", "iOS Developer", "Android Developer", "UI/UX Designer"
    };

    public CvParsingService(
        IGeminiCvService geminiCvService,
        AppDbContext context,
        IConfiguration configuration,
        ILogger<CvParsingService> logger)
    {
        _geminiCvService = geminiCvService;
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<CvProfile> ParseAndSaveCvAsync(long userId, Stream fileStream, string fileName)
    {
        string rawText = string.Empty;
        var ext = Path.GetExtension(fileName).ToLowerInvariant();

        try
        {
            if (ext == ".pdf")
            {
                using var pdf = PdfDocument.Open(fileStream);
                var pageTexts = new List<string>();
                foreach (var page in pdf.GetPages())
                {
                    pageTexts.Add(page.Text);
                }
                rawText = string.Join("\n", pageTexts);
            }
            else if (ext == ".docx")
            {
                using var wordDoc = WordprocessingDocument.Open(fileStream, false);
                rawText = wordDoc.MainDocumentPart?.Document?.Body?.InnerText ?? string.Empty;
            }
            else
            {
                using var reader = new StreamReader(fileStream);
                rawText = await reader.ReadToEndAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse binary file structure for {FileName}", fileName);
            rawText = $"Failed to parse binary file structure: {ex.Message}. (Fallback text extraction applied)";
        }

        if (string.IsNullOrWhiteSpace(rawText))
        {
            rawText = $"Extracted text from {fileName}";
        }

        // Check if Gemini API key is available (User DB Key or Configuration)
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        var geminiKey = user?.GeminiApiKey ?? _configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        if (!string.IsNullOrWhiteSpace(geminiKey))
        {
            _logger.LogInformation("Invoking Gemini AI for CV skill extraction & normalization for user {UserId}", userId);
            var geminiResult = await _geminiCvService.ExtractStructuredCvAsync(rawText, geminiKey);
            if (geminiResult != null)
            {
                return BuildProfileFromGemini(geminiResult, rawText, userId, fileName);
            }
            _logger.LogWarning("Gemini analysis returned null, falling back to deterministic taxonomy extraction.");
        }

        return ExtractProfileFromText(rawText, userId, fileName);
    }

    private CvProfile BuildProfileFromGemini(GeminiStructuredCvProfileDto gemini, string rawText, long userId, string fileName)
    {
        var allSkills = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (gemini.NormalisedSkills != null) foreach (var s in gemini.NormalisedSkills) if (!string.IsNullOrWhiteSpace(s)) allSkills.Add(s.Trim());
        if (gemini.TechnicalSkills != null) foreach (var s in gemini.TechnicalSkills) if (!string.IsNullOrWhiteSpace(s)) allSkills.Add(s.Trim());
        if (gemini.ProgrammingLanguages != null) foreach (var s in gemini.ProgrammingLanguages) if (!string.IsNullOrWhiteSpace(s)) allSkills.Add(s.Trim());
        if (gemini.Frameworks != null) foreach (var s in gemini.Frameworks) if (!string.IsNullOrWhiteSpace(s)) allSkills.Add(s.Trim());
        if (gemini.Databases != null) foreach (var s in gemini.Databases) if (!string.IsNullOrWhiteSpace(s)) allSkills.Add(s.Trim());
        if (gemini.CloudPlatforms != null) foreach (var s in gemini.CloudPlatforms) if (!string.IsNullOrWhiteSpace(s)) allSkills.Add(s.Trim());
        if (gemini.Tools != null) foreach (var s in gemini.Tools) if (!string.IsNullOrWhiteSpace(s)) allSkills.Add(s.Trim());
        if (gemini.DataSkills != null) foreach (var s in gemini.DataSkills) if (!string.IsNullOrWhiteSpace(s)) allSkills.Add(s.Trim());
        if (gemini.AiMlSkills != null) foreach (var s in gemini.AiMlSkills) if (!string.IsNullOrWhiteSpace(s)) allSkills.Add(s.Trim());

        var targetRoles = (gemini.JobTitles != null && gemini.JobTitles.Count > 0)
            ? gemini.JobTitles.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()).Distinct().ToList()
            : new List<string> { "Software Engineer" };

        string education = (gemini.Education != null && gemini.Education.Count > 0)
            ? string.Join(", ", gemini.Education.Take(2))
            : "Bachelor's Degree";

        bool isRemotePreferred = Regex.IsMatch(rawText, @"\b(Remote|Work from home|Hybrid)\b", RegexOptions.IgnoreCase);
        string preferredLocation = "Flexible / Remote";
        var locMatch = Regex.Match(rawText, @"\b(London|Manchester|New York|San Francisco|Austin|Berlin|Toronto|Remote|UK|United Kingdom|USA)\b", RegexOptions.IgnoreCase);
        if (locMatch.Success)
        {
            preferredLocation = locMatch.Value;
        }

        return new CvProfile
        {
            UserId = userId,
            FileName = fileName,
            RawText = rawText,
            ExtractedSkillsJson = JsonSerializer.Serialize(allSkills.ToList()),
            TargetRolesJson = JsonSerializer.Serialize(targetRoles),
            ExperienceYears = Math.Max(0, gemini.ExperienceYears ?? 0),
            EducationLevel = education,
            PreferredLocation = preferredLocation,
            IsRemotePreferred = isRemotePreferred,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public CvProfile ExtractProfileFromText(string rawText, long userId, string fileName)
    {
        var extractedSkills = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var skill in SkillTaxonomy)
        {
            string pattern;
            if (skill.Equals(".NET", StringComparison.OrdinalIgnoreCase) || skill.Equals("C#", StringComparison.OrdinalIgnoreCase) || skill.Equals("C++", StringComparison.OrdinalIgnoreCase))
            {
                pattern = Regex.Escape(skill);
            }
            else
            {
                pattern = $@"\b{Regex.Escape(skill)}\b";
            }

            if (Regex.IsMatch(rawText, pattern, RegexOptions.IgnoreCase))
            {
                extractedSkills.Add(skill);
            }
        }

        var matchedRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var role in RoleTaxonomy)
        {
            if (Regex.IsMatch(rawText, $@"\b{Regex.Escape(role)}\b", RegexOptions.IgnoreCase))
            {
                matchedRoles.Add(role);
            }
        }

        if (matchedRoles.Count == 0)
        {
            if (extractedSkills.Contains("C#") || extractedSkills.Contains(".NET"))
            {
                matchedRoles.Add("Software Engineer");
                matchedRoles.Add("Dotnet Developer");
            }
            else if (extractedSkills.Contains("Python") || extractedSkills.Contains("Machine Learning") || extractedSkills.Contains("Data Science"))
            {
                matchedRoles.Add("Data Scientist");
                matchedRoles.Add("Machine Learning Engineer");
            }
            else if (extractedSkills.Contains("React") || extractedSkills.Contains("TypeScript") || extractedSkills.Contains("HTML"))
            {
                matchedRoles.Add("Frontend Developer");
            }
            else
            {
                matchedRoles.Add("Software Developer");
            }
        }

        int experienceYears = ExtractExperienceYears(rawText);

        string education = "Bachelor's Degree";
        if (Regex.IsMatch(rawText, @"\b(Ph\.?D|Doctorate)\b", RegexOptions.IgnoreCase))
        {
            education = "Doctorate / PhD";
        }
        else if (Regex.IsMatch(rawText, @"\b(Master|M\.S|M\.Sc|M\.Tech|MBA)\b", RegexOptions.IgnoreCase))
        {
            education = "Master's Degree";
        }
        else if (Regex.IsMatch(rawText, @"\b(Bachelor|B\.S|B\.Sc|B\.Tech|B\.E)\b", RegexOptions.IgnoreCase))
        {
            education = "Bachelor's Degree";
        }

        bool isRemotePreferred = Regex.IsMatch(rawText, @"\b(Remote|Work from home|Hybrid)\b", RegexOptions.IgnoreCase);
        string preferredLocation = "Flexible / Remote";

        var locationMatch = Regex.Match(rawText, @"\b(London|Manchester|New York|San Francisco|Austin|Berlin|Toronto|Remote|UK|United Kingdom|USA)\b", RegexOptions.IgnoreCase);
        if (locationMatch.Success)
        {
            preferredLocation = locationMatch.Value;
        }

        return new CvProfile
        {
            UserId = userId,
            FileName = fileName,
            RawText = rawText,
            ExtractedSkillsJson = JsonSerializer.Serialize(extractedSkills.ToList()),
            TargetRolesJson = JsonSerializer.Serialize(matchedRoles.ToList()),
            ExperienceYears = experienceYears,
            EducationLevel = education,
            PreferredLocation = preferredLocation,
            IsRemotePreferred = isRemotePreferred,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static int ExtractExperienceYears(string text)
    {
        var match = Regex.Match(text, @"(\d+)\+?\s*years?(?:\s+of)?\s+experience", RegexOptions.IgnoreCase);
        if (match.Success && int.TryParse(match.Groups[1].Value, out int yrs))
        {
            return Math.Min(yrs, 30);
        }

        var yearMatches = Regex.Matches(text, @"\b(20\d\d)\b");
        if (yearMatches.Count >= 2)
        {
            var years = yearMatches.Select(m => int.Parse(m.Value)).OrderBy(y => y).ToList();
            int span = years.Last() - years.First();
            if (span > 0 && span <= 25)
            {
                return span;
            }
        }

        return 0; // No experience specified -> 0 years (Graduate / Entry level)
    }
}
