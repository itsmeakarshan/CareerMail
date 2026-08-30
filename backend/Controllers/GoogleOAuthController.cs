using System.Web;
using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareerMail.Api.Controllers;

[Route("api/auth/google")]
public class GoogleOAuthController : BaseApiController
{
    private readonly IGoogleOAuthService _googleOAuthService;
    private readonly IAuthService _authService;

    public GoogleOAuthController(IGoogleOAuthService googleOAuthService, IAuthService authService)
    {
        _googleOAuthService = googleOAuthService;
        _authService = authService;
    }

    [HttpGet("url")]
    [AllowAnonymous]
    public IActionResult GetAuthorizationUrl([FromQuery] string? state)
    {
        var finalState = state;
        try
        {
            if (User.Identity?.IsAuthenticated == true && string.IsNullOrWhiteSpace(finalState))
            {
                finalState = $"user:{CurrentUserId}";
            }
        }
        catch
        {
            // Ignored if anonymous
        }

        var url = _googleOAuthService.GenerateAuthorizationUrl(finalState);
        return Ok(new GoogleAuthUrlResponse(url, finalState));
    }

    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleCallback([FromQuery] string? code, [FromQuery] string? state, [FromQuery] string? error)
    {
        var frontendUrl = _googleOAuthService.GetFrontendUrl();

        if (!string.IsNullOrWhiteSpace(error))
        {
            return Redirect($"{frontendUrl}/settings?error={HttpUtility.UrlEncode(error)}");
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            return Redirect($"{frontendUrl}/settings?error=missing_code");
        }

        try
        {
            var result = await _googleOAuthService.HandleOAuthCallbackAsync(code, state);
            return Redirect($"{frontendUrl}/settings?gmail=connected&token={HttpUtility.UrlEncode(result.Jwt)}");
        }
        catch (Exception ex)
        {
            return Redirect($"{frontendUrl}/settings?error={HttpUtility.UrlEncode(ex.Message ?? "oauth_failed")}");
        }
    }

    [HttpGet("config")]
    [AllowAnonymous]
    public IActionResult GetConfig()
    {
        return Ok(new Dictionary<string, object>
        {
            ["configured"] = _googleOAuthService.IsConfigured(),
            ["redirectUri"] = _googleOAuthService.GetRedirectUri(),
            ["frontendUrl"] = _googleOAuthService.GetFrontendUrl()
        });
    }
}
