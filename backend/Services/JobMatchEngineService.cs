using System.Text.Json;
using System.Text.RegularExpressions;
using CareerMail.Api.Models.Entities;

namespace CareerMail.Api.Services;

public class RelatedSkillMatchDto
{
    public string CandidateSkill { get; set; } = string.Empty;
    public string JobSkill { get; set; } = string.Empty;
    public double WeightMultiplier { get; set; } = 0.80; // 0.80 for strong, 0.50 for moderate
    public string RelationType { get; set; } = "Strong"; // Strong, Moderate
    public string Explanation { get; set; } = string.Empty;
}

public class JobMatchResult
{
    public int MatchScore { get; set; } // Out of 100
    public string MatchQualityLabel { get; set; } = "FAIR MATCH"; // STRONG MATCH, GOOD MATCH, FAIR MATCH, LOW MATCH
    public List<string> MatchingSkills { get; set; } = new();
    public List<RelatedSkillMatchDto> RelatedSkills { get; set; } = new();
    public List<string> MissingSkills { get; set; } = new();
    public int SkillsScore { get; set; } // Max 40
    public int RoleRelevanceScore { get; set; } // Max 25
    public int ExperienceRelevanceScore { get; set; } // Max 15
    public int LocationScore { get; set; } // Max 10
    public int EducationScore { get; set; } // Max 10
    public string Explanation { get; set; } = string.Empty;
}

public interface IJobMatchEngineService
{
    JobMatchResult CalculateMatch(
        CvProfile profile,
        string jobTitle,
        string company,
        string location,
        string employmentType,
        string description,
        List<string>? jobSkills = null);
}

public class JobMatchEngineService : IJobMatchEngineService
{
    private readonly ICandidateDomainEngine _domainEngine;

    public JobMatchEngineService(ICandidateDomainEngine domainEngine)
    {
        _domainEngine = domainEngine;
    }

    private static readonly string[] RecognizedSkills = new[]
    {
        "C#", ".NET", "ASP.NET", "EF Core", "Entity Framework", "React", "TypeScript", "JavaScript", "HTML", "CSS",
        "Tailwind CSS", "Next.js", "Vue", "Angular", "Python", "Django", "FastAPI", "Flask", "Java", "Spring Boot",
        "Kotlin", "Swift", "Flutter", "C++", "Rust", "Go", "Golang", "PHP", "Ruby", "SQL", "PostgreSQL", "MySQL",
        "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "DevOps", "Terraform", "CI/CD",
        "REST API", "GraphQL", "Microservices", "System Design", "Git", "Linux", "Agile", "Scrum",
        "Machine Learning", "Data Science", "Deep Learning", "PyTorch", "TensorFlow", "Pandas", "NumPy",
        "Scikit-Learn", "UI/UX", "Unit Testing", "Jest", "Data Engineering", "Data Analytics", "Statistical Modeling",
        "NLP", "Computer Vision", "Tableau", "PowerBI", "Spark", "Kafka", "Hadoop", "Snowflake", "BigQuery"
    };

