using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CareerMail.Api.Data;
using CareerMail.Api.Security;
using CareerMail.Api.Services;
using CareerMail.Api.Services.Analyzer;
using CareerMail.Api.Services.JobProviders;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. Connection String Resolution
var rawConn = Environment.GetEnvironmentVariable("SPRING_DATASOURCE_URL")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("POSTGRES_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

var dbUser = Environment.GetEnvironmentVariable("SPRING_DATASOURCE_USERNAME")
    ?? Environment.GetEnvironmentVariable("DB_USER")
    ?? "careermail";
var dbPass = Environment.GetEnvironmentVariable("SPRING_DATASOURCE_PASSWORD")
    ?? Environment.GetEnvironmentVariable("DB_PASSWORD")
    ?? "careermail123";
var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "careermail";

var formattedConn = ParsePostgreSqlConnectionString(rawConn, dbHost, dbPort, dbName, dbUser, dbPass);

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(formattedConn)
           .UseSnakeCaseNamingConvention();
});

// 2. JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

builder.Services.AddSingleton<JwtService>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret.PadRight(32))),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// 3. CORS Policy
var corsOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")
    ?? builder.Configuration["Cors:AllowedOrigins"]
    ?? "http://localhost:5173,http://localhost:3000,http://localhost";

var allowedOriginsList = corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                if (allowedOriginsList.Contains(origin)) return true;
                if (origin.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase)) return true;
                if (origin.StartsWith("http://localhost:", StringComparison.OrdinalIgnoreCase)) return true;
                return false;
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// 4. HTTP Client & JSON Controllers
builder.Services.AddHttpClient();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// 5. Dependency Injection Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJobApplicationService, JobApplicationService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IInterviewService, InterviewService>();
builder.Services.AddScoped<IFollowUpService, FollowUpService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IOpportunityService, OpportunityService>();
builder.Services.AddScoped<ICareerAssistantService, CareerAssistantService>();
builder.Services.AddScoped<IEmailAnalysisService, EmailAnalysisService>();
builder.Services.AddScoped<IRecruiterIntelligenceService, RecruiterIntelligenceService>();
builder.Services.AddScoped<IGoogleOAuthService, GoogleOAuthService>();
builder.Services.AddScoped<IGmailService, GmailService>();
builder.Services.AddScoped<IEmailAnalyzer, RuleBasedEmailAnalyzer>();
builder.Services.AddHttpClient<IGeminiCvService, GeminiCvService>();
builder.Services.AddScoped<ICvParsingService, CvParsingService>();
builder.Services.AddScoped<ICandidateDomainEngine, CandidateDomainEngine>();
builder.Services.AddScoped<IJobMatchEngineService, JobMatchEngineService>();
builder.Services.AddScoped<IJobProvider, RemotiveJobProvider>();
builder.Services.AddScoped<IJobProvider, AtsPublicJobProvider>();
builder.Services.AddScoped<IJobProvider, JobicyJobProvider>();
builder.Services.AddScoped<IJobProvider, RemoteOKJobProvider>();
builder.Services.AddScoped<IJobProvider, AggregatorJobProvider>();
builder.Services.AddScoped<IJobSearchService, JobSearchService>();

var app = builder.Build();

// 6. Database Auto-Migration & Seed Data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        await DataInitializer.InitializeAsync(context);
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning("Database initialization note: {Message}", ex.Message);
    }
}

// 7. Middlewares
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// --- Connection String Parser Helper ---
static string ParsePostgreSqlConnectionString(string? raw, string defaultHost, string defaultPort, string defaultDb, string defaultUser, string defaultPass)
{
    if (string.IsNullOrWhiteSpace(raw))
    {
        return $"Host={defaultHost};Port={defaultPort};Database={defaultDb};Username={defaultUser};Password={defaultPass};";
    }

    raw = raw.Trim();
    if (raw.StartsWith("jdbc:postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        raw = raw["jdbc:".Length..];
    }

    if (raw.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) || raw.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            var uri = new Uri(raw);
            var userInfo = uri.UserInfo.Split(':');
            var user = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : defaultUser;
            var pass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : defaultPass;
            var port = uri.Port > 0 ? uri.Port : 5432;
            var db = uri.AbsolutePath.Trim('/');
            if (string.IsNullOrWhiteSpace(db)) db = defaultDb;

            return $"Host={uri.Host};Port={port};Database={db};Username={user};Password={pass};SSL Mode=Prefer;Trust Server Certificate=true;";
        }
        catch
        {
            // Fallback to raw if parsing fails
        }
    }

    return raw;
}
