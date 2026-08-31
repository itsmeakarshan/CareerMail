using CareerMail.Api.Data;
using CareerMail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SettingsController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly IGeminiCvService _geminiCvService;
    private readonly IConfiguration _configuration;

    public SettingsController(AppDbContext context, IGeminiCvService geminiCvService, IConfiguration configuration)
    {
        _context = context;
        _geminiCvService = geminiCvService;
        _configuration = configuration;
    }

    public class GeminiKeyRequest
    {
        public string? ApiKey { get; set; }
    }

    [HttpGet("gemini")]
    public async Task<IActionResult> GetGeminiStatus()
    {
        var userId = CurrentUserId;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return Unauthorized();

        var key = user.GeminiApiKey ?? _configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        bool isConfigured = !string.IsNullOrWhiteSpace(key);

        string maskedKey = "";
        if (isConfigured && key!.Length >= 8)
        {
            maskedKey = $"{key[..4]}****************{key[^4..]}";
        }
        else if (isConfigured)
        {
            maskedKey = "Configured ✓";
        }

        return Ok(new
        {
            isConfigured,
            isEnabled = isConfigured,
            maskedKey,
            status = isConfigured ? "✓ Gemini Connected" : "Not Configured"
        });
    }

    [HttpPost("gemini")]
    public async Task<IActionResult> SaveGeminiKey([FromBody] GeminiKeyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.ApiKey))
        {
            return BadRequest(new { success = false, message = "Gemini API Key cannot be empty." });
        }

        var userId = CurrentUserId;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return Unauthorized();

        // 1. Test key connection with Gemini
        var testResult = await _geminiCvService.TestApiKeyAsync(request.ApiKey.Trim());
        if (!testResult.Success)
        {
            return BadRequest(new { success = false, message = testResult.Message });
        }

        // 2. Securely save to DB
        user.GeminiApiKey = request.ApiKey.Trim();
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var key = user.GeminiApiKey;
        string maskedKey = key.Length >= 8 ? $"{key[..4]}****************{key[^4..]}" : "Configured ✓";

        return Ok(new
        {
            success = true,
            message = "Gemini API Key validated and saved successfully!",
            maskedKey,
            status = "✓ Gemini Connected"
        });
    }

    [HttpPost("gemini/test")]
    public async Task<IActionResult> TestGeminiKey([FromBody] GeminiKeyRequest? request)
    {
        var userId = CurrentUserId;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return Unauthorized();

        var keyToTest = !string.IsNullOrWhiteSpace(request?.ApiKey)
            ? request.ApiKey.Trim()
            : user.GeminiApiKey ?? _configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        if (string.IsNullOrWhiteSpace(keyToTest))
        {
            return BadRequest(new { success = false, message = "No Gemini API Key provided to test." });
        }

        var testResult = await _geminiCvService.TestApiKeyAsync(keyToTest);
        if (!testResult.Success)
        {
            return BadRequest(new { success = false, message = testResult.Message });
        }

        return Ok(new
        {
            success = true,
            message = "✓ Gemini Connected: API key is valid and responsive."
        });
    }

    [HttpDelete("gemini")]
    public async Task<IActionResult> RemoveGeminiKey()
    {
        var userId = CurrentUserId;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return Unauthorized();

        user.GeminiApiKey = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Gemini API Key removed successfully."
        });
    }
}
