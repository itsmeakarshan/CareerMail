using System.Net.Http.Headers;
using System.Text.Json;
using System.Web;
using CareerMail.Api.Data;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Security;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Services;

public interface IGoogleOAuthService
{
    bool IsConfigured();
    string GetRedirectUri();
    string GetFrontendUrl();
    string GenerateAuthorizationUrl(string? state);
    Task<GoogleOAuthService.OAuthCallbackResult> HandleOAuthCallbackAsync(string code, string? state);
    Task<string?> GetValidAccessTokenAsync(ConnectedAccount account);
    Task<string?> ForceRefreshTokenAsync(ConnectedAccount account);
}

public class GoogleOAuthService : IGoogleOAuthService
{
    private const string GoogleAuthEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    private const string GoogleTokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string GoogleUserinfoEndpoint = "https://www.googleapis.com/oauth2/v3/userinfo";

    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;
    private readonly HttpClient _httpClient;
    private readonly ILogger<GoogleOAuthService> _logger;

    public GoogleOAuthService(
        IConfiguration configuration,
        AppDbContext context,
        JwtService jwtService,
        HttpClient httpClient,
        ILogger<GoogleOAuthService> logger)
    {
        _configuration = configuration;
        _context = context;
        _jwtService = jwtService;
        _httpClient = httpClient;
        _logger = logger;
    }

    private string? ClientId => _configuration["Google:ClientId"] ?? _configuration["GOOGLE_CLIENT_ID"];
    private string? ClientSecret => _configuration["Google:ClientSecret"] ?? _configuration["GOOGLE_CLIENT_SECRET"];
    private string RedirectUri => _configuration["Google:RedirectUri"] ?? _configuration["GOOGLE_REDIRECT_URI"] ?? "http://localhost:8080/api/auth/google/callback";
    private string FrontendUrl => _configuration["Google:FrontendUrl"] ?? _configuration["FRONTEND_URL"] ?? "http://localhost:5173";

    public bool IsConfigured() => !string.IsNullOrWhiteSpace(ClientId) && !string.IsNullOrWhiteSpace(ClientSecret);
    public string GetRedirectUri() => RedirectUri;
    public string GetFrontendUrl() => FrontendUrl;

    public string GenerateAuthorizationUrl(string? stateParam)
    {
        var state = !string.IsNullOrWhiteSpace(stateParam) ? stateParam : Guid.NewGuid().ToString();
        const string scopes = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";

        var query = HttpUtility.ParseQueryString(string.Empty);
        query["client_id"] = ClientId ?? "";
        query["redirect_uri"] = RedirectUri;
        query["response_type"] = "code";
        query["scope"] = scopes;
        query["access_type"] = "offline";
        query["prompt"] = "consent";
        query["include_granted_scopes"] = "true";
        query["state"] = state;

        return $"{GoogleAuthEndpoint}?{query}";
    }

    public record OAuthCallbackResult(User User, ConnectedAccount Account, string Jwt);

    public async Task<OAuthCallbackResult> HandleOAuthCallbackAsync(string code, string? state)
    {
        if (!IsConfigured())
        {
            throw new InvalidOperationException("Google OAuth client is not configured on the server. Please provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
        }

        // 1. Exchange code for tokens
        var tokenReqContent = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = ClientId!,
            ["client_secret"] = ClientSecret!,
            ["redirect_uri"] = RedirectUri,
            ["grant_type"] = "authorization_code"
        });

        var tokenResp = await _httpClient.PostAsync(GoogleTokenEndpoint, tokenReqContent);
        if (!tokenResp.IsSuccessStatusCode)
        {
            var err = await tokenResp.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Failed to exchange code with Google OAuth endpoint: {err}");
        }

        using var tokenDoc = JsonDocument.Parse(await tokenResp.Content.ReadAsStringAsync());
        var tokenRoot = tokenDoc.RootElement;
        var accessToken = tokenRoot.GetProperty("access_token").GetString()!;
        var refreshToken = tokenRoot.TryGetProperty("refresh_token", out var rf) ? rf.GetString() : null;
        var expiresIn = tokenRoot.TryGetProperty("expires_in", out var exp) ? exp.GetInt64() : 3600;
        var scope = tokenRoot.TryGetProperty("scope", out var sc) ? sc.GetString() : null;

