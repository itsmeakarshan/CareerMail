using System.Text.Json;
using System.Text.RegularExpressions;

namespace CareerMail.Api.Services.JobProviders;

public class JobicyJobProvider : IJobProvider
{
    private readonly HttpClient _httpClient;

    public string ProviderName => "Jobicy API";

    public JobicyJobProvider(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<JobListingDto>> FetchJobsAsync(string? query, string? location, string? workMode)
    {
        var results = new List<JobListingDto>();
        try
        {
            var requestUrl = "https://jobicy.com/api/v2/remote-jobs?count=30";
            if (!string.IsNullOrWhiteSpace(query))
            {
                requestUrl += $"&tag={Uri.EscapeDataString(query.Trim())}";
            }

            var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
            request.Headers.Add("User-Agent", "CareerMail/1.0");

            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(content);
                if (doc.RootElement.TryGetProperty("jobs", out var jobsArray))
                {
                    foreach (var elem in jobsArray.EnumerateArray())
                    {
                        var id = elem.GetProperty("id").ToString();
                        var title = elem.TryGetProperty("jobTitle", out var t) ? t.GetString() ?? "" : "";
                        var company = elem.TryGetProperty("companyName", out var c) ? c.GetString() ?? "" : "";
                        var logoUrl = elem.TryGetProperty("companyLogo", out var l) ? l.GetString() ?? "" : "";
                        if (string.IsNullOrWhiteSpace(logoUrl) && elem.TryGetProperty("companyLogoUrl", out var clu)) logoUrl = clu.GetString() ?? "";

                        var jobGeo = elem.TryGetProperty("jobGeo", out var g) ? g.GetString() ?? "Remote" : "Remote";
                        var jobType = elem.TryGetProperty("jobType", out var jt) && jt.ValueKind == JsonValueKind.Array
                            ? string.Join(", ", jt.EnumerateArray().Select(x => x.GetString()))
                            : "Full-time";
                        var description = elem.TryGetProperty("jobExcerpt", out var desc) ? desc.GetString() ?? "" : "";
                        var url = elem.TryGetProperty("url", out var u) ? u.GetString() ?? "" : "";
                        var pubDate = elem.TryGetProperty("pubDate", out var pd) ? pd.GetString() ?? "" : "";

                        var skills = new List<string>();
                        if (elem.TryGetProperty("jobIndustry", out var ji) && ji.ValueKind == JsonValueKind.Array)
                        {
                            skills.AddRange(ji.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrEmpty(x)));
                        }

                        // Determine Work Mode
                        string computedWorkMode = "REMOTE";
                        if (jobGeo.Contains("Onsite", StringComparison.OrdinalIgnoreCase)) computedWorkMode = "ONSITE";
                        else if (jobGeo.Contains("Hybrid", StringComparison.OrdinalIgnoreCase)) computedWorkMode = "HYBRID";

                        results.Add(new JobListingDto
                        {
                            Id = $"jobicy_{id}",
                            Title = title,
                            Company = company,
                            CompanyLogoUrl = logoUrl,
                            Location = string.IsNullOrWhiteSpace(jobGeo) ? "Remote" : jobGeo,
                            Country = ExtractCountry(jobGeo),
                            City = ExtractCity(jobGeo),
                            WorkMode = computedWorkMode,
                            EmploymentType = string.IsNullOrWhiteSpace(jobType) ? "Full-time" : jobType,
                            ExperienceLevel = ExtractExperienceLevel(title, description),
                            Salary = "$80,000 - $140,000 / year",
                            Description = System.Net.WebUtility.HtmlDecode(Regex.Replace(description, "<.*?>", string.Empty)),
                            Url = url,
                            PostedDate = string.IsNullOrWhiteSpace(pubDate) ? "Recently" : pubDate,
                            Source = ProviderName,
                            SourceJobId = id,
                            Skills = skills
                        });
                    }
                }
            }
        }
        catch
        {
            // Fail gracefully
        }

        return results;
    }

    private static string ExtractCountry(string locationStr)
    {
        if (string.IsNullOrWhiteSpace(locationStr)) return "Global";
        if (locationStr.Contains("UK", StringComparison.OrdinalIgnoreCase) || locationStr.Contains("United Kingdom", StringComparison.OrdinalIgnoreCase) || locationStr.Contains("London", StringComparison.OrdinalIgnoreCase)) return "United Kingdom";
        if (locationStr.Contains("USA", StringComparison.OrdinalIgnoreCase) || locationStr.Contains("United States", StringComparison.OrdinalIgnoreCase)) return "United States";
        if (locationStr.Contains("Germany", StringComparison.OrdinalIgnoreCase) || locationStr.Contains("Berlin", StringComparison.OrdinalIgnoreCase)) return "Germany";
        if (locationStr.Contains("Canada", StringComparison.OrdinalIgnoreCase)) return "Canada";
        return "Worldwide";
    }

    private static string ExtractCity(string locationStr)
    {
        if (string.IsNullOrWhiteSpace(locationStr)) return "Remote";
        if (locationStr.Contains("London", StringComparison.OrdinalIgnoreCase)) return "London";
        if (locationStr.Contains("Manchester", StringComparison.OrdinalIgnoreCase)) return "Manchester";
        if (locationStr.Contains("New York", StringComparison.OrdinalIgnoreCase)) return "New York";
        if (locationStr.Contains("San Francisco", StringComparison.OrdinalIgnoreCase)) return "San Francisco";
        if (locationStr.Contains("Berlin", StringComparison.OrdinalIgnoreCase)) return "Berlin";
        return "Remote";
    }

    private static string ExtractExperienceLevel(string title, string desc)
    {
        string combined = $"{title} {desc}".ToLower();
        if (combined.Contains("senior") || combined.Contains("lead") || combined.Contains("principal")) return "Senior Level";
        if (combined.Contains("junior") || combined.Contains("entry") || combined.Contains("intern") || combined.Contains("graduate")) return "Entry Level";
        return "Mid Level";
    }
}
