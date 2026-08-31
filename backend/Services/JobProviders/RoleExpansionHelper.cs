using System.Text.RegularExpressions;

namespace CareerMail.Api.Services.JobProviders;

public static class RoleExpansionHelper
{
    // Common role descriptor modifiers that can be combined dynamically
    private static readonly string[] SeniorityModifiers = new[]
    {
        "Graduate", "Junior", "Associate", "Entry Level", "Trainee", "Intern", "Mid", "Senior", "Lead", "Staff", "Principal", "Head of", "Director"
    };

    /// <summary>
    /// Dynamically expands a role query into relevant variations based on role tokens and patterns
    /// without hardcoding static single-role silos.
    /// </summary>
    public static List<string> ExpandRole(string? roleQuery)
    {
        if (string.IsNullOrWhiteSpace(roleQuery))
        {
            return new List<string>();
        }

        string q = roleQuery.Trim();
        var expansions = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { q };

        string lower = q.ToLowerInvariant();

        // 1. Data Science / AI / ML Dynamic Expansions
        if (lower.Contains("data scien") || lower.Contains("machine learn") || lower.Contains("ai ") || lower.Contains("ml ") || lower.Contains("artificial intel") || lower.Contains("applied scien"))
        {
            expansions.Add("Data Scientist");
            expansions.Add("Graduate Data Scientist");
            expansions.Add("Junior Data Scientist");
            expansions.Add("Machine Learning Engineer");
            expansions.Add("ML Engineer");
            expansions.Add("AI Engineer");
            expansions.Add("Applied Scientist");
            expansions.Add("Research Scientist");
            expansions.Add("Data Science Associate");
            expansions.Add("Data Analyst");
            expansions.Add("Analytics Engineer");
            expansions.Add("Decision Scientist");
        }
        // 2. Data Engineering / Big Data Expansions
        else if (lower.Contains("data eng") || lower.Contains("big data") || lower.Contains("etl") || lower.Contains("data platform"))
        {
            expansions.Add("Data Engineer");
            expansions.Add("Big Data Engineer");
            expansions.Add("Data Platform Engineer");
            expansions.Add("Analytics Engineer");
            expansions.Add("ETL Developer");
            expansions.Add("Data Infrastructure Engineer");
        }
        // 3. Frontend / UI Web Expansions
        else if (lower.Contains("frontend") || lower.Contains("front end") || lower.Contains("front-end") || lower.Contains("react") || lower.Contains("ui developer") || lower.Contains("web developer"))
        {
            expansions.Add("Frontend Engineer");
            expansions.Add("Front End Developer");
            expansions.Add("React Developer");
            expansions.Add("UI Developer");
            expansions.Add("Full Stack Developer");
            expansions.Add("Web Developer");
            expansions.Add("TypeScript Engineer");
        }
        // 4. Backend / API / Distributed Systems Expansions
        else if (lower.Contains("backend") || lower.Contains("back end") || lower.Contains("back-end") || lower.Contains("c#") || lower.Contains(".net") || lower.Contains("api") || lower.Contains("java") || lower.Contains("golang") || lower.Contains("python dev"))
        {
            expansions.Add("Backend Engineer");
            expansions.Add("Back End Developer");
            expansions.Add("Software Engineer");
            expansions.Add("C# .NET Engineer");
            expansions.Add("Java Engineer");
            expansions.Add("Platform Engineer");
            expansions.Add("API Developer");
        }
        // 5. Cloud / DevOps / SRE Expansions
        else if (lower.Contains("devops") || lower.Contains("cloud") || lower.Contains("sre") || lower.Contains("site reliab") || lower.Contains("infrastructure"))
        {
            expansions.Add("DevOps Engineer");
            expansions.Add("Cloud Engineer");
            expansions.Add("Site Reliability Engineer");
            expansions.Add("SRE");
            expansions.Add("Platform Engineer");
            expansions.Add("Infrastructure Engineer");
            expansions.Add("Cloud Architect");
        }
        // 6. General Software Engineering Expansions
        else if (lower.Contains("software") || lower.Contains("developer") || lower.Contains("engineer") || lower.Contains("programmer") || lower.Contains("full stack") || lower.Contains("fullstack"))
        {
            expansions.Add("Software Engineer");
            expansions.Add("Software Developer");
            expansions.Add("Full Stack Developer");
            expansions.Add("Backend Engineer");
            expansions.Add("Frontend Engineer");
            expansions.Add("Application Developer");
        }
        // 7. Product Management Expansions
        else if (lower.Contains("product man") || lower.Contains("product own") || lower.Contains("pm"))
        {
            expansions.Add("Product Manager");
            expansions.Add("Associate Product Manager");
            expansions.Add("Technical Product Manager");
            expansions.Add("Product Owner");
        }

        // Add dynamic seniority variations if not already included
        var baseList = expansions.ToList();
        foreach (var item in baseList)
        {
            if (!item.StartsWith("Graduate", StringComparison.OrdinalIgnoreCase) && !item.StartsWith("Junior", StringComparison.OrdinalIgnoreCase))
            {
                expansions.Add($"Graduate {item}");
                expansions.Add($"Junior {item}");
            }
        }

        return expansions.ToList();
    }

    /// <summary>
    /// Evaluates if a job title matches any expanded role dynamically using token overlap and phrase matching.
    /// </summary>
    public static bool MatchesExpandedRole(string jobTitle, List<string> expandedRoles)
    {
        if (expandedRoles == null || expandedRoles.Count == 0) return true;
        if (string.IsNullOrWhiteSpace(jobTitle)) return false;

        string titleLower = jobTitle.ToLowerInvariant();
        var titleWords = Regex.Split(titleLower, @"[\s\/\-\,\&]+").Where(w => w.Length > 2).ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var role in expandedRoles)
        {
            string roleLower = role.ToLowerInvariant();
            if (titleLower.Contains(roleLower) || roleLower.Contains(titleLower))
            {
                return true;
            }

            var roleWords = Regex.Split(roleLower, @"[\s\/\-\,\&]+").Where(w => w.Length > 2).ToList();
            if (roleWords.Count > 0 && roleWords.All(rw => titleWords.Contains(rw)))
            {
                return true;
            }
        }

        return false;
    }
}
