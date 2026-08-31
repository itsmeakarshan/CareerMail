using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace CareerMail.Api.Services;

public class GeminiCvService : IGeminiCvService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GeminiCvService> _logger;

    private static readonly string[] CandidateModels = new[]
    {
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest"
    };

    // Fallback verified corporate career portals
    private static readonly Dictionary<string, string> VerifiedCompanyPortals = new(StringComparer.OrdinalIgnoreCase)
    {
        { "DeepMind", "https://deepmind.google/careers/" },
        { "Google", "https://careers.google.com/jobs/results/" },
        { "Revolut", "https://www.revolut.com/careers/" },
        { "Deliveroo", "https://careers.deliveroo.co.uk/" },
        { "Amazon", "https://amazon.jobs/" },
        { "Microsoft", "https://careers.microsoft.com/" },
        { "Monzo", "https://job-boards.greenhouse.io/monzo" },
        { "Monzo Bank", "https://job-boards.greenhouse.io/monzo" },
        { "Canonical", "https://job-boards.greenhouse.io/canonical" },
        { "Cloudflare", "https://job-boards.greenhouse.io/cloudflare" },
        { "GitLab", "https://job-boards.greenhouse.io/gitlab" },
        { "Datadog", "https://job-boards.greenhouse.io/datadog" },
        { "Figma", "https://job-boards.greenhouse.io/figma" },
        { "Elastic", "https://job-boards.greenhouse.io/elastic" },
        { "Reddit", "https://job-boards.greenhouse.io/reddit" },
        { "Spotify", "https://jobs.lever.co/spotify" },
        { "Palantir", "https://jobs.lever.co/palantir" },
        { "Palantir Technologies", "https://jobs.lever.co/palantir" },
        { "Bloomberg", "https://www.bloomberg.com/company/careers/" },
        { "AstraZeneca", "https://careers.astrazeneca.com/search-jobs" },
        { "BBC", "https://careerssearch.bbc.co.uk/" },
        { "Snyk", "https://snyk.io/careers/" },
        { "Checkout.com", "https://www.checkout.com/careers" },
        { "ARM", "https://careers.arm.com/" },
        { "Skyscanner", "https://www.skyscanner.net/jobs/" },
        { "Wise", "https://wise.jobs/" },
        { "Starling Bank", "https://www.starlingbank.com/careers/" },
        { "Meta", "https://www.metacareers.com/" },
        { "Apple", "https://jobs.apple.com/" },
        { "Netflix", "https://jobs.netflix.com/" }
    };

    public GeminiCvService(HttpClient httpClient, ILogger<GeminiCvService> logger)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(15);
        _logger = logger;
    }

    public async Task<(bool Success, string Message)> TestApiKeyAsync(string apiKey)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return (false, "API key cannot be empty.");
        }

        string cleanKey = apiKey.Trim();

        try
        {
            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = "Respond with 'OK' only." }
                        }
                    }
                }
            };

            string jsonString = JsonSerializer.Serialize(payload);
            string lastError = string.Empty;

            foreach (var model in CandidateModels)
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(6));
                try
                {
                    var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={cleanKey}";
                    using var request = new HttpRequestMessage(HttpMethod.Post, url)
                    {
                        Content = new StringContent(jsonString, Encoding.UTF8, "application/json")
                    };

                    var response = await _httpClient.SendAsync(request, cts.Token);
                    if (response.IsSuccessStatusCode)
                    {
                        return (true, "✓ Gemini Connected: API key is valid and responsive.");
                    }

                    var errorBody = await response.Content.ReadAsStringAsync();
                    lastError = $"{response.StatusCode}: {errorBody}";
                }
                catch (Exception ex)
                {
                    lastError = ex.Message;
                }
            }

            return (false, $"Gemini validation error: {lastError}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing Gemini API key");
            return (false, $"Connection error: {ex.Message}");
        }
    }

    public async Task<GeminiStructuredCvProfileDto?> ExtractStructuredCvAsync(string rawCvText, string apiKey)
    {
        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(rawCvText))
        {
            return null;
        }

        string cleanKey = apiKey.Trim();

        try
        {
            var prompt = $@"You are an expert technical recruiter and resume parsing system.
Extract all skills, technologies, job titles, and experience levels from the candidate's CV.
Return ONLY valid JSON matching this schema:
{{
  ""technicalSkills"": [""Python"", ""PyTorch"", ""SQL""],
  ""programmingLanguages"": [""Python"", ""C#""],
  ""frameworks"": [""React"", ""FastAPI""],
  ""databases"": [""PostgreSQL"", ""Redis""],
  ""cloudPlatforms"": [""AWS"", ""GCP""],
  ""tools"": [""Docker"", ""Git""],
  ""dataSkills"": [""Data Science"", ""Statistical Modeling""],
  ""aiMlSkills"": [""Machine Learning"", ""Deep Learning"", ""LLMs""],
  ""softSkills"": [""Communication"", ""Problem Solving""],
  ""jobTitles"": [""Data Scientist"", ""ML Engineer""],
  ""experienceYears"": 0,
  ""education"": [""BSc Computer Science""],
  ""normalisedSkills"": [""python"", ""pytorch"", ""sql""]
}}

Candidate CV Text:
{rawCvText.Trim()}";

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json",
                    temperature = 0.1
                }
            };

            string jsonPayload = JsonSerializer.Serialize(payload);
            string? rawResponse = null;

            foreach (var model in CandidateModels)
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                try
                {
                    var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={cleanKey}";
                    using var request = new HttpRequestMessage(HttpMethod.Post, url)
                    {
                        Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json")
                    };

                    var response = await _httpClient.SendAsync(request, cts.Token);
                    if (response.IsSuccessStatusCode)
                    {
                        rawResponse = await response.Content.ReadAsStringAsync();
                        break;
                    }
                }
                catch
                {
                    // Fallback to next model
                }
            }

            if (string.IsNullOrWhiteSpace(rawResponse)) return null;

            using var doc = JsonDocument.Parse(rawResponse);
            var root = doc.RootElement;

            if (!root.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            {
                return null;
            }

            var firstCandidate = candidates[0];
            if (!firstCandidate.TryGetProperty("content", out var content) ||
                !content.TryGetProperty("parts", out var parts) ||
                parts.GetArrayLength() == 0)
            {
                return null;
            }

            var rawOutput = parts[0].GetProperty("text").GetString() ?? string.Empty;
            rawOutput = Regex.Replace(rawOutput, @"^```(?:json)?\s*", "", RegexOptions.Multiline);
            rawOutput = Regex.Replace(rawOutput, @"\s*```$", "", RegexOptions.Multiline).Trim();

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<GeminiStructuredCvProfileDto>(rawOutput, options);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract structured CV with Gemini AI");
            return null;
        }
    }

    public async Task<string?> ResolveRealJobUrlAsync(string jobTitle, string companyName, string location, string? currentUrl, string? apiKey)
    {
        // 1. If it's already a direct Greenhouse, Lever, Remotive, RemoteOK, Jobicy ATS link, use directly
        if (!string.IsNullOrWhiteSpace(currentUrl))
        {
            if (currentUrl.Contains("greenhouse.io") ||
                currentUrl.Contains("lever.co") ||
                currentUrl.Contains("remotive.com") ||
                currentUrl.Contains("remoteok.com") ||
                currentUrl.Contains("jobicy.com") ||
                currentUrl.Contains("ashbyhq.com") ||
                currentUrl.Contains("workable.com"))
            {
                return currentUrl;
            }
        }

        // 2. If Gemini API key is provided, ask Gemini for the genuine official career portal / application URL
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            string cleanKey = apiKey.Trim();
            try
            {
                var prompt = $@"You are an expert technical careers and corporate job recruiter.
Determine the official, authentic company career portal or direct application URL for this job:
- Job Title: {jobTitle}
- Company: {companyName}
- Location: {location}
- Candidate Current URL: {currentUrl}

Return ONLY a JSON object:
{{
  ""realJobUrl"": ""https://...""
}}
Provide the genuine official HTTPS career portal URL (e.g. greenhouse.io, lever.co, workday, or company's official career portal like careers.google.com, amazon.jobs, etc.).";

                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = prompt }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        responseMimeType = "application/json",
                        temperature = 0.1
                    }
                };

                string jsonPayload = JsonSerializer.Serialize(payload);

                foreach (var model in CandidateModels)
                {
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(6));
                    try
                    {
                        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={cleanKey}";
                        using var request = new HttpRequestMessage(HttpMethod.Post, url)
                        {
                            Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json")
                        };

                        var response = await _httpClient.SendAsync(request, cts.Token);
                        if (response.IsSuccessStatusCode)
                        {
                            var respString = await response.Content.ReadAsStringAsync();
                            using var doc = JsonDocument.Parse(respString);
                            if (doc.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                            {
                                var cand = candidates[0];
                                if (cand.TryGetProperty("content", out var c) && c.TryGetProperty("parts", out var p) && p.GetArrayLength() > 0)
                                {
                                    var text = p[0].GetProperty("text").GetString() ?? "";
                                    text = Regex.Replace(text, @"^```(?:json)?\s*", "", RegexOptions.Multiline);
                                    text = Regex.Replace(text, @"\s*```$", "", RegexOptions.Multiline).Trim();

                                    using var parsedDoc = JsonDocument.Parse(text);
                                    if (parsedDoc.RootElement.TryGetProperty("realJobUrl", out var urlProp))
                                    {
                                        var foundUrl = urlProp.GetString();
                                        if (!string.IsNullOrWhiteSpace(foundUrl) && foundUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                                        {
                                            return foundUrl;
                                        }
                                    }
                                }
                            }
                            break;
                        }
                    }
                    catch
                    {
                        // Try next model
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gemini URL resolver encountered an issue, falling back to verified portals");
            }
        }

        // 3. Fallback to verified official corporate career portals
        foreach (var (comp, portalUrl) in VerifiedCompanyPortals)
        {
            if (companyName.Contains(comp, StringComparison.OrdinalIgnoreCase))
            {
                return portalUrl;
            }
        }

        // 4. Default clean fallback
        if (!string.IsNullOrWhiteSpace(currentUrl)) return currentUrl;
        return $"https://www.google.com/search?q={Uri.EscapeDataString($"{companyName} {jobTitle} careers apply")}";
    }
}
