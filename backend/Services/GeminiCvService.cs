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
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest"
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
            string systemPrompt = @"You are an expert CV/Resume Skill Extraction and Normalisation Engine.
Analyze the following candidate CV text and return ONLY valid JSON matching this exact structure:
{
  ""technicalSkills"": [""Python"", ""SQL""],
  ""programmingLanguages"": [""Python"", ""C#"", ""TypeScript""],
  ""frameworks"": ["".NET"", ""React"", ""ASP.NET Core""],
  ""databases"": [""PostgreSQL"", ""Redis""],
  ""cloudPlatforms"": [""AWS"", ""Azure"", ""Docker""],
  ""tools"": [""Git"", ""Linux"", ""CI/CD""],
  ""dataSkills"": [""Pandas"", ""NumPy"", ""Data Analysis""],
  ""aiMlSkills"": [""Machine Learning"", ""Scikit-Learn"", ""PyTorch""],
  ""softSkills"": [""Problem Solving"", ""Agile""],
  ""jobTitles"": [""Software Engineer"", ""Full Stack Developer""],
  ""experienceYears"": 0,
  ""education"": [""Bachelor of Science in Computer Science""],
  ""normalisedSkills"": [""Python"", ""C#"", ""React"", "".NET"", ""SQL"", ""Docker"", ""Machine Learning""]
}

Important Rules:
1. Normalise synonymous skills (e.g. 'Python programming' -> 'Python', 'ML' -> 'Machine Learning', 'ReactJS' -> 'React', 'C#/.NET' -> 'C#', '.NET').
2. If no work experience is mentioned or candidate is a student/recent grad, set 'experienceYears' to 0.
3. 'normalisedSkills' should contain a clean, deduplicated list of canonical industry skill names.
4. Output RAW JSON ONLY without markdown backticks or commentary.";

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = $"{systemPrompt}\n\nCandidate CV Text:\n{rawCvText}" }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.1,
                    maxOutputTokens = 2048
                }
            };

            string jsonString = JsonSerializer.Serialize(payload);
            HttpResponseMessage? response = null;

            foreach (var model in CandidateModels)
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={cleanKey}";
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Post, url)
                    {
                        Content = new StringContent(jsonString, Encoding.UTF8, "application/json")
                    };

                    response = await _httpClient.SendAsync(request, cts.Token);
                    if (response.IsSuccessStatusCode)
                    {
                        break;
                    }
                }
                catch
                {
                    // Try next model
                }
            }

            if (response == null || !response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Gemini CV analysis API failed across candidate models.");
                return null;
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);

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

            // Strip any markdown code fences if present
            rawOutput = Regex.Replace(rawOutput, @"^```(?:json)?\s*", "", RegexOptions.Multiline);
            rawOutput = Regex.Replace(rawOutput, @"\s*```$", "", RegexOptions.Multiline).Trim();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var parsedDto = JsonSerializer.Deserialize<GeminiStructuredCvProfileDto>(rawOutput, options);
            return parsedDto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract structured CV with Gemini AI");
            return null;
        }
    }
}
