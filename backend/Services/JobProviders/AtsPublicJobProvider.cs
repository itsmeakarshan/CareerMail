using System.Text.Json;
using System.Text.RegularExpressions;
using CareerMail.Api.Services;

namespace CareerMail.Api.Services.JobProviders;

public class AtsPublicJobProvider : IJobProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AtsPublicJobProvider> _logger;

    public string ProviderName => "ATS Public Feeds (Greenhouse & Lever)";

    // List of tech employers with public Greenhouse board feeds
    private static readonly (string BoardSlug, string CompanyName, string Domain)[] GreenhouseBoards = new[]
    {
        ("monzo", "Monzo", "monzo.com"),
        ("canonical", "Canonical", "canonical.com"),
        ("cloudflare", "Cloudflare", "cloudflare.com"),
        ("gitlab", "GitLab", "gitlab.com"),
        ("datadog", "Datadog", "datadoghq.com"),
        ("figma", "Figma", "figma.com"),
        ("elastic", "Elastic", "elastic.co"),
        ("reddit", "Reddit", "reddit.com")
    };

    // List of tech employers with public Lever board feeds
    private static readonly (string SiteSlug, string CompanyName, string Domain)[] LeverBoards = new[]
    {
        ("spotify", "Spotify", "spotify.com"),
        ("palantir", "Palantir Technologies", "palantir.com")
    };

    public AtsPublicJobProvider(HttpClient httpClient, ILogger<AtsPublicJobProvider> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _httpClient.Timeout = TimeSpan.FromSeconds(6);
        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "CareerMail/1.0 (PublicATSDiscovery)");
        }
    }

    public async Task<List<JobListingDto>> FetchJobsAsync(string? query, string? location, string? workMode)
    {
        var allJobs = new List<JobListingDto>();
        var tasks = new List<Task<List<JobListingDto>>>();

        // 1. Fetch Greenhouse boards in parallel
        foreach (var (board, comp, domain) in GreenhouseBoards)
        {
            tasks.Add(FetchGreenhouseBoardAsync(board, comp, domain, query, location));
        }

        // 2. Fetch Lever boards in parallel
        foreach (var (site, comp, domain) in LeverBoards)
        {
            tasks.Add(FetchLeverBoardAsync(site, comp, domain, query, location));
        }

        var results = await Task.WhenAll(tasks);
        foreach (var r in results)
        {
            allJobs.AddRange(r);
        }

        return allJobs;
    }

    private async Task<List<JobListingDto>> FetchGreenhouseBoardAsync(string boardSlug, string companyName, string domain, string? query, string? location)
    {
        var list = new List<JobListingDto>();
        try
        {
            string url = $"https://boards-api.greenhouse.io/v1/boards/{boardSlug}/jobs";
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            using var resp = await _httpClient.SendAsync(req);

            if (!resp.IsSuccessStatusCode) return list;

            var json = await resp.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            if (!doc.RootElement.TryGetProperty("jobs", out var jobsArray) || jobsArray.ValueKind != JsonValueKind.Array)
                return list;

            var expandedRoles = RoleExpansionHelper.ExpandRole(query);

            foreach (var elem in jobsArray.EnumerateArray())
            {
                try
                {
                    string id = elem.TryGetProperty("id", out var idProp) ? idProp.ToString() : Guid.NewGuid().ToString();
                    string title = elem.TryGetProperty("title", out var tProp) ? tProp.GetString() ?? "" : "";
                    string absUrl = elem.TryGetProperty("absolute_url", out var uProp) ? uProp.GetString() ?? "" : "";
                    string updatedAt = elem.TryGetProperty("updated_at", out var upProp) ? upProp.GetString() ?? "" : "";

                    string locName = "Worldwide / Remote";
                    if (elem.TryGetProperty("location", out var locObj) && locObj.ValueKind == JsonValueKind.Object)
                    {
                        if (locObj.TryGetProperty("name", out var lnProp))
                        {
                            locName = lnProp.GetString() ?? "Worldwide / Remote";
                        }
                    }

                    // Apply role expansion / query filtering if provided
                    if (!string.IsNullOrWhiteSpace(query) && !RoleExpansionHelper.MatchesExpandedRole(title, expandedRoles))
                    {
                        continue;
                    }

                    // Apply location matching
                    string country = LocationExpansionHelper.IsUkLocation(locName) ? "United Kingdom" : "Remote";
                    string city = locName.Contains("London", StringComparison.OrdinalIgnoreCase) ? "London" : (locName.Contains("Manchester", StringComparison.OrdinalIgnoreCase) ? "Manchester" : locName);

                    string detectedWorkMode = locName.Contains("Remote", StringComparison.OrdinalIgnoreCase) ? "REMOTE" : (locName.Contains("Hybrid", StringComparison.OrdinalIgnoreCase) ? "HYBRID" : "ONSITE");

                    var skills = ExtractSkillsFromTitle(title);

                    list.Add(new JobListingDto
                    {
                        Id = $"greenhouse-{boardSlug}-{id}",
                        Title = title,
                        Company = companyName,
                        CompanyDomain = domain,
                        CompanyLogoUrl = $"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                        Location = locName,
                        Country = country,
                        City = city,
                        WorkMode = detectedWorkMode,
                        ExperienceLevel = title.Contains("Senior", StringComparison.OrdinalIgnoreCase) || title.Contains("Lead", StringComparison.OrdinalIgnoreCase) || title.Contains("Principal", StringComparison.OrdinalIgnoreCase)
                            ? "Senior Level"
                            : (title.Contains("Junior", StringComparison.OrdinalIgnoreCase) || title.Contains("Graduate", StringComparison.OrdinalIgnoreCase) || title.Contains("Intern", StringComparison.OrdinalIgnoreCase) ? "Entry Level" : "Mid Level"),
                        Description = $"Official open position for {title} at {companyName}. Location: {locName}. View full requirements and apply directly via {companyName}'s official Greenhouse ATS portal.",
                        Skills = skills,
                        Salary = "Competitive market rate",
                        PostedDate = !string.IsNullOrWhiteSpace(updatedAt) ? updatedAt : "Recently",
                        Source = $"Greenhouse ({companyName})",
                        SourceUrl = absUrl,
                        ApplyUrl = absUrl,
                        IsExternalApplication = true
                    });
                }
                catch
                {
                    // Skip malformed item
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed fetching Greenhouse board {BoardSlug}: {Message}", boardSlug, ex.Message);
        }
        return list;
    }

    private async Task<List<JobListingDto>> FetchLeverBoardAsync(string siteSlug, string companyName, string domain, string? query, string? location)
    {
        var list = new List<JobListingDto>();
        try
        {
            string url = $"https://api.lever.co/v0/postings/{siteSlug}?mode=json";
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            using var resp = await _httpClient.SendAsync(req);

            if (!resp.IsSuccessStatusCode) return list;

            var json = await resp.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            if (doc.RootElement.ValueKind != JsonValueKind.Array) return list;

            var expandedRoles = RoleExpansionHelper.ExpandRole(query);

            foreach (var elem in doc.RootElement.EnumerateArray())
            {
                try
                {
                    string id = elem.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? Guid.NewGuid().ToString() : Guid.NewGuid().ToString();
                    string title = elem.TryGetProperty("text", out var tProp) ? tProp.GetString() ?? "" : "";
                    string applyUrl = elem.TryGetProperty("hostedUrl", out var uProp) ? uProp.GetString() ?? "" : "";
                    string desc = elem.TryGetProperty("descriptionPlain", out var dpProp) ? dpProp.GetString() ?? "" : "";
                    long createdAt = elem.TryGetProperty("createdAt", out var caProp) ? caProp.GetInt64() : 0;

                    string locName = "Remote";
                    if (elem.TryGetProperty("categories", out var catObj) && catObj.ValueKind == JsonValueKind.Object)
                    {
                        if (catObj.TryGetProperty("location", out var lnProp))
                        {
                            locName = lnProp.GetString() ?? "Remote";
                        }
                    }

                    // Apply role expansion / query filtering if provided
                    if (!string.IsNullOrWhiteSpace(query) && !RoleExpansionHelper.MatchesExpandedRole(title, expandedRoles))
                    {
                        continue;
                    }

                    string country = LocationExpansionHelper.IsUkLocation(locName) ? "United Kingdom" : "Remote";
                    string city = locName.Contains("London", StringComparison.OrdinalIgnoreCase) ? "London" : locName;
                    string detectedWorkMode = locName.Contains("Remote", StringComparison.OrdinalIgnoreCase) ? "REMOTE" : (locName.Contains("Hybrid", StringComparison.OrdinalIgnoreCase) ? "HYBRID" : "ONSITE");

                    var skills = ExtractSkillsFromTitle(title + " " + desc);

                    list.Add(new JobListingDto
                    {
                        Id = $"lever-{siteSlug}-{id}",
                        Title = title,
                        Company = companyName,
                        CompanyDomain = domain,
                        CompanyLogoUrl = $"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                        Location = locName,
                        Country = country,
                        City = city,
                        WorkMode = detectedWorkMode,
                        ExperienceLevel = title.Contains("Senior", StringComparison.OrdinalIgnoreCase) || title.Contains("Lead", StringComparison.OrdinalIgnoreCase)
                            ? "Senior Level"
                            : (title.Contains("Junior", StringComparison.OrdinalIgnoreCase) || title.Contains("Graduate", StringComparison.OrdinalIgnoreCase) ? "Entry Level" : "Mid Level"),
                        Description = desc.Length > 500 ? desc[..500] + "..." : (desc.Length > 0 ? desc : $"Official opening for {title} at {companyName}. Apply directly on Lever."),
                        Skills = skills,
                        Salary = "Competitive market rate",
                        PostedDate = createdAt > 0 ? DateTimeOffset.FromUnixTimeMilliseconds(createdAt).ToString("yyyy-MM-dd") : "Recently",
                        Source = $"Lever ({companyName})",
                        SourceUrl = applyUrl,
                        ApplyUrl = applyUrl,
                        IsExternalApplication = true
                    });
                }
                catch
                {
                    // Skip malformed item
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed fetching Lever board {SiteSlug}: {Message}", siteSlug, ex.Message);
        }
        return list;
    }

    private static List<string> ExtractSkillsFromTitle(string text)
    {
        var known = new[] { "Python", "SQL", "Machine Learning", "PyTorch", "TensorFlow", "React", "TypeScript", "Node.js", "C#", ".NET", "AWS", "Docker", "Kubernetes", "Azure", "GCP", "PostgreSQL", "Go", "Java", "Next.js", "C++", "Rust", "CI/CD", "Linux" };
        var found = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var k in known)
        {
            if (Regex.IsMatch(text, $@"\b{Regex.Escape(k)}\b", RegexOptions.IgnoreCase))
            {
                found.Add(k);
            }
        }
        return found.Count > 0 ? found.ToList() : new List<string> { "Software Engineering", "Cloud Computing" };
    }
}
