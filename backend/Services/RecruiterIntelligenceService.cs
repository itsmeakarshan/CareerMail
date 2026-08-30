using System.Text.Json;
using System.Text.RegularExpressions;
using CareerMail.Api.Models.Enums;

namespace CareerMail.Api.Services;

public interface IRecruiterIntelligenceService
{
    RecruiterIntelligenceService.RecruiterInfo ExtractIntelligence(string? subject, string? body, string? sender, string? senderEmail, string? company);
    RecruiterIntelligenceService.RecruiterInfo ExtractRuleBased(string? subject, string? body, string? sender, string? senderEmail, string? company);
}

public class RecruiterIntelligenceService : IRecruiterIntelligenceService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly ILogger<RecruiterIntelligenceService> _logger;

    public RecruiterIntelligenceService(IConfiguration configuration, HttpClient httpClient, ILogger<RecruiterIntelligenceService> logger)
    {
        _configuration = configuration;
        _httpClient = httpClient;
        _logger = logger;
    }

    public record RecruiterInfo(
        string? Name,
        string? Email,
        string? Title,
        string? Phone,
        string? Linkedin,
        RecruiterType Type,
        int Confidence,
        string Source
    );

    public RecruiterInfo ExtractIntelligence(string? subject, string? body, string? sender, string? senderEmail, string? company)
    {
        var ruleResult = ExtractRuleBased(subject, body, sender, senderEmail, company);

        var geminiApiKey = _configuration["GeminiApiKey"] ?? _configuration["GEMINI_API_KEY"] ?? _configuration["AI_API_KEY"];
        if (ruleResult.Confidence >= 80 || string.IsNullOrWhiteSpace(geminiApiKey))
        {
            return ruleResult;
        }

        try
        {
            var aiResult = CallGeminiFallbackAsync(subject, body, sender, senderEmail, company, geminiApiKey).GetAwaiter().GetResult();
            if (aiResult != null && aiResult.Confidence > ruleResult.Confidence)
            {
                return aiResult;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug("Optional AI recruiter extraction skipped: {Message}", ex.Message);
        }

        return ruleResult;
    }

    public RecruiterInfo ExtractRuleBased(string? subject, string? body, string? sender, string? senderEmail, string? company)
    {
        var safeSender = sender?.Trim() ?? "";
        var safeEmail = senderEmail?.Trim() ?? "";
        var safeBody = body ?? "";
        var cleanBody = Regex.Replace(safeBody, "<[^>]+>", "\n");
        cleanBody = cleanBody.Replace("&nbsp;", " ").Replace("\r", "");
        cleanBody = Regex.Replace(cleanBody, @"[ \t]+", " ");

        var lowerEmail = safeEmail.ToLowerInvariant();

        var autoPrefixes = new[]
        {
            "noreply", "no-reply", "donotreply", "do-not-reply", "notifications", "mailer",
            "careers", "jobs", "earlycareers", "application-no-reply", "recruitment-no-reply",
            "alerts", "updates", "info", "support", "admin", "system", "auto", "apply"
        };
        var autoDomains = new[]
        {
            "myworkday.com", "greenhouse.io", "lever.co", "ashbyhq.com", "bamboohr.com",
            "indeed.com", "linkedin.com", "apply4u.co.uk", "totaljobs.com", "jobsite.co.uk",
            "glassdoor.com", "smartrecruiters.com", "icims.com", "taleo.net", "jobvite.com", "workable.com"
        };

        var isAutoEmail = autoPrefixes.Any(p => lowerEmail.StartsWith(p + "@") || lowerEmail.Contains("." + p + "@") || lowerEmail.StartsWith(p + "+") || lowerEmail.Contains("-" + p + "@"))
                          || autoDomains.Any(d => lowerEmail.Contains(d));

        string? humanSenderName = null;
        var rawSender = safeSender;
        if (rawSender.Contains(" - ")) rawSender = rawSender[..rawSender.IndexOf(" - ")].Trim();
        else if (rawSender.Contains(" | ")) rawSender = rawSender[..rawSender.IndexOf(" | ")].Trim();
        else if (rawSender.Contains(" (")) rawSender = rawSender[..rawSender.IndexOf(" (")].Trim();

        var nameParts = rawSender.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var excludedCorporateWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "team", "careers", "recruitment", "internal", "notification", "notifications",
            "early", "talent", "support", "apply4u", "linkedin", "indeed", "glassdoor",
            "google", "amazon", "microsoft", "revolut", "workday", "greenhouse", "ashby",
            "firm", "ltd", "limited", "group", "consulting", "resourcing", "hiring", "system",
            "update", "updates", "alert", "alerts", "bot", "auto"
        };

        var isLikelyPersonSender = false;
        if (nameParts.Length >= 2 && nameParts.Length <= 4)
        {
            var hasCorporate = nameParts.Any(part => excludedCorporateWords.Contains(part));
            if (!hasCorporate && Regex.IsMatch(rawSender, @"^[A-Z][a-zA-Z'.-]+(?:\s+[A-Z][a-zA-Z'.-]+)+$"))
            {
                isLikelyPersonSender = true;
                humanSenderName = rawSender;
            }
        }

        string? sigName = null;
        string? sigTitle = null;
        string? sigPhone = null;
        string? sigLinkedin = null;
        string? sigDirectEmail = null;

        // Phone
        var phoneMatch = Regex.Match(cleanBody, @"(?:\+?44\s?7\d{3}|\+?44\s?\d{4}|\+?1\s?\d{3}|\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}");
        if (phoneMatch.Success)
        {
            var pStr = phoneMatch.Value.Trim();
            if (pStr.Length >= 10 && !pStr.Contains("2024") && !pStr.Contains("2025") && !pStr.Contains("2026") && !pStr.Contains("2027"))
            {
                sigPhone = pStr;
            }
        }

        // LinkedIn
        var liMatch = Regex.Match(cleanBody, @"https?://(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_\-]+)");
        if (liMatch.Success)
        {
            sigLinkedin = liMatch.Value;
        }

        // Sign-off
        var signOffMatch = Regex.Match(cleanBody, @"(?m)^(?:Best regards|Kind regards|Warm regards|Warmest regards|Regards|Best|Thanks & regards|With thanks|Thanks,|Sincerely|Yours sincerely|Cheers,|Best wishes|Thank you,)\s*\n+([A-Z][a-zA-Z'.-]+(?:\s+[A-Z][a-zA-Z'.-]+){1,2})", RegexOptions.IgnoreCase);
        if (signOffMatch.Success)
        {
            var candName = signOffMatch.Groups[1].Value.Trim();
            if (!excludedCorporateWords.Any(w => candName.Contains(w, StringComparison.OrdinalIgnoreCase)) && candName.Length >= 4 && !candName.Equals("This email", StringComparison.OrdinalIgnoreCase))
            {
                sigName = candName;
            }
        }

        // Title
        var titleMatch = Regex.Match(cleanBody, @"\b((?:Senior |Lead |Principal |Head of |Technical |Executive )?(?:Recruiter|Talent Acquisition(?: Partner| Specialist| Lead| Manager| Coordinator)?|Talent Partner|People Partner|Talent Lead|Hiring Manager|Recruitment Consultant|People Operations|HR Manager|HR Specialist|Talent Specialist|Engineering Manager|HR Advisor))\b", RegexOptions.IgnoreCase);
        if (titleMatch.Success)
        {
            sigTitle = titleMatch.Groups[1].Value.Trim();
        }

        // Direct Email
        var emailMatches = Regex.Matches(cleanBody, @"\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b");
        foreach (Match em in emailMatches)
        {
            var candEmail = em.Groups[1].Value.Trim();
            var lCand = candEmail.ToLowerInvariant();
            if (!autoPrefixes.Any(p => lCand.StartsWith(p + "@")) && !lCand.Contains("gmail.com") && !lCand.Contains("akarshan") && !lCand.Contains("myworkday"))
            {
                sigDirectEmail = candEmail;
                break;
            }
        }

        if (isLikelyPersonSender && !isAutoEmail)
        {
            return new RecruiterInfo(humanSenderName, safeEmail, sigTitle ?? "Recruiter / Talent Partner", sigPhone, sigLinkedin, RecruiterType.HUMAN_RECRUITER, 95, "Direct Recruiter Outreach");
        }

        if (isLikelyPersonSender && isAutoEmail)
        {
            return new RecruiterInfo(humanSenderName, sigDirectEmail ?? safeEmail, sigTitle ?? "Recruiter / Hiring Contact", sigPhone, sigLinkedin, RecruiterType.POSSIBLE_RECRUITER, 85, "ATS Delivery on behalf of Recruiter");
        }

        if (sigName != null)
        {
            return new RecruiterInfo(sigName, sigDirectEmail ?? (!isAutoEmail ? safeEmail : null), sigTitle ?? "Talent Partner / Recruiter", sigPhone, sigLinkedin, isAutoEmail ? RecruiterType.POSSIBLE_RECRUITER : RecruiterType.HUMAN_RECRUITER, isAutoEmail ? 80 : 90, "Email Signature Analysis");
        }

        if (isAutoEmail)
        {
            var teamMatch = Regex.Match(cleanBody, @"\b([A-Za-z0-9& ]+(?:Talent Acquisition|Recruitment|Hiring|Careers|Talent) Team)\b", RegexOptions.IgnoreCase);
            var teamName = teamMatch.Success ? teamMatch.Groups[1].Value.Trim() :
                (!string.IsNullOrWhiteSpace(safeSender) && !safeSender.Equals("noreply", StringComparison.OrdinalIgnoreCase) && !safeSender.Equals("no-reply", StringComparison.OrdinalIgnoreCase)
                    ? safeSender : (company != null ? $"{company} Talent Team" : "Automated Talent System"));

            return new RecruiterInfo(teamName, safeEmail, "Automated ATS / System Sender", null, null, RecruiterType.AUTOMATED_SYSTEM, 95, "Automated ATS Delivery");
        }

        var fallbackName = !string.IsNullOrWhiteSpace(safeSender) ? safeSender : (company ?? "Unknown Sender");
        return new RecruiterInfo(fallbackName, safeEmail, "Job Application Contact", sigPhone, sigLinkedin, RecruiterType.NO_RECRUITER_IDENTIFIED, 20, "No Signature Contact Identified");
    }

    private async Task<RecruiterInfo?> CallGeminiFallbackAsync(string? subject, string? body, string? sender, string? senderEmail, string? company, string apiKey)
    {
        var prompt = $"Analyze this job email and extract structured recruiter/contact information.\nEmail Subject: {subject}\nSender: {sender} <{senderEmail}>\nCompany: {company}\nBody: {(body != null && body.Length > 2000 ? body[..2000] : body)}\n\nReturn ONLY valid JSON with keys: name (string or null), email (string or null), title (string or null), phone (string or null), linkedin (string or null), type (one of: HUMAN_RECRUITER, POSSIBLE_RECRUITER, AUTOMATED_SYSTEM, NO_RECRUITER_IDENTIFIED), confidence (integer 0-100), source (string).";

        var payload = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";
        var response = await _httpClient.PostAsJsonAsync(url, payload);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var candidates = doc.RootElement.GetProperty("candidates");
        if (candidates.GetArrayLength() == 0) return null;

        var text = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "";
        text = text.Replace("```json", "").Replace("```", "").Trim();

        using var parsedDoc = JsonDocument.Parse(text);
        var root = parsedDoc.RootElement;

        var name = root.TryGetProperty("name", out var n) && n.ValueKind == JsonValueKind.String ? n.GetString() : null;
        var email = root.TryGetProperty("email", out var e) && e.ValueKind == JsonValueKind.String ? e.GetString() : null;
        var title = root.TryGetProperty("title", out var t) && t.ValueKind == JsonValueKind.String ? t.GetString() : null;
        var phone = root.TryGetProperty("phone", out var p) && p.ValueKind == JsonValueKind.String ? p.GetString() : null;
        var linkedin = root.TryGetProperty("linkedin", out var l) && l.ValueKind == JsonValueKind.String ? l.GetString() : null;
        var typeStr = root.TryGetProperty("type", out var ty) && ty.ValueKind == JsonValueKind.String ? ty.GetString() : null;
        var conf = root.TryGetProperty("confidence", out var c) && c.ValueKind == JsonValueKind.Number ? c.GetInt32() : 75;
        var source = root.TryGetProperty("source", out var s) && s.ValueKind == JsonValueKind.String ? s.GetString() : "AI Assisted Extraction";

        var type = RecruiterType.NO_RECRUITER_IDENTIFIED;
        if (!string.IsNullOrEmpty(typeStr) && Enum.TryParse<RecruiterType>(typeStr, true, out var parsedType))
        {
            type = parsedType;
        }

        return new RecruiterInfo(name, email, title, phone, linkedin, type, conf, source ?? "AI Assisted Extraction");
    }
}
