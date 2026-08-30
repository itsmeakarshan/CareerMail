using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareerMail.Api.Controllers;

[Authorize]
[Route("api/emails")]
public class EmailsController : BaseApiController
{
    private readonly IEmailService _emailService;

    public EmailsController(IEmailService emailService)
    {
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Email>>> GetEmails([FromQuery] string folder = "inbox")
    {
        if ("starred".Equals(folder, StringComparison.OrdinalIgnoreCase))
        {
            return Ok(await _emailService.GetStarredEmailsAsync(CurrentUserId));
        }
        if ("important".Equals(folder, StringComparison.OrdinalIgnoreCase))
        {
            return Ok(await _emailService.GetImportantEmailsAsync(CurrentUserId));
        }
        return Ok(await _emailService.GetEmailsByFolderAsync(CurrentUserId, folder));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Email>> GetEmailById(long id)
    {
        var email = await _emailService.GetEmailByIdAsync(CurrentUserId, id);
        return Ok(email);
    }

    [HttpGet("application/{applicationId}")]
    public async Task<ActionResult<List<Email>>> GetEmailsByApplication(long applicationId)
    {
        var list = await _emailService.GetEmailsByJobApplicationAsync(CurrentUserId, applicationId);
        return Ok(list);
    }

    [HttpPatch("{id}/read")]
    public async Task<ActionResult<Email>> MarkRead(long id, [FromQuery] bool read = true)
    {
        var email = await _emailService.MarkReadAsync(CurrentUserId, id, read);
        return Ok(email);
    }

    [HttpPatch("{id}/star")]
    public async Task<ActionResult<Email>> ToggleStar(long id)
    {
        var email = await _emailService.ToggleStarAsync(CurrentUserId, id);
        return Ok(email);
    }

    [HttpPatch("{id}/important")]
    public async Task<ActionResult<Email>> ToggleImportant(long id)
    {
        var email = await _emailService.ToggleImportantAsync(CurrentUserId, id);
        return Ok(email);
    }

    [HttpPatch("{id}/move")]
    public async Task<ActionResult<Email>> MoveToFolder(long id, [FromQuery] string folder)
    {
        var email = await _emailService.MoveToFolderAsync(CurrentUserId, id, folder);
        return Ok(email);
    }

    [HttpPost("compose")]
    public async Task<ActionResult<Email>> ComposeEmail([FromBody] EmailComposeRequest request)
    {
        var email = await _emailService.ComposeEmailAsync(CurrentUserId, request);
        return Ok(email);
    }

    [HttpPost("send")]
    public async Task<ActionResult<Email>> SendEmail([FromBody] EmailComposeRequest request)
    {
        var email = await _emailService.ComposeEmailAsync(CurrentUserId, request);
        return Ok(email);
    }

    [HttpPost("simulate")]
    public async Task<ActionResult<Email>> SimulateIncomingEmail([FromBody] Dictionary<string, object> payload)
    {
        var sender = payload.TryGetValue("sender", out var s) ? s?.ToString() ?? "Recruiter" : "Recruiter";
        var senderEmail = payload.TryGetValue("senderEmail", out var se) ? se?.ToString() ?? "recruiter@example.com" : "recruiter@example.com";
        var subject = payload.TryGetValue("subject", out var sub) ? sub?.ToString() ?? "Update on your application" : "Update on your application";
        var body = payload.TryGetValue("body", out var b) ? b?.ToString() ?? "Thank you for applying." : "Thank you for applying.";
        var important = payload.TryGetValue("important", out var imp) && bool.TryParse(imp?.ToString(), out var parsedImp) && parsedImp;

        var email = await _emailService.SimulateIncomingEmailAsync(CurrentUserId, sender, senderEmail, subject, body, important);
        return Ok(email);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEmail(long id)
    {
        await _emailService.DeleteEmailAsync(CurrentUserId, id);
        return Ok(new { message = "Email deleted successfully" });
    }

    [HttpGet("counts")]
    public async Task<ActionResult<Dictionary<string, long>>> GetFolderCounts()
    {
        var counts = await _emailService.GetFolderCountsAsync(CurrentUserId);
        return Ok(counts);
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<Email>>> SearchEmails([FromQuery] string? q)
    {
        var results = await _emailService.SearchEmailsAsync(CurrentUserId, q);
        return Ok(results);
    }
}
