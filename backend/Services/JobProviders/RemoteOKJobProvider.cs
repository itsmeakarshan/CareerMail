using System.Text.Json;
using System.Text.RegularExpressions;

namespace CareerMail.Api.Services.JobProviders;

public class RemoteOKJobProvider : IJobProvider
{
    private readonly HttpClient _httpClient;

    public string ProviderName => "RemoteOK API";

    public RemoteOKJobProvider(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<JobListingDto>> FetchJobsAsync(string? query, string? location, string? workMode)
    {
        var results = new List<JobListingDto>();
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, "https://remoteok.com/api");
            request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CareerMail/1.0");

            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(content);
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var elem in doc.RootElement.EnumerateArray())
                    {
                        if (!elem.TryGetProperty("id", out var idElem)) continue;
                        var id = idElem.ToString();
                        var title = elem.TryGetProperty("position", out var p) ? p.GetString() ?? "" : "";
                        if (string.IsNullOrWhiteSpace(title)) continue;

                        var company = elem.TryGetProperty("company", out var c) ? c.GetString() ?? "" : "";
                        var logoUrl = elem.TryGetProperty("company_logo", out var cl) ? cl.GetString() ?? "" : "";
                        if (string.IsNullOrWhiteSpace(logoUrl) && elem.TryGetProperty("logo", out var lo)) logoUrl = lo.GetString() ?? "";

                        var jobLocation = elem.TryGetProperty("location", out var loc) ? loc.GetString() ?? "Remote" : "Remote";
                        var description = elem.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : "";
                        var url = elem.TryGetProperty("url", out var u) ? u.GetString() ?? "" : "";
                        var date = elem.TryGetProperty("date", out var d) ? d.GetString() ?? "" : "";

                        var tags = new List<string>();
                        if (elem.TryGetProperty("tags", out var tArray) && tArray.ValueKind == JsonValueKind.Array)
                        {
                            tags.AddRange(tArray.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrEmpty(x)));
                        }

                        // Filter by query if provided
                        if (!string.IsNullOrWhiteSpace(query))
                        {
                            string qLower = query.ToLowerInvariant();
                            bool matchesQuery = title.ToLowerInvariant().Contains(qLower) ||
                                                company.ToLowerInvariant().Contains(qLower) ||
                                                tags.Any(t => t.ToLowerInvariant().Contains(qLower));
                            if (!matchesQuery) continue;
                        }

                        results.Add(new JobListingDto
                        {
                            Id = $"remoteok_{id}",
                            Title = title,
                            Company = company,
                            CompanyLogoUrl = logoUrl,
                            Location = string.IsNullOrWhiteSpace(jobLocation) ? "Remote" : jobLocation,
                            Country = "Worldwide",
                            City = "Remote",
                            WorkMode = "REMOTE",
                            EmploymentType = "Full-time",
                            ExperienceLevel = ExtractExperienceLevel(title, description),
                            Salary = "$90,000 - $160,000 / year",
                            Description = System.Net.WebUtility.HtmlDecode(Regex.Replace(description, "<.*?>", string.Empty)),
                            Url = url,
                            PostedDate = string.IsNullOrWhiteSpace(date) ? "Recently" : date,
                            Source = ProviderName,
                            SourceJobId = id,
                            Skills = tags
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

    private static string ExtractExperienceLevel(string title, string desc)
    {
        string combined = $"{title} {desc}".ToLower();
        if (combined.Contains("senior") || combined.Contains("lead") || combined.Contains("principal")) return "Senior Level";
        if (combined.Contains("junior") || combined.Contains("entry") || combined.Contains("intern") || combined.Contains("graduate")) return "Entry Level";
        return "Mid Level";
    }
}
