using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Services.JobProviders;

namespace CareerMail.Api.Services;

public class JobListingDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string CompanyDomain { get; set; } = string.Empty;
    public string CompanyLogoUrl { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Country { get; set; } = "Global";
    public string City { get; set; } = "Remote";
    public string WorkMode { get; set; } = "REMOTE"; // REMOTE, HYBRID, ONSITE
    public string EmploymentType { get; set; } = "Full-time";
    public string ExperienceLevel { get; set; } = "Mid Level";
    public string Salary { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string PostedDate { get; set; } = string.Empty;
    public string Source { get; set; } = "Public Provider Feed";
    public string SourceJobId { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = new();

    // Match Engine Breakdown
    public int MatchScore { get; set; }
    public string MatchQualityLabel { get; set; } = "FAIR MATCH"; // STRONG MATCH, GOOD MATCH, FAIR MATCH, LOW MATCH
    public List<string> MatchingSkills { get; set; } = new();
    public List<RelatedSkillMatchDto> RelatedSkills { get; set; } = new();
    public List<string> MissingSkills { get; set; } = new();
    public int SkillsScore { get; set; }
    public int RoleRelevanceScore { get; set; }
    public int ExperienceRelevanceScore { get; set; }
    public int LocationScore { get; set; }
    public int EducationScore { get; set; }
    public string Explanation { get; set; } = string.Empty;
}

public interface IJobSearchService
{
    Task<List<JobListingDto>> SearchJobsAsync(
        CvProfile profile,
        string? query = null,
        string? location = null,
        string? workType = null,
        int minScore = 0,
        string sortBy = "score");

    Task<JobListingDto?> GetJobByIdAsync(CvProfile profile, string jobId);
}

public class JobSearchService : IJobSearchService
{
    private readonly IEnumerable<IJobProvider> _providers;
    private readonly IJobMatchEngineService _matchEngine;

    public JobSearchService(IEnumerable<IJobProvider> providers, IJobMatchEngineService matchEngine)
    {
        _providers = providers;
        _matchEngine = matchEngine;
    }

    public async Task<List<JobListingDto>> SearchJobsAsync(
        CvProfile profile,
        string? query = null,
        string? location = null,
        string? workType = null,
        int minScore = 0,
        string sortBy = "score")
    {
        // 1. Natural Query & Location Parser
        var (cleanQuery, extractedLocation) = ParseNaturalQuery(query, location);

        var rawListings = new List<JobListingDto>();

        // 2. Query all registered modular providers in parallel
        var tasks = _providers.Select(p => p.FetchJobsAsync(cleanQuery, extractedLocation, workType));
        var providerResults = await Task.WhenAll(tasks);

        foreach (var batch in providerResults)
        {
            if (batch != null && batch.Count > 0)
            {
                rawListings.AddRange(batch);
            }
        }

        // 3. Deduplicate listings (by normalized Title + Company + Location)
        var deduplicatedListings = DeduplicateJobs(rawListings);

        // 4. Score each unique job against candidate's CV profile
        var matchedListings = new List<JobListingDto>();

        foreach (var job in deduplicatedListings)
        {
            var matchResult = _matchEngine.CalculateMatch(
                profile,
                job.Title,
                job.Company,
                job.Location,
                job.EmploymentType,
                job.Description,
                job.Skills);

            job.MatchScore = matchResult.MatchScore;
            job.MatchQualityLabel = GetQualityLabel(matchResult.MatchScore);
            job.MatchingSkills = matchResult.MatchingSkills;
            job.RelatedSkills = matchResult.RelatedSkills;
            job.MissingSkills = matchResult.MissingSkills;
            job.SkillsScore = matchResult.SkillsScore;
            job.RoleRelevanceScore = matchResult.RoleRelevanceScore;
            job.ExperienceRelevanceScore = matchResult.ExperienceRelevanceScore;
            job.LocationScore = matchResult.LocationScore;
            job.EducationScore = matchResult.EducationScore;
            job.Explanation = matchResult.Explanation;

            // Ensure CompanyDomain is inferred if empty
            if (string.IsNullOrWhiteSpace(job.CompanyDomain))
            {
                job.CompanyDomain = InferCompanyDomain(job.Company, job.Url);
            }

            // 5. Apply Filters
            if (!string.IsNullOrWhiteSpace(cleanQuery))
            {
                string q = cleanQuery.ToLowerInvariant();
                bool matchesQuery = job.Title.ToLowerInvariant().Contains(q) ||
                                    job.Company.ToLowerInvariant().Contains(q) ||
                                    job.Description.ToLowerInvariant().Contains(q) ||
                                    job.Skills.Any(s => s.ToLowerInvariant().Contains(q));
                if (!matchesQuery) continue;
            }

            if (!string.IsNullOrWhiteSpace(extractedLocation))
            {
                string loc = extractedLocation.ToLowerInvariant();
                bool matchesLoc = job.Location.ToLowerInvariant().Contains(loc) ||
                                  job.Country.ToLowerInvariant().Contains(loc) ||
                                  job.City.ToLowerInvariant().Contains(loc) ||
                                  (loc.Contains("remote") && job.WorkMode == "REMOTE") ||
                                  (loc.Contains("uk") && (job.Country == "United Kingdom" || job.Location.ToLowerInvariant().Contains("london") || job.Location.ToLowerInvariant().Contains("manchester")));
                if (!matchesLoc) continue;
            }

            if (!string.IsNullOrWhiteSpace(workType) && !workType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                string wt = workType.ToUpperInvariant();
                if (wt == "REMOTE" && job.WorkMode != "REMOTE" && !job.Location.ToLowerInvariant().Contains("remote")) continue;
                if (wt == "HYBRID" && job.WorkMode != "HYBRID") continue;
                if (wt == "ONSITE" && job.WorkMode != "ONSITE") continue;
            }

            if (job.MatchScore < minScore) continue;

            matchedListings.Add(job);
        }

        // 6. Sort Results
        return ApplySorting(matchedListings, sortBy);
    }

    public async Task<JobListingDto?> GetJobByIdAsync(CvProfile profile, string jobId)
    {
        var allJobs = await SearchJobsAsync(profile);
        return allJobs.FirstOrDefault(j => j.Id.Equals(jobId, StringComparison.OrdinalIgnoreCase));
    }

    private static List<JobListingDto> ApplySorting(List<JobListingDto> jobs, string sortBy)
    {
        return (sortBy?.ToLowerInvariant()) switch
        {
            "score_desc" or "score" => jobs.OrderByDescending(j => j.MatchScore).ToList(),
            "score_asc" => jobs.OrderBy(j => j.MatchScore).ToList(),
            "recent" => jobs.OrderByDescending(j => j.PostedDate.Contains("hour") ? 3 : j.PostedDate.Contains("day") ? 2 : 1).ToList(),
            "company" => jobs.OrderBy(j => j.Company).ToList(),
            "salary_desc" or "salary" => jobs.OrderByDescending(j => ExtractSalaryNumber(j.Salary)).ToList(),
            _ => jobs.OrderByDescending(j => j.MatchScore).ToList()
        };
    }

    private static int ExtractSalaryNumber(string salary)
    {
        if (string.IsNullOrWhiteSpace(salary)) return 0;
        var match = Regex.Match(salary, @"[£$€]?\s*(\d{2,3})(?:,\d{3})?");
        if (match.Success && int.TryParse(match.Groups[1].Value, out var num))
        {
            return num * 1000;
        }
        return 0;
    }

    public static string InferCompanyDomain(string companyName, string jobUrl)
    {
        if (!string.IsNullOrWhiteSpace(jobUrl) && Uri.TryCreate(jobUrl, UriKind.Absolute, out var uri))
        {
            var host = uri.Host.ToLowerInvariant().Replace("www.", "").Replace("careers.", "").Replace("jobs.", "");
            if (!host.Contains("remoteok") && !host.Contains("jobicy") && !host.Contains("workable") && !host.Contains("lever") && !host.Contains("greenhouse"))
            {
                return host;
            }
        }

        if (string.IsNullOrWhiteSpace(companyName)) return "company.com";

        string cleanName = companyName.ToLowerInvariant().Trim();
        if (cleanName.Contains("google")) return "google.com";
        if (cleanName.Contains("deepmind")) return "deepmind.google";
        if (cleanName.Contains("bloomberg")) return "bloomberg.com";
        if (cleanName.Contains("bbc")) return "bbc.co.uk";
        if (cleanName.Contains("cloudflare")) return "cloudflare.com";
        if (cleanName.Contains("monzo")) return "monzo.com";
        if (cleanName.Contains("revolut")) return "revolut.com";
        if (cleanName.Contains("spotify")) return "spotify.com";
        if (cleanName.Contains("amazon")) return "amazon.com";
        if (cleanName.Contains("microsoft")) return "microsoft.com";
        if (cleanName.Contains("apple")) return "apple.com";
        if (cleanName.Contains("meta")) return "meta.com";
        if (cleanName.Contains("netflix")) return "netflix.com";
        if (cleanName.Contains("stripe")) return "stripe.com";
        if (cleanName.Contains("deliveroo")) return "deliveroo.co.uk";
        if (cleanName.Contains("palantir")) return "palantir.com";
        if (cleanName.Contains("goldman")) return "goldmansachs.com";
        if (cleanName.Contains("autotrader") || cleanName.Contains("auto trader")) return "autotrader.co.uk";
        if (cleanName.Contains("gitlab")) return "gitlab.com";
        if (cleanName.Contains("vercel")) return "vercel.com";
        if (cleanName.Contains("supabase")) return "supabase.com";

        string slug = Regex.Replace(cleanName, @"[^a-z0-9]", "");
        return string.IsNullOrWhiteSpace(slug) ? "company.com" : $"{slug}.com";
    }

    private static (string Query, string Location) ParseNaturalQuery(string? query, string? explicitLocation)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return (string.Empty, explicitLocation ?? string.Empty);
        }

        string q = query.Trim();
        string loc = explicitLocation ?? string.Empty;

        var knownLocations = new[] { "london", "manchester", "birmingham", "uk", "united kingdom", "new york", "san francisco", "berlin", "usa", "remote" };

        foreach (var l in knownLocations)
        {
            if (q.ToLowerInvariant().EndsWith($" {l}"))
            {
                string cleanQ = q.Substring(0, q.Length - l.Length - 1).Trim();
                if (string.IsNullOrWhiteSpace(loc)) loc = l;
                return (cleanQ, loc);
            }
        }

        return (q, loc);
    }

    private static List<JobListingDto> DeduplicateJobs(List<JobListingDto> jobs)
    {
        var seenKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var uniqueList = new List<JobListingDto>();

        foreach (var job in jobs)
        {
            string titleNorm = Regex.Replace(job.Title.ToLowerInvariant(), @"[^a-z0-9]", "");
            string companyNorm = Regex.Replace(job.Company.ToLowerInvariant(), @"[^a-z0-9]", "");
            string locNorm = Regex.Replace(job.Location.ToLowerInvariant(), @"[^a-z0-9]", "");

            string key = $"{titleNorm}|{companyNorm}|{locNorm}";

            if (seenKeys.Add(key))
            {
                uniqueList.Add(job);
            }
        }

        return uniqueList;
    }

    private static string GetQualityLabel(int score)
    {
        if (score >= 85) return "STRONG MATCH";
        if (score >= 70) return "GOOD MATCH";
        if (score >= 50) return "FAIR MATCH";
        return "LOW MATCH";
    }
}
