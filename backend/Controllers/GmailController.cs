using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareerMail.Api.Controllers;

[Authorize]
[Route("api/gmail")]
public class GmailController : BaseApiController
{
    private readonly IGmailService _gmailService;
    private readonly IAuthService _authService;
    private readonly IGoogleOAuthService _googleOAuthService;

    public GmailController(IGmailService gmailService, IAuthService authService, IGoogleOAuthService googleOAuthService)
    {
        _gmailService = gmailService;
        _authService = authService;
        _googleOAuthService = googleOAuthService;
    }

    [HttpGet("status")]
    public async Task<ActionResult<GmailStatusResponse>> GetStatus()
    {
        var user = await _authService.GetCurrentUserAsync(CurrentUserId);
        var account = await _gmailService.GetConnectedAccountAsync(user);
        var configured = _googleOAuthService.IsConfigured();

        if (account != null)
        {
            var hasSend = !string.IsNullOrWhiteSpace(account.Scope) &&
                          (account.Scope.Contains("gmail.send") || account.Scope.Contains("mail.google.com"));

            return Ok(new GmailStatusResponse(
                true,
                account.ProviderEmail ?? user.Email,
                account.Provider,
                account.LastSyncedAt,
                account.TotalEmailsScanned,
                configured,
                account.Scope,
                hasSend
            ));
        }

        return Ok(new GmailStatusResponse(
            false,
            null,
            "google",
            null,
            0,
            configured,
            null,
            false
        ));
    }

    [HttpPost("sync")]
    public async Task<ActionResult<GmailSyncResponse>> SyncGmail([FromQuery] int maxResults = 30)
    {
        var user = await _authService.GetCurrentUserAsync(CurrentUserId);
        var result = await _gmailService.ScanAndProcessAsync(user, maxResults);
        return Ok(result);
    }

    [HttpPost("reprocess")]
    public async Task<ActionResult<GmailSyncResponse>> ReprocessStoredEmails()
    {
        var user = await _authService.GetCurrentUserAsync(CurrentUserId);
        var result = await _gmailService.ReprocessStoredEmailsAsync(user);
        return Ok(result);
    }

    [HttpPost("disconnect")]
    public async Task<IActionResult> Disconnect()
    {
        var user = await _authService.GetCurrentUserAsync(CurrentUserId);
        await _gmailService.DisconnectAccountAsync(user);
        return Ok(new { message = "Gmail integration disconnected successfully" });
    }
}