        // 2. Fetch User Profile
        var userinfoReq = new HttpRequestMessage(HttpMethod.Get, GoogleUserinfoEndpoint);
        userinfoReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var userinfoResp = await _httpClient.SendAsync(userinfoReq);
        if (!userinfoResp.IsSuccessStatusCode)
        {
            throw new InvalidOperationException("Failed to retrieve Google user profile info");
        }

        using var userDoc = JsonDocument.Parse(await userinfoResp.Content.ReadAsStringAsync());
        var userRoot = userDoc.RootElement;
        var googleSub = userRoot.GetProperty("sub").GetString()!;
        var googleEmail = userRoot.TryGetProperty("email", out var ge) ? ge.GetString() : null;
        var googleName = userRoot.TryGetProperty("name", out var gn) ? gn.GetString() : "Google User";
        var googlePicture = userRoot.TryGetProperty("picture", out var gp) ? gp.GetString() : null;

        // 3. Match or Create User
        User? user = null;
        if (state != null && state.StartsWith("user:"))
        {
            if (long.TryParse(state[5..], out var uId))
            {
                user = await _context.Users.FindAsync(uId);
            }
        }

        if (user == null && googleEmail != null)
        {
            var normalizedEmail = googleEmail.Trim().ToLowerInvariant();
            user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        }

        if (user == null)
        {
            user = new User
            {
                Name = googleName ?? "Google User",
                Email = googleEmail != null ? googleEmail.Trim().ToLowerInvariant() : $"google_{googleSub}@careermail.io",
                Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                AvatarUrl = googlePicture ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        // 4. Save or Update ConnectedAccount
        var account = await _context.ConnectedAccounts
            .FirstOrDefaultAsync(ca => ca.UserId == user.Id && ca.Provider == "google");

        if (account == null)
        {
            account = new ConnectedAccount
            {
                UserId = user.Id,
                Provider = "google"
            };
            _context.ConnectedAccounts.Add(account);
        }

        account.ProviderEmail = googleEmail;
        account.ProviderAccountId = googleSub;
        account.AccessToken = accessToken;
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            account.RefreshToken = refreshToken;
        }
        account.TokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 60);
        account.Scope = scope;
        account.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var jwt = _jwtService.GenerateToken(user.Email, user.Id);
        return new OAuthCallbackResult(user, account, jwt);
    }

    public async Task<string?> GetValidAccessTokenAsync(ConnectedAccount account)
    {
        if (account.TokenExpiry.HasValue && account.TokenExpiry.Value > DateTime.UtcNow && !string.IsNullOrWhiteSpace(account.AccessToken))
        {
            return account.AccessToken;
        }

        return await ForceRefreshTokenAsync(account);
    }

    public async Task<string?> ForceRefreshTokenAsync(ConnectedAccount account)
    {
        if (string.IsNullOrWhiteSpace(account.RefreshToken))
        {
            _logger.LogWarning("Cannot refresh token: refresh token is null/blank for account {Email}", account.ProviderEmail);
            return account.AccessToken;
        }

        try
        {
            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = ClientId!,
                ["client_secret"] = ClientSecret!,
                ["refresh_token"] = account.RefreshToken,
                ["grant_type"] = "refresh_token"
            });

            var resp = await _httpClient.PostAsync(GoogleTokenEndpoint, content);
            if (resp.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
                var newAccessToken = doc.RootElement.GetProperty("access_token").GetString()!;
                var expiresIn = doc.RootElement.TryGetProperty("expires_in", out var exp) ? exp.GetInt64() : 3600;

                account.AccessToken = newAccessToken;
                account.TokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 60);
                account.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully refreshed Google OAuth access token for {Email}", account.ProviderEmail);
                return newAccessToken;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to force refresh Google OAuth token for {Email}", account.ProviderEmail);
        }

        return account.AccessToken;
    }
}