    // Semantic Skill Relationship Graph (Candidate Skill -> Related Target Job Skill, Multiplier, Type)
    private static readonly List<(string CandidatePattern, string JobTargetPattern, double Multiplier, string RelationType, string Reason)> SemanticSkillRelations = new()
    {
        // AI / ML / Data Science Relationships
        ("Scikit-Learn", "Machine Learning", 0.85, "Strong", "Scikit-learn is a foundational Machine Learning framework"),
        ("PyTorch", "Deep Learning", 0.90, "Strong", "PyTorch directly applies to Deep Learning"),
        ("PyTorch", "Machine Learning", 0.85, "Strong", "PyTorch is a core Machine Learning library"),
        ("TensorFlow", "Deep Learning", 0.90, "Strong", "TensorFlow is a leading Deep Learning framework"),
        ("TensorFlow", "Machine Learning", 0.85, "Strong", "TensorFlow directly powers Machine Learning models"),
        ("Pandas", "Data Analytics", 0.85, "Strong", "Pandas is the industry standard for Data Analytics"),
        ("Pandas", "Data Science", 0.80, "Strong", "Pandas is integral to Data Science pipelines"),
        ("NumPy", "Data Science", 0.80, "Strong", "NumPy powers numerical computing in Data Science"),
        ("NumPy", "Machine Learning", 0.75, "Strong", "NumPy matrices underpin ML model training"),
        ("Data Science", "Machine Learning", 0.80, "Strong", "Data Science and ML are closely aligned domains"),
        ("Machine Learning", "Data Science", 0.80, "Strong", "ML expertise directly translates to Data Science"),
        ("Machine Learning", "Artificial Intelligence", 0.90, "Strong", "ML is the core discipline of modern AI"),
        ("Statistical Modeling", "Data Science", 0.90, "Strong", "Statistical modeling is core to Data Science"),

        // Web / Frontend Relationships
        ("React", "Frontend Development", 0.90, "Strong", "React is the primary frontend UI framework"),
        ("Next.js", "React", 0.90, "Strong", "Next.js is built directly on React"),
        ("Next.js", "Frontend Development", 0.90, "Strong", "Next.js powers full-stack frontend web apps"),
        ("TypeScript", "JavaScript", 0.90, "Strong", "TypeScript is a strongly-typed superset of JavaScript"),
        ("JavaScript", "Frontend Development", 0.85, "Strong", "JavaScript is the native language of the web"),
        ("HTML", "Frontend Development", 0.70, "Moderate", "HTML is fundamental web markup"),
        ("CSS", "Frontend Development", 0.70, "Moderate", "CSS controls frontend presentation"),
        ("Tailwind CSS", "CSS", 0.85, "Strong", "Tailwind CSS is modern utility-first CSS"),

        // .NET / C# / Backend Relationships
        ("ASP.NET", "C#", 0.85, "Strong", "ASP.NET is the web framework for C#"),
        ("ASP.NET", ".NET", 0.90, "Strong", "ASP.NET is part of the .NET ecosystem"),
        ("EF Core", ".NET", 0.85, "Strong", "Entity Framework Core is the ORM for .NET"),
        ("EF Core", "SQL", 0.75, "Strong", "EF Core translates database queries to SQL"),
        (".NET", "C#", 0.85, "Strong", ".NET and C# are symbiotic Microsoft technologies"),
        ("C#", ".NET", 0.85, "Strong", "C# runs directly on the .NET runtime"),
        ("FastAPI", "Python", 0.90, "Strong", "FastAPI is a modern high-performance Python framework"),
        ("Django", "Python", 0.90, "Strong", "Django is a full-featured Python web framework"),
        ("Flask", "Python", 0.85, "Strong", "Flask is a lightweight Python microframework"),
        ("Spring Boot", "Java", 0.90, "Strong", "Spring Boot is the enterprise standard for Java"),

        // Database & Cloud / DevOps Relationships
        ("PostgreSQL", "SQL", 0.95, "Strong", "PostgreSQL is an advanced relational SQL database"),
        ("MySQL", "SQL", 0.95, "Strong", "MySQL is a standard relational SQL database"),
        ("Docker", "Kubernetes", 0.75, "Strong", "Docker containerization is the foundation for Kubernetes orchestration"),
        ("Docker", "DevOps", 0.80, "Strong", "Docker is a pillar of DevOps workflows"),
        ("Kubernetes", "DevOps", 0.85, "Strong", "Kubernetes powers modern cloud DevOps architectures"),
        ("AWS", "Cloud", 0.90, "Strong", "AWS is the market-leading cloud computing provider"),
        ("Azure", "Cloud", 0.90, "Strong", "Azure is Microsoft's enterprise cloud platform"),
        ("GCP", "Cloud", 0.90, "Strong", "Google Cloud Platform is a major cloud provider"),
        ("CI/CD", "DevOps", 0.85, "Strong", "Continuous integration/deployment is essential to DevOps"),
        ("Git", "DevOps", 0.60, "Moderate", "Version control is a prerequisite for DevOps pipelines"),
        ("REST API", "Microservices", 0.75, "Strong", "REST APIs are standard communication protocols for microservices")
    };

