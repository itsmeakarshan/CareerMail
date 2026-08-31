using System.Text.Json;
using System.Text.RegularExpressions;
using CareerMail.Api.Services;

namespace CareerMail.Api.Services.JobProviders;

public class RemotiveJobProvider : IJobProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<RemotiveJobProvider> _logger;

    public string ProviderName => "Remotive API";

    public RemotiveJobProvider(HttpClient httpClient, ILogger<RemotiveJobProvider> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _httpClient.Timeout = TimeSpan.FromSeconds(8);
        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "CareerMail/1.0 (JobDiscoveryBot)");
        }
    }

    public async Task<List<JobListingDto>> FetchJobsAsync(string? query, string? location, string? workMode)
    {
        var results = new List<JobListingDto>();

        try
        {
            // Remotive supports search param & category
            string url = "https://remotive.com/api/remote-jobs?limit=50";
            if (!string.IsNullOrWhiteSpace(query))
            {
                url += $"&search={Uri.EscapeDataString(query)}";
            }

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            using var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Remotive API returned status {StatusCode}", response.StatusCode);
                return results;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            if (!doc.RootElement.TryGetProperty("jobs", out var jobsArray) || jobsArray.ValueKind != JsonValueKind.Array)
            {
                return results;
            }

            foreach (var elem in jobsArray.EnumerateArray())
            {
                try
                {
                    string id = elem.TryGetProperty("id", out var idProp) ? idProp.ToString() : Guid.NewGuid().ToString();
                    string title = elem.TryGetProperty("title", out var titleProp) ? titleProp.GetString() ?? "" : "";
                    string company = elem.TryGetProperty("company_name", out var compProp) ? compProp.GetString() ?? "" : "";
                    string candidateLocation = elem.TryGetProperty("candidate_required_location", out var locProp) ? locProp.GetString() ?? "Worldwide" : "Worldwide";
                    string salary = elem.TryGetProperty("salary", out var salProp) ? salProp.GetString() ?? "" : "";
                    string jobUrl = elem.TryGetProperty("url", out var urlProp) ? urlProp.GetString() ?? "" : "";
                    string companyLogo = elem.TryGetProperty("company_logo", out var logoProp) ? logoProp.GetString() ?? "" : "";
                    string descHtml = elem.TryGetProperty("description", out var descProp) ? descProp.GetString() ?? "" : "";
                    string pubDate = elem.TryGetProperty("publication_time", out var pubProp) ? pubProp.GetString() ?? "" : "";

                    string plainDesc = Regex.Replace(descHtml, "<.*?>", " ");
                    plainDesc = System.Net.WebUtility.HtmlDecode(plainDesc);

                    var tags = new List<string>();
                    if (elem.TryGetProperty("tags", out var tagsArray) && tagsArray.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var tag in tagsArray.EnumerateArray())
                        {
                            var t = tag.GetString();
                            if (!string.IsNullOrWhiteSpace(t)) tags.Add(t.Trim());
                        }
                    }

                    if (tags.Count == 0)
                    {
                        tags = ExtractKeywords(title + " " + plainDesc);
                    }

                    string domain = JobSearchService.InferCompanyDomain(company);

                    results.Add(new JobListingDto
                    {
                        Id = $"remotive-{id}",
                        Title = title,
                        Company = company,
                        CompanyDomain = domain,
                        CompanyLogoUrl = !string.IsNullOrWhiteSpace(companyLogo) ? companyLogo : $"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                        Location = string.IsNullOrWhiteSpace(candidateLocation) ? "Remote (Worldwide)" : $"Remote ({candidateLocation})",
                        Country = candidateLocation.Contains("UK") || candidateLocation.Contains("United Kingdom") ? "United Kingdom" : "Remote",
                        City = "Remote",
                        WorkMode = "REMOTE",
                        ExperienceLevel = title.ToLower().Contains("senior") || title.ToLower().Contains("lead") ? "Senior Level" : (title.ToLower().Contains("junior") || title.ToLower().Contains("graduate") ? "Entry Level" : "Mid Level"),
                        Description = plainDesc.Length > 600 ? plainDesc[..600] + "..." : plainDesc,
                        Skills = tags,
                        Salary = !string.IsNullOrWhiteSpace(salary) ? salary : "Competitive",
                        PostedDate = !string.IsNullOrWhiteSpace(pubDate) ? pubDate : "Recently",
                        Source = "Remotive API",
                        SourceUrl = jobUrl,
                        ApplyUrl = jobUrl,
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
            _logger.LogError(ex, "Error fetching jobs from Remotive API");
        }

        return results;
    }

    private static List<string> ExtractKeywords(string text)
    {
        var known = new[] { "Python", "SQL", "Machine Learning", "PyTorch", "TensorFlow", "React", "TypeScript", "Node.js", "C#", ".NET", "AWS", "Docker", "Kubernetes", "Azure", "GCP", "PostgreSQL", "Go", "Java", "Next.js" };
        var found = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var k in known)
        {
            if (Regex.IsMatch(text, $@"\b{Regex.Escape(k)}\b", RegexOptions.IgnoreCase))
            {
                found.Add(k);
            }
        }
        return found.ToList();
    }
}
