using System.Text.Json;
using System.Text.RegularExpressions;
using CareerMail.Api.Models.Entities;

namespace CareerMail.Api.Services;

public class CandidateDomainProfile
{
    public List<string> TargetRoles { get; set; } = new();
    public List<string> ExtractedSkills { get; set; } = new();
    public List<string> DynamicSearchQueries { get; set; } = new();
    public string PrimaryDomain { get; set; } = "General Software Engineering";
    public bool IsDataScienceOrAi { get; set; }
    public bool IsFrontendOrWeb { get; set; }
    public bool IsBackendOrSystems { get; set; }
    public bool IsDevOpsOrCloud { get; set; }
    public int ExperienceYears { get; set; }
}

public interface ICandidateDomainEngine
{
    CandidateDomainProfile AnalyzeProfile(CvProfile profile);
    int CalculateRoleCompatibility(CandidateDomainProfile candidate, string jobTitle);
}

public class CandidateDomainEngine : ICandidateDomainEngine
{
    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "the", "a", "an", "and", "or", "in", "on", "at", "for", "with", "to", "of", "by", "&", "/"
    };

    public CandidateDomainProfile AnalyzeProfile(CvProfile profile)
    {
        var skills = JsonSerializer.Deserialize<List<string>>(profile.ExtractedSkillsJson ?? "[]") ?? new List<string>();
        var roles = JsonSerializer.Deserialize<List<string>>(profile.TargetRolesJson ?? "[]") ?? new List<string>();

        var skillsSet = new HashSet<string>(skills, StringComparer.OrdinalIgnoreCase);
        var combinedText = $"{profile.RawText} {string.Join(" ", roles)} {string.Join(" ", skills)}".ToLowerInvariant();

        // 1. Detect dynamic domain signals from candidate's genuine skillset
        int dataSignals = CountMatchingKeywords(combinedText, skillsSet, new[]
        {
            "data science", "machine learning", "deep learning", "pytorch", "tensorflow", "scikit-learn",
            "pandas", "numpy", "ai", "artificial intelligence", "data analyst", "statistics", "nlp", "computer vision",
            "llm", "neural network"
        });

        int frontendSignals = CountMatchingKeywords(combinedText, skillsSet, new[]
        {
            "react", "vue", "angular", "typescript", "javascript", "html", "css", "tailwind",
            "next.js", "frontend", "ui", "ux", "redux", "web design"
        });

        int backendSignals = CountMatchingKeywords(combinedText, skillsSet, new[]
        {
            "c#", ".net", "asp.net", "java", "spring boot", "golang", "go", "rust", "c++",
            "fastapi", "django", "flask", "postgresql", "sql", "mysql", "mongodb", "redis",
            "microservices", "rest api", "backend"
        });

        int devOpsSignals = CountMatchingKeywords(combinedText, skillsSet, new[]
        {
            "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ci/cd", "devops",
            "sre", "linux", "cloud", "infrastructure"
        });

        bool isData = dataSignals >= 2 || (dataSignals >= 1 && (roles.Any(r => r.Contains("Data", StringComparison.OrdinalIgnoreCase) || r.Contains("Learning", StringComparison.OrdinalIgnoreCase))));
        bool isFrontend = frontendSignals >= 2 || roles.Any(r => r.Contains("Frontend", StringComparison.OrdinalIgnoreCase) || r.Contains("React", StringComparison.OrdinalIgnoreCase));
        bool isBackend = backendSignals >= 2 || roles.Any(r => r.Contains("Backend", StringComparison.OrdinalIgnoreCase) || r.Contains(".NET", StringComparison.OrdinalIgnoreCase) || r.Contains("C#", StringComparison.OrdinalIgnoreCase));
        bool isDevOps = devOpsSignals >= 2 || roles.Any(r => r.Contains("DevOps", StringComparison.OrdinalIgnoreCase) || r.Contains("Cloud", StringComparison.OrdinalIgnoreCase));

        string primaryDomain = "Software Engineering";
        if (dataSignals > frontendSignals && dataSignals > backendSignals && dataSignals > devOpsSignals)
        {
            primaryDomain = "Data Science & Artificial Intelligence";
        }
        else if (frontendSignals > dataSignals && frontendSignals > backendSignals && frontendSignals > devOpsSignals)
        {
            primaryDomain = "Frontend Web Development";
        }
        else if (backendSignals > dataSignals && backendSignals > frontendSignals && backendSignals > devOpsSignals)
        {
            primaryDomain = "Backend & Systems Engineering";
        }
        else if (devOpsSignals > dataSignals && devOpsSignals > frontendSignals && devOpsSignals > backendSignals)
        {
            primaryDomain = "DevOps & Cloud Architecture";
        }

        // 2. Generate dynamic search queries
        var queries = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // Include candidate's target roles
        foreach (var r in roles)
        {
            if (!string.IsNullOrWhiteSpace(r)) queries.Add(r.Trim());
        }

        // If Data Science profile, add data queries dynamically
        if (isData)
        {
            queries.Add("Data Scientist");
            queries.Add("Machine Learning Engineer");
            queries.Add("Data Science");
        }
        else if (isFrontend)
        {
            queries.Add("Frontend Engineer");
            queries.Add("React Developer");
        }
        else if (isBackend)
        {
            queries.Add("Backend Engineer");
            queries.Add("Software Engineer");
        }
        else if (isDevOps)
        {
            queries.Add("DevOps Engineer");
            queries.Add("Cloud Engineer");
        }

        if (queries.Count == 0)
        {
            queries.Add("Software Engineer");
        }

        return new CandidateDomainProfile
        {
            TargetRoles = roles,
            ExtractedSkills = skills,
            DynamicSearchQueries = queries.ToList(),
            PrimaryDomain = primaryDomain,
            IsDataScienceOrAi = isData,
            IsFrontendOrWeb = isFrontend,
            IsBackendOrSystems = isBackend,
            IsDevOpsOrCloud = isDevOps,
            ExperienceYears = profile.ExperienceYears
        };
    }

    public int CalculateRoleCompatibility(CandidateDomainProfile candidate, string jobTitle)
    {
        if (string.IsNullOrWhiteSpace(jobTitle)) return 0;

        string lowerTitle = jobTitle.ToLowerInvariant();
        var jobTokens = Tokenize(lowerTitle);

        int maxScore = 0;

        // 1. Direct Target Role Match
        foreach (var targetRole in candidate.TargetRoles)
        {
            string lowerTarget = targetRole.ToLowerInvariant();
            if (lowerTitle.Contains(lowerTarget) || lowerTarget.Contains(lowerTitle))
            {
                return 25; // Perfect 25/25 role score
            }

            var targetTokens = Tokenize(lowerTarget);
            var common = jobTokens.Intersect(targetTokens, StringComparer.OrdinalIgnoreCase).ToList();

            if (common.Count > 0)
            {
                // Score based on token overlap percentage
                double overlapRatio = (double)common.Count / Math.Max(1, targetTokens.Count);
                int score = (int)Math.Round(overlapRatio * 23.0);
                if (score > maxScore) maxScore = score;
            }
        }

        // 2. Domain Affinity Alignment
        bool jobIsData = lowerTitle.Contains("data") || lowerTitle.Contains("ml") || lowerTitle.Contains("machine learning") || lowerTitle.Contains("ai ") || lowerTitle.Contains("scientist") || lowerTitle.Contains("analytics");
        bool jobIsFrontend = lowerTitle.Contains("frontend") || lowerTitle.Contains("front end") || lowerTitle.Contains("react") || lowerTitle.Contains("ui developer");
        bool jobIsBackend = lowerTitle.Contains("backend") || lowerTitle.Contains("back end") || lowerTitle.Contains("c#") || lowerTitle.Contains(".net") || lowerTitle.Contains("java") || lowerTitle.Contains("golang");
        bool jobIsDevOps = lowerTitle.Contains("devops") || lowerTitle.Contains("cloud") || lowerTitle.Contains("sre") || lowerTitle.Contains("infrastructure");

        if (candidate.IsDataScienceOrAi)
        {
            if (jobIsData)
            {
                maxScore = Math.Max(maxScore, 18);
            }
            else if (lowerTitle.Contains("software engineer") || lowerTitle.Contains("developer"))
            {
                // Software engineer is related to data science programming, but not high priority (6-8 pts)
                maxScore = Math.Max(maxScore, 7);
            }
            else
            {
                maxScore = Math.Max(maxScore, 2); // Disparate domain
            }
        }
        else if (candidate.IsFrontendOrWeb)
        {
            if (jobIsFrontend)
            {
                maxScore = Math.Max(maxScore, 18);
            }
            else if (lowerTitle.Contains("software engineer") || lowerTitle.Contains("full stack"))
            {
                maxScore = Math.Max(maxScore, 12);
            }
            else
            {
                maxScore = Math.Max(maxScore, 2);
            }
        }
        else if (candidate.IsBackendOrSystems)
        {
            if (jobIsBackend)
            {
                maxScore = Math.Max(maxScore, 18);
            }
            else if (lowerTitle.Contains("software engineer"))
            {
                maxScore = Math.Max(maxScore, 14);
            }
            else
            {
                maxScore = Math.Max(maxScore, 2);
            }
        }
        else if (candidate.IsDevOpsOrCloud)
        {
            if (jobIsDevOps)
            {
                maxScore = Math.Max(maxScore, 18);
            }
            else if (lowerTitle.Contains("engineer") || lowerTitle.Contains("platform"))
            {
                maxScore = Math.Max(maxScore, 10);
            }
            else
            {
                maxScore = Math.Max(maxScore, 2);
            }
        }
        else
        {
            // Default generic fallback
            if (lowerTitle.Contains("software") || lowerTitle.Contains("developer") || lowerTitle.Contains("engineer"))
            {
                maxScore = Math.Max(maxScore, 12);
            }
            else
            {
                maxScore = Math.Max(maxScore, 4);
            }
        }

        return Math.Clamp(maxScore, 0, 25);
    }

    private static int CountMatchingKeywords(string text, HashSet<string> skills, string[] keywords)
    {
        int count = 0;
        foreach (var k in keywords)
        {
            if (skills.Contains(k) || text.Contains(k))
            {
                count++;
            }
        }
        return count;
    }

    private static HashSet<string> Tokenize(string text)
    {
        var tokens = Regex.Split(text, @"[\s\/\-\,\&]+");
        return tokens
            .Where(t => t.Length > 1 && !StopWords.Contains(t))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