    public JobMatchResult CalculateMatch(
        CvProfile profile,
        string jobTitle,
        string company,
        string location,
        string employmentType,
        string description,
        List<string>? jobSkills = null)
    {
        var cvSkillsList = JsonSerializer.Deserialize<List<string>>(profile.ExtractedSkillsJson ?? "[]") ?? new List<string>();
        var cvSkills = new HashSet<string>(cvSkillsList, StringComparer.OrdinalIgnoreCase);

        // 1. EXTRACT & NORMALIZE JOB SKILLS
        var detectedJobSkills = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (jobSkills != null && jobSkills.Count > 0)
        {
            foreach (var s in jobSkills) if (!string.IsNullOrWhiteSpace(s)) detectedJobSkills.Add(s.Trim());
        }

        string combinedJobText = $"{jobTitle} {description} {location}";
        foreach (var skill in RecognizedSkills)
        {
            string pattern = (skill.Equals(".NET", StringComparison.OrdinalIgnoreCase) || skill.Equals("C#", StringComparison.OrdinalIgnoreCase) || skill.Equals("C++", StringComparison.OrdinalIgnoreCase))
                ? Regex.Escape(skill)
                : $@"\b{Regex.Escape(skill)}\b";

            if (Regex.IsMatch(combinedJobText, pattern, RegexOptions.IgnoreCase))
            {
                detectedJobSkills.Add(skill);
            }
        }

        // 2. TECHNICAL / REQUIRED SKILLS MATCHING (40 points max)
        var exactMatches = new List<string>();
        var relatedMatches = new List<RelatedSkillMatchDto>();
        var missingSkills = new List<string>();

        double totalEarnedSkillWeight = 0.0;

        if (detectedJobSkills.Count > 0)
        {
            foreach (var jobSkill in detectedJobSkills)
            {
                // Check Exact Match (1.0x weight)
                if (cvSkills.Contains(jobSkill))
                {
                    exactMatches.Add(jobSkill);
                    totalEarnedSkillWeight += 1.0;
                    continue;
                }

                // Check Semantic / Transferable Skill Relationship
                var relation = SemanticSkillRelations.FirstOrDefault(r =>
                    r.JobTargetPattern.Equals(jobSkill, StringComparison.OrdinalIgnoreCase) &&
                    cvSkills.Any(cvS => cvS.Equals(r.CandidatePattern, StringComparison.OrdinalIgnoreCase)));

                if (relation != default)
                {
                    var matchedCandidateSkill = cvSkills.First(cvS => cvS.Equals(relation.CandidatePattern, StringComparison.OrdinalIgnoreCase));
                    relatedMatches.Add(new RelatedSkillMatchDto
                    {
                        CandidateSkill = matchedCandidateSkill,
                        JobSkill = jobSkill,
                        WeightMultiplier = relation.Multiplier,
                        RelationType = relation.RelationType,
                        Explanation = relation.Reason
                    });
                    totalEarnedSkillWeight += relation.Multiplier;
                }
                else
                {
                    missingSkills.Add(jobSkill);
                }
            }
        }
        else
        {
            // Fallback check against candidate skills in job description
            foreach (var cvSkill in cvSkills)
            {
                if (Regex.IsMatch(combinedJobText, $@"\b{Regex.Escape(cvSkill)}\b", RegexOptions.IgnoreCase))
                {
                    exactMatches.Add(cvSkill);
                    totalEarnedSkillWeight += 1.0;
                }
            }
        }

        // CRITICAL BUG FIX: Ensure a minimum denominator of 3 so a single isolated skill match (1/1) cannot falsely yield 40/40!
        int effectiveDenominator = Math.Max(3, detectedJobSkills.Count);
        int skillsScore = (int)Math.Round((totalEarnedSkillWeight / effectiveDenominator) * 40.0);
        skillsScore = Math.Clamp(skillsScore, 0, 40);

        // 3. ROLE & JOB TITLE RELEVANCE (25 points max)
        var candidateDomain = _domainEngine.AnalyzeProfile(profile);
        int roleScore = _domainEngine.CalculateRoleCompatibility(candidateDomain, jobTitle);
        roleScore = Math.Clamp(roleScore, 0, 25);

        // 4. EXPERIENCE LEVEL COMPATIBILITY (15 points max)
        int candidateYears = profile.ExperienceYears;
        int expScore = 6;

        bool isSeniorJob = Regex.IsMatch(combinedJobText, @"\b(Senior|Lead|Principal|Staff|Head|Director|Architect|5\+\s*years?|7\+\s*years?)\b", RegexOptions.IgnoreCase);
        bool isJuniorOrGradJob = Regex.IsMatch(combinedJobText, @"\b(Graduate|Junior|Associate|Entry|Intern|Internship|New Grad|0-1|0 to 1|0\s*years?|1\s*years?|Trainee|Apprentice)\b", RegexOptions.IgnoreCase);

        if (candidateYears <= 1)
        {
            // Candidate is a New Graduate / Entry Level (0-1 years)
            if (isJuniorOrGradJob)
            {
                expScore = 15; // Full 15/15 points for graduate / junior roles!
            }
            else if (isSeniorJob)
            {
                expScore = 0; // Senior roles are incompatible with 0 years experience
            }
            else
            {
                expScore = 6; // Mid-level without graduate tag
            }
        }
        else if (candidateYears >= 5)
        {
            // Senior candidate (5+ years)
            if (isSeniorJob)
            {
                expScore = 15;
            }
            else if (isJuniorOrGradJob)
            {
                expScore = 6; // Overqualified
            }
            else
            {
                expScore = 12;
            }
        }
        else
        {
            // Mid-level candidate (2-4 years)
            if (isSeniorJob)
            {
                expScore = candidateYears >= 3 ? 8 : 3;
            }
            else if (isJuniorOrGradJob)
            {
                expScore = 10;
            }
            else
            {
                expScore = 15;
            }
        }
        expScore = Math.Clamp(expScore, 0, 15);

        // 5. LOCATION & WORK MODE COMPATIBILITY (10 points max)
        int locationScore = 4;
        bool isRemoteJob = location.ToLowerInvariant().Contains("remote") ||
                          description.ToLowerInvariant().Contains("remote") ||
                          employmentType.ToLowerInvariant().Contains("remote");

        if (profile.IsRemotePreferred && isRemoteJob)
        {
            locationScore = 10;
        }
        else if (!string.IsNullOrWhiteSpace(profile.PreferredLocation) &&
                 (location.ToLowerInvariant().Contains(profile.PreferredLocation.ToLowerInvariant()) ||
                  profile.PreferredLocation.ToLowerInvariant().Contains("uk") && location.ToLowerInvariant().Contains("united kingdom") ||
                  location.ToLowerInvariant().Contains("london") || location.ToLowerInvariant().Contains("uk")))
        {
            locationScore = 10;
        }
        else if (isRemoteJob)
        {
            locationScore = 8;
        }
        else
        {
            locationScore = 5;
        }
        locationScore = Math.Clamp(locationScore, 0, 10);

        // 6. EDUCATION / DEGREE FIT (10 points max)
        int educationScore = 7;
        if (!string.IsNullOrWhiteSpace(profile.EducationLevel))
        {
            if (profile.EducationLevel.Contains("Master") || profile.EducationLevel.Contains("PhD") || profile.EducationLevel.Contains("Doctorate"))
            {
                educationScore = 10;
            }
            else if (profile.EducationLevel.Contains("Bachelor") || isJuniorOrGradJob)
            {
                educationScore = 9;
            }
        }
        educationScore = Math.Clamp(educationScore, 0, 10);

        // 7. TOTAL WEIGHTED EVIDENCE-BASED SCORE (100% max)
        int totalScore = Math.Clamp(skillsScore + roleScore + expScore + locationScore + educationScore, 0, 100);

        string qualityLabel = "LOW MATCH";
        if (totalScore >= 85) qualityLabel = "STRONG MATCH";
        else if (totalScore >= 70) qualityLabel = "GOOD MATCH";
        else if (totalScore >= 50) qualityLabel = "FAIR MATCH";

        string expExplanation = candidateYears <= 1
            ? (isJuniorOrGradJob ? "Perfect fit for Graduate / Entry-level role (0-1 yrs exp)" : (isSeniorJob ? "Senior role requiring 5+ years experience" : "Role typically seeks 2+ years experience"))
            : $"Candidate has ~{candidateYears} yrs experience";

        var explanationParts = new List<string>
        {
            $"CareerMail Match Score: {totalScore}% ({qualityLabel}).",
            $"• Technical Skills ({skillsScore}/40): {exactMatches.Count} exact matches, {relatedMatches.Count} related matches.",
            $"• Role Relevance ({roleScore}/25): Title '{jobTitle}' vs target domain.",
            $"• Experience ({expScore}/15): {expExplanation}.",
            $"• Location ({locationScore}/10): Location compatibility.",
            $"• Education ({educationScore}/10): '{profile.EducationLevel}'."
        };

        return new JobMatchResult
        {
            MatchScore = totalScore,
            MatchQualityLabel = qualityLabel,
            MatchingSkills = exactMatches.Distinct().ToList(),
            RelatedSkills = relatedMatches,
            MissingSkills = missingSkills.Distinct().ToList(),
            SkillsScore = skillsScore,
            RoleRelevanceScore = roleScore,
            ExperienceRelevanceScore = expScore,
            LocationScore = locationScore,
            EducationScore = educationScore,
            Explanation = string.Join(" ", explanationParts)
        };
    }
}
