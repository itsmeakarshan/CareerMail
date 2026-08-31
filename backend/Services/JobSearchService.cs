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
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string Currency { get; set; } = "GBP";
    public string Salary { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string SourceUrl { get; set; } = string.Empty;
    public string ApplyUrl { get; set; } = string.Empty;
    public bool IsExternalApplication { get; set; } = true;
    public string PostedDate { get; set; } = string.Empty;
    public string Source { get; set; } = "Public Provider Feed";
    public string SourceJobId { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = new();

    public string LinkedInUrl { get; set; } = string.Empty;
    public string IndeedUrl { get; set; } = string.Empty;
    public string GoogleJobsUrl { get; set; } = string.Empty;

    // Match Engine Breakdown (Deterministic 5-Pillar C# Engine)
    public int MatchScore { get; set; }
    public string MatchQualityLabel { get; set; } = "FAIR MATCH";
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
    private readonly ICandidateDomainEngine _domainEngine;
    private readonly ILogger<JobSearchService> _logger;

    public JobSearchService(
        IEnumerable<IJobProvider> providers,
        IJobMatchEngineService matchEngine,
        ICandidateDomainEngine domainEngine,
        ILogger<JobSearchService> logger)
    {
        _providers = providers;
        _matchEngine = matchEngine;
        _domainEngine = domainEngine;
        _logger = logger;
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
        var candidateDomain = _domainEngine.AnalyzeProfile(profile);

        // Expand search roles dynamically
        var expandedRoles = !string.IsNullOrWhiteSpace(cleanQuery)
            ? RoleExpansionHelper.ExpandRole(cleanQuery)
            : candidateDomain.TargetRoles;

        _logger.LogInformation("Initiating multi-source dynamic job search. Query='{Query}', ExtractedLoc='{Loc}', CandidateDomain='{Domain}', DynamicQueries=[{Queries}]",
            cleanQuery, extractedLocation, candidateDomain.PrimaryDomain, string.Join(", ", candidateDomain.DynamicSearchQueries));

        var rawListings = new List<JobListingDto>();
        var sourceCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        // 2. Query all registered modular providers in parallel
        var tasks = _providers.Select(async p =>
        {
            try
            {
                var jobs = await p.FetchJobsAsync(cleanQuery, extractedLocation, workType);
                return (ProviderName: p.ProviderName, Jobs: jobs ?? new List<JobListingDto>());
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Provider {Provider} failed: {Message}", p.ProviderName, ex.Message);
                return (ProviderName: p.ProviderName, Jobs: new List<JobListingDto>());
            }
        });

        var providerResults = await Task.WhenAll(tasks);

        foreach (var (providerName, jobs) in providerResults)
        {
            sourceCounts[providerName] = jobs.Count;
            rawListings.AddRange(jobs);
        }

        _logger.LogInformation("Job Discovery: {TotalRaw} raw jobs retrieved across {SourceCount} sources.",
            rawListings.Count, sourceCounts.Count);

        // 3. Deduplicate listings (Prioritize Canonical ATS / Company Career Site records)
        int preDedupeCount = rawListings.Count;
        var deduplicatedListings = DeduplicateAndMergeJobs(rawListings);
        int duplicatesRemoved = preDedupeCount - deduplicatedListings.Count;

        _logger.LogInformation("Deduplication completed: {CanonicalCount} canonical records retained.", deduplicatedListings.Count);

        // 4. Score each unique job against candidate's CV profile deterministically in C#
        var matchedListings = new List<JobListingDto>();

        foreach (var job in deduplicatedListings)
        {
            string cleanTitle = job.Title;
            string cleanCompany = job.Company;
            string cleanLocation = !string.IsNullOrWhiteSpace(job.Location) ? job.Location : "United Kingdom";

            string encodedKeywords = Uri.EscapeDataString($"{cleanTitle} {cleanCompany}");
            string encodedLoc = Uri.EscapeDataString(cleanLocation);

            // 1. Direct targeted LinkedIn Jobs URL
            job.LinkedInUrl = $"https://www.linkedin.com/jobs/search/?keywords={encodedKeywords}&location={encodedLoc}";

            // 2. Direct targeted Indeed Jobs URL
            bool isUk = cleanLocation.Contains("United Kingdom", StringComparison.OrdinalIgnoreCase) ||
                        cleanLocation.Contains("London", StringComparison.OrdinalIgnoreCase) ||
                        cleanLocation.Contains("Manchester", StringComparison.OrdinalIgnoreCase) ||
                        cleanLocation.Contains("Cambridge", StringComparison.OrdinalIgnoreCase) ||
                        cleanLocation.Contains("Oxford", StringComparison.OrdinalIgnoreCase) ||
                        cleanLocation.Contains("UK", StringComparison.OrdinalIgnoreCase) ||
                        cleanLocation.Contains("Bristol", StringComparison.OrdinalIgnoreCase) ||
                        cleanLocation.Contains("Edinburgh", StringComparison.OrdinalIgnoreCase) ||
                        cleanLocation.Contains("Birmingham", StringComparison.OrdinalIgnoreCase);

            job.IndeedUrl = isUk
                ? $"https://uk.indeed.com/jobs?q={encodedKeywords}&l={encodedLoc}"
                : $"https://www.indeed.com/jobs?q={encodedKeywords}&l={encodedLoc}";

            // 3. Direct Google Jobs URL
            job.GoogleJobsUrl = $"https://www.google.com/search?q={Uri.EscapeDataString($"{cleanCompany} {cleanTitle} careers {cleanLocation}")}&ibp=htl;jobs";

            // Ensure real, authentic application URL is preserved
            if (string.IsNullOrWhiteSpace(job.ApplyUrl))
            {
                job.ApplyUrl = !string.IsNullOrWhiteSpace(job.SourceUrl) ? job.SourceUrl : job.Url;
            }
            if (string.IsNullOrWhiteSpace(job.ApplyUrl))
            {
                job.ApplyUrl = $"https://www.google.com/search?q={Uri.EscapeDataString($"{cleanCompany} {cleanTitle} jobs {cleanLocation}")}";
            }

            if (string.IsNullOrWhiteSpace(job.SourceUrl)) job.SourceUrl = job.ApplyUrl;
            if (string.IsNullOrWhiteSpace(job.Url)) job.Url = job.ApplyUrl;

            // Ensure CompanyDomain is inferred if empty
            if (string.IsNullOrWhiteSpace(job.CompanyDomain))
            {
                job.CompanyDomain = InferCompanyDomain(job.Company, job.ApplyUrl ?? job.SourceUrl);
            }

            if (string.IsNullOrWhiteSpace(job.CompanyLogoUrl))
            {
                job.CompanyLogoUrl = $"https://www.google.com/s2/favicons?domain={job.CompanyDomain}&sz=128";
            }

            // Apply 5-pillar match scoring
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

            // 5. Apply Natural Filters
            if (!string.IsNullOrWhiteSpace(cleanQuery))
            {
                bool matchesQuery = RoleExpansionHelper.MatchesExpandedRole(job.Title, expandedRoles) ||
                                    job.Company.Contains(cleanQuery, StringComparison.OrdinalIgnoreCase) ||
                                    job.Description.Contains(cleanQuery, StringComparison.OrdinalIgnoreCase) ||
                                    job.Skills.Any(s => s.Contains(cleanQuery, StringComparison.OrdinalIgnoreCase));
                if (!matchesQuery) continue;
            }

            if (!string.IsNullOrWhiteSpace(extractedLocation))
            {
                bool matchesLoc = LocationExpansionHelper.MatchesLocation(extractedLocation, job.Location, job.Country, job.City, job.WorkMode);
                if (!matchesLoc) continue;
            }

            if (!string.IsNullOrWhiteSpace(workType) && !workType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                string wt = workType.ToUpperInvariant();
                if (wt == "REMOTE" && job.WorkMode != "REMOTE" && !job.Location.Contains("remote", StringComparison.OrdinalIgnoreCase)) continue;
                if (wt == "HYBRID" && job.WorkMode != "HYBRID" && !job.Location.Contains("hybrid", StringComparison.OrdinalIgnoreCase)) continue;
                if (wt == "ONSITE" && job.WorkMode != "ONSITE" && (job.Location.Contains("remote", StringComparison.OrdinalIgnoreCase) || job.WorkMode == "REMOTE")) continue;
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

    public static string InferCompanyDomain(string companyName, string? jobUrl = null)
    {
        if (!string.IsNullOrWhiteSpace(jobUrl) && Uri.TryCreate(jobUrl, UriKind.Absolute, out var uri))
        {
            var host = uri.Host.ToLowerInvariant().Replace("www.", "").Replace("careers.", "").Replace("jobs.", "");
            if (!host.Contains("remoteok") && !host.Contains("jobicy") && !host.Contains("workable") && !host.Contains("lever") && !host.Contains("greenhouse") && !host.Contains("remotive"))
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
        if (cleanName.Contains("datadog")) return "datadoghq.com";
        if (cleanName.Contains("canonical")) return "canonical.com";
        if (cleanName.Contains("snyk")) return "snyk.io";
        if (cleanName.Contains("checkout")) return "checkout.com";
        if (cleanName.Contains("figma")) return "figma.com";
        if (cleanName.Contains("reddit")) return "reddit.com";
        if (cleanName.Contains("elastic")) return "elastic.co";
        if (cleanName.Contains("skyscanner")) return "skyscanner.net";
        if (cleanName.Contains("dyson")) return "dyson.com";
        if (cleanName.Contains("pwc")) return "pwc.co.uk";
        if (cleanName.Contains("astrazeneca")) return "astrazeneca.co.uk";

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

        var knownLocations = new[] { "london", "manchester", "birmingham", "cambridge", "oxford", "bristol", "edinburgh", "leeds", "belfast", "glasgow", "uk", "united kingdom", "new york", "remote" };

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

    private static List<JobListingDto> DeduplicateAndMergeJobs(List<JobListingDto> jobs)
    {
        // Group by Normalized (Company + Title + Approximate Location)
        var groups = jobs.GroupBy(j =>
        {
            string titleNorm = Regex.Replace(j.Title.ToLowerInvariant(), @"[^a-z0-9]", "");
            string companyNorm = Regex.Replace(j.Company.ToLowerInvariant(), @"[^a-z0-9]", "");
            string locNorm = LocationExpansionHelper.IsUkLocation(j.Location) ? "uk" : Regex.Replace(j.Location.ToLowerInvariant(), @"[^a-z0-9]", "");
            return $"{companyNorm}|{titleNorm}|{locNorm}";
        });

        var canonicalList = new List<JobListingDto>();

        foreach (var group in groups)
        {
            // Pick canonical record by source priority:
            // 1. Direct Greenhouse/Lever ATS
            // 2. Direct Company Careers
            // 3. LinkedIn Partner
            // 4. Remotive / Jobicy / RemoteOK
            // 5. Aggregator
            var canonical = group.OrderBy(j => GetSourcePriorityRank(j.Source)).First();

            // Find best ApplyUrl among duplicates if canonical lacks a direct ATS URL
            var bestApplyUrl = group
                .Select(j => j.ApplyUrl)
                .FirstOrDefault(u => !string.IsNullOrWhiteSpace(u) && (u.Contains("greenhouse.io") || u.Contains("lever.co") || u.Contains("careers.") || u.Contains("jobs.")));

            if (!string.IsNullOrWhiteSpace(bestApplyUrl))
            {
                canonical.ApplyUrl = bestApplyUrl;
                canonical.IsExternalApplication = true;
            }

            canonicalList.Add(canonical);
        }

        return canonicalList;
    }

    private static int GetSourcePriorityRank(string? source)
    {
        if (string.IsNullOrWhiteSpace(source)) return 5;
        string s = source.ToLowerInvariant();
        if (s.Contains("greenhouse") || s.Contains("lever") || s.Contains("ats") || s.Contains("ashby")) return 1;
        if (s.Contains("careers") || s.Contains("official")) return 2;
        if (s.Contains("linkedin")) return 3;
        if (s.Contains("remotive") || s.Contains("jobicy") || s.Contains("remoteok")) return 4;
        return 5;
    }

    private static string GetQualityLabel(int score)
    {
        if (score >= 85) return "STRONG MATCH";
        if (score >= 70) return "GOOD MATCH";
        if (score >= 50) return "FAIR MATCH";
        return "LOW MATCH";
    }
}
