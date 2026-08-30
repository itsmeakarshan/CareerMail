using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Web;
using CareerMail.Api.Data;
using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;
using MimeKit;

namespace CareerMail.Api.Services;

public interface IGmailService
{
    Task<ConnectedAccount?> GetConnectedAccountAsync(User user);
    Task DisconnectAccountAsync(User user);
    Task<GmailSyncResponse> ScanAndProcessAsync(User user, int maxResults = 30);
    Task<GmailSyncResponse> ReprocessStoredEmailsAsync(User user);
    Task<Email> SendEmailAsync(User user, EmailComposeRequest request);
    Email ParseGmailMessage(JsonElement messageJson, User user, string msgId, string threadId);
}

public class GmailService : IGmailService
{
    private const string GmailMessagesEndpoint = "https://gmail.googleapis.com/gmail/v1/users/me/messages";
    private const string GmailSendEndpoint = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

    private readonly AppDbContext _context;
    private readonly IGoogleOAuthService _googleOAuthService;
    private readonly IEmailAnalysisService _emailAnalysisService;
    private readonly HttpClient _httpClient;
    private readonly ILogger<GmailService> _logger;

    public GmailService(
        AppDbContext context,
        IGoogleOAuthService googleOAuthService,
        IEmailAnalysisService emailAnalysisService,
        HttpClient httpClient,
        ILogger<GmailService> logger)
    {
        _context = context;
        _googleOAuthService = googleOAuthService;
        _emailAnalysisService = emailAnalysisService;
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<ConnectedAccount?> GetConnectedAccountAsync(User user)
    {
        return await _context.ConnectedAccounts
            .FirstOrDefaultAsync(ca => ca.UserId == user.Id && ca.Provider == "google");
    }

    public async Task DisconnectAccountAsync(User user)
    {
        var account = await GetConnectedAccountAsync(user);
        if (account != null)
        {
            _context.ConnectedAccounts.Remove(account);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<GmailSyncResponse> ScanAndProcessAsync(User user, int maxResults = 30)
    {
        var account = await GetConnectedAccountAsync(user);
        if (account == null || string.IsNullOrWhiteSpace(account.AccessToken))
        {
            return new GmailSyncResponse(false, 0, 0, 0, 0, 0, 0, 0,
                "No Google account connected. Please connect your Gmail account in Settings or Login.", DateTime.UtcNow);
        }

        var accessToken = await _googleOAuthService.GetValidAccessTokenAsync(account);
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return new GmailSyncResponse(false, 0, 0, 0, 0, 0, 0, 0,
                "Google authentication expired or token unavailable. Please reconnect Gmail in Settings.", DateTime.UtcNow);
        }

        const string query = "newer_than:90d (application OR interview OR recruiter OR \"job offer\" OR \"coding challenge\" OR \"screening call\" OR hackerrank OR codility OR \"thank you for applying\" OR \"we have received your application\" OR \"move forward\")";
        var listUrl = $"{GmailMessagesEndpoint}?maxResults={Math.Clamp(maxResults, 1, 100)}&q={HttpUtility.UrlEncode(query)}";

        var listReq = new HttpRequestMessage(HttpMethod.Get, listUrl);
        listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var listResp = await _httpClient.SendAsync(listReq);

        if (!listResp.IsSuccessStatusCode)
        {
            var err = await listResp.Content.ReadAsStringAsync();
            _logger.LogError("Failed to list messages from Gmail API: {Error}", err);
            return new GmailSyncResponse(false, 0, 0, 0, 0, 0, 0, 0, $"Gmail sync error: {listResp.ReasonPhrase}", DateTime.UtcNow);
        }

        using var listDoc = JsonDocument.Parse(await listResp.Content.ReadAsStringAsync());
        var listRoot = listDoc.RootElement;

        var scannedCount = 0;
        var jobRelatedCount = 0;
        var appsCreated = 0;
        var appsUpdated = 0;
        var interviewsCreated = 0;
        var followUpsCreated = 0;

        if (listRoot.TryGetProperty("messages", out var messages) && messages.ValueKind == JsonValueKind.Array)
        {
            foreach (var m in messages.EnumerateArray())
            {
                var msgId = m.GetProperty("id").GetString()!;
                var threadId = m.GetProperty("threadId").GetString()!;

                // Check if already stored
                var existing = await _context.Emails.FirstOrDefaultAsync(e => e.UserId == user.Id && e.GmailMessageId == msgId);
                if (existing != null)
                {
                    scannedCount++;
                    if (existing.IsJobRelated) jobRelatedCount++;
                    continue;
                }

                // Fetch full message
                var detailUrl = $"{GmailMessagesEndpoint}/{msgId}?format=full";
                var detailReq = new HttpRequestMessage(HttpMethod.Get, detailUrl);
                detailReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                var detailResp = await _httpClient.SendAsync(detailReq);

                if (detailResp.IsSuccessStatusCode)
                {
                    using var detailDoc = JsonDocument.Parse(await detailResp.Content.ReadAsStringAsync());
                    var email = ParseGmailMessage(detailDoc.RootElement, user, msgId, threadId);

                    _context.Emails.Add(email);
                    await _context.SaveChangesAsync();

                    var outcome = await _emailAnalysisService.ProcessEmailAsync(email, user);
                    scannedCount++;
                    if (outcome.IsJobRelated) jobRelatedCount++;
                    if (outcome.ApplicationCreated) appsCreated++;
                    if (outcome.ApplicationUpdated) appsUpdated++;
                    if (outcome.InterviewCreated) interviewsCreated++;
                    if (outcome.FollowUpCreated) followUpsCreated++;
                }
            }
        }

        account.LastSyncedAt = DateTime.UtcNow;
        account.TotalEmailsScanned = scannedCount;
        await _context.SaveChangesAsync();

        var msg = $"Successfully synced {scannedCount} emails ({jobRelatedCount} job-related, {appsCreated} new applications tracked, {interviewsCreated} interviews logged).";
        return new GmailSyncResponse(true, scannedCount, jobRelatedCount, appsCreated, appsUpdated, interviewsCreated, followUpsCreated, scannedCount, msg, DateTime.UtcNow);
    }

    public async Task<GmailSyncResponse> ReprocessStoredEmailsAsync(User user)
    {
        await _emailAnalysisService.ReprocessAllUserEmailsAsync(user);
        var total = await _context.Emails.CountAsync(e => e.UserId == user.Id);
        var jobRelated = await _context.Emails.CountAsync(e => e.UserId == user.Id && e.IsJobRelated);
        var apps = await _context.JobApplications.CountAsync(ja => ja.UserId == user.Id);
        var ints = await _context.Interviews.CountAsync(i => i.UserId == user.Id);
        var followUps = await _context.FollowUps.CountAsync(f => f.UserId == user.Id);

        return new GmailSyncResponse(true, total, jobRelated, apps, 0, ints, followUps, total, "Reprocessed all stored emails.", DateTime.UtcNow);
    }

    public async Task<Email> SendEmailAsync(User user, EmailComposeRequest request)
    {
        var account = await GetConnectedAccountAsync(user);
        var isConnected = account != null && !string.IsNullOrWhiteSpace(account.AccessToken);

        string? gmailMessageId = null;

        if (isConnected)
        {
            var accessToken = await _googleOAuthService.GetValidAccessTokenAsync(account!);
            if (!string.IsNullOrWhiteSpace(accessToken))
            {
                try
                {
                    var mimeMessage = new MimeMessage();
                    mimeMessage.From.Add(new MailboxAddress(user.Name, account!.ProviderEmail ?? user.Email));
                    mimeMessage.To.Add(new MailboxAddress(request.RecruiterName ?? request.To, request.To));
                    mimeMessage.Subject = request.Subject;
                    mimeMessage.Body = new TextPart("plain") { Text = request.Body };

                    using var memory = new MemoryStream();
                    await mimeMessage.WriteToAsync(memory);
                    var rawBase64Url = Convert.ToBase64String(memory.ToArray())
                        .Replace("+", "-").Replace("/", "_").Replace("=", "");

                    var sendPayload = new { raw = rawBase64Url };
                    var sendReq = new HttpRequestMessage(HttpMethod.Post, GmailSendEndpoint);
                    sendReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                    sendReq.Content = new StringContent(JsonSerializer.Serialize(sendPayload), Encoding.UTF8, "application/json");

                    var sendResp = await _httpClient.SendAsync(sendReq);
                    if (sendResp.IsSuccessStatusCode)
                    {
                        using var sendDoc = JsonDocument.Parse(await sendResp.Content.ReadAsStringAsync());
                        gmailMessageId = sendDoc.RootElement.GetProperty("id").GetString();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Failed to dispatch email directly through Gmail API: {Message}", ex.Message);
                }
            }
        }

        var sentEmail = new Email
        {
            UserId = user.Id,
            Sender = user.Name,
            SenderEmail = account?.ProviderEmail ?? user.Email,
            RecipientEmail = request.To,
            Subject = request.Subject,
            Body = request.Body,
            Preview = request.Body.Length > 120 ? request.Body[..120] + "..." : request.Body,
            Timestamp = DateTime.UtcNow,
            Folder = EmailFolder.SENT,
            IsRead = true,
            JobApplicationId = request.JobApplicationId,
            GmailMessageId = gmailMessageId,
            IsJobRelated = request.JobApplicationId.HasValue
        };

        _context.Emails.Add(sentEmail);
        await _context.SaveChangesAsync();

        if (request.JobApplicationId.HasValue)
        {
            var app = await _context.JobApplications.FindAsync(request.JobApplicationId.Value);
            if (app != null)
            {
                app.LastActivityDate = DateOnly.FromDateTime(DateTime.UtcNow);
                app.TimelineEvents.Add(new TimelineEvent
                {
                    Title = $"Sent Email: {request.Subject}",
                    Description = $"Message sent to {request.To}",
                    EventDate = DateTime.UtcNow,
                    EventType = "EMAIL_SENT"
                });
                await _context.SaveChangesAsync();
            }
        }

        return sentEmail;
    }

    public Email ParseGmailMessage(JsonElement messageJson, User user, string msgId, string threadId)
    {
        var email = new Email
        {
            UserId = user.Id,
            GmailMessageId = msgId,
            GmailThreadId = threadId,
            Timestamp = DateTime.UtcNow,
            Folder = EmailFolder.INBOX,
            IsRead = false
        };

        if (messageJson.TryGetProperty("internalDate", out var idProp) && long.TryParse(idProp.GetString(), out var ms))
        {
            email.Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(ms).UtcDateTime;
        }

        if (messageJson.TryGetProperty("labelIds", out var labelIds) && labelIds.ValueKind == JsonValueKind.Array)
        {
            var labels = labelIds.EnumerateArray().Select(l => l.GetString()).ToList();
            if (labels.Contains("UNREAD")) email.IsRead = false;
            if (labels.Contains("STARRED")) email.IsStarred = true;
            if (labels.Contains("IMPORTANT")) email.IsImportant = true;
            if (labels.Contains("SENT")) email.Folder = EmailFolder.SENT;
            if (labels.Contains("DRAFT")) email.Folder = EmailFolder.DRAFTS;
            if (labels.Contains("TRASH")) email.Folder = EmailFolder.TRASH;
        }

        if (messageJson.TryGetProperty("payload", out var payload))
        {
            if (payload.TryGetProperty("headers", out var headers) && headers.ValueKind == JsonValueKind.Array)
            {
                foreach (var h in headers.EnumerateArray())
                {
                    var name = h.GetProperty("name").GetString();
                    var val = h.GetProperty("value").GetString() ?? "";

                    if (string.Equals(name, "Subject", StringComparison.OrdinalIgnoreCase))
                    {
                        email.Subject = val;
                    }
                    else if (string.Equals(name, "From", StringComparison.OrdinalIgnoreCase))
                    {
                        var (senderName, senderEmail) = ParseFromHeader(val);
                        email.Sender = senderName;
                        email.SenderEmail = senderEmail;
                    }
                    else if (string.Equals(name, "To", StringComparison.OrdinalIgnoreCase))
                    {
                        email.RecipientEmail = val;
                    }
                }
            }

            var bodyText = ExtractBodyText(payload);
            email.Body = !string.IsNullOrWhiteSpace(bodyText) ? bodyText : messageJson.TryGetProperty("snippet", out var snip) ? snip.GetString() ?? "" : "";
            email.Preview = email.Body.Length > 140 ? email.Body[..140] + "..." : email.Body;
        }

        if (string.IsNullOrWhiteSpace(email.Subject)) email.Subject = "(No Subject)";
        if (string.IsNullOrWhiteSpace(email.Sender)) email.Sender = "Unknown Sender";
        if (string.IsNullOrWhiteSpace(email.SenderEmail)) email.SenderEmail = "unknown@example.com";

        return email;
    }

    private static (string name, string email) ParseFromHeader(string from)
    {
        if (from.Contains("<") && from.Contains(">"))
        {
            var name = from[..from.IndexOf("<")].Trim().Trim('"');
            var email = from[(from.IndexOf("<") + 1)..from.IndexOf(">")].Trim();
            return (string.IsNullOrWhiteSpace(name) ? email : name, email);
        }
        return (from.Trim(), from.Trim());
    }

    private static string ExtractBodyText(JsonElement payload)
    {
        if (payload.TryGetProperty("body", out var body) && body.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.String)
        {
            var text = DecodeBase64Url(data.GetString()!);
            if (!string.IsNullOrWhiteSpace(text)) return text;
        }

        if (payload.TryGetProperty("parts", out var parts) && parts.ValueKind == JsonValueKind.Array)
        {
            foreach (var part in parts.EnumerateArray())
            {
                var mimeType = part.TryGetProperty("mimeType", out var mt) ? mt.GetString() : "";
                if (mimeType == "text/plain" || mimeType == "text/html")
                {
                    if (part.TryGetProperty("body", out var pBody) && pBody.TryGetProperty("data", out var pData) && pData.ValueKind == JsonValueKind.String)
                    {
                        var decoded = DecodeBase64Url(pData.GetString()!);
                        if (!string.IsNullOrWhiteSpace(decoded)) return decoded;
                    }
                }
                var nested = ExtractBodyText(part);
                if (!string.IsNullOrWhiteSpace(nested)) return nested;
            }
        }

        return string.Empty;
    }

    private static string DecodeBase64Url(string base64Url)
    {
        try
        {
            var padded = base64Url.Replace("-", "+").Replace("_", "/");
            switch (padded.Length % 4)
            {
                case 2: padded += "=="; break;
                case 3: padded += "="; break;
            }
            var bytes = Convert.FromBase64String(padded);
            return Encoding.UTF8.GetString(bytes);
        }
        catch
        {
            return string.Empty;
        }
    }
}
