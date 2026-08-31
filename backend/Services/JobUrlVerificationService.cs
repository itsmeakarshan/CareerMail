using System.Collections.Concurrent;
using System.Net;
using Microsoft.Extensions.Caching.Memory;

namespace CareerMail.Api.Services;

public enum JobUrlStatus
{
    Active,
    Unavailable,
    FallbackActive
}

public class JobUrlVerificationResult
{
    public JobUrlStatus Status { get; set; } = JobUrlStatus.Active;
    public string ResolvedUrl { get; set; } = string.Empty;
    public string ResolvedSource { get; set; } = string.Empty; // "ATS", "CompanyCareers", "SourceBoard"
    public bool IsVerified { get; set; }
}

public interface IJobUrlVerificationService
{
    Task<JobUrlVerificationResult> VerifyAndResolveJobUrlAsync(
        string? atsUrl,
        string? companyCareersUrl,
        string? sourceBoardUrl);

    Task VerifyJobListingsAsync(List<JobListingDto> jobs);
}

public class JobUrlVerificationService : IJobUrlVerificationService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<JobUrlVerificationService> _logger;

    public JobUrlVerificationService(
        HttpClient httpClient,
        IMemoryCache cache,
        ILogger<JobUrlVerificationService> logger)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;
        _httpClient.Timeout = TimeSpan.FromSeconds(2.5);
    }

    public async Task VerifyJobListingsAsync(List<JobListingDto> jobs)
    {
        if (jobs == null || jobs.Count == 0) return;

        // Process top search results in parallel with controlled concurrency
        var parallelOptions = new ParallelOptions
        {
            MaxDegreeOfParallelism = 12
        };

        await Parallel.ForEachAsync(jobs, parallelOptions, async (job, token) =>
        {
            try
            {
                // Strict priority order:
                // 1. Official ATS / Direct Application URL
                // 2. Official Company Careers Posting
                // 3. Original Verified Source Listing (Remotive, Jobicy, RemoteOK)
                string? atsUrl = ExtractAtsUrl(job.ApplyUrl) ?? ExtractAtsUrl(job.Url);
                string? companyUrl = !string.IsNullOrWhiteSpace(job.ApplyUrl) && !job.ApplyUrl.Equals(atsUrl, StringComparison.OrdinalIgnoreCase)
                    ? job.ApplyUrl
                    : null;
                string? sourceBoardUrl = job.SourceUrl ?? job.Url;

                var result = await VerifyAndResolveJobUrlAsync(atsUrl, companyUrl, sourceBoardUrl);

                if (result.Status == JobUrlStatus.Unavailable)
                {
                    job.IsAvailable = false;
                    job.ApplicationUrlStatus = "UNAVAILABLE";
                    job.ApplyUrl = string.Empty;
                }
                else
                {
                    job.IsAvailable = true;
                    job.ApplicationUrlStatus = "ACTIVE";
                    job.ApplyUrl = result.ResolvedUrl;
                    job.IsUrlVerified = true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug("Verification check note for job {JobId}: {Msg}", job.Id, ex.Message);
                // If network verification times out, preserve canonical source URL without guessing
                job.IsAvailable = !string.IsNullOrWhiteSpace(job.ApplyUrl) || !string.IsNullOrWhiteSpace(job.SourceUrl);
                job.ApplicationUrlStatus = job.IsAvailable ? "ACTIVE" : "UNAVAILABLE";
            }
        });
    }

    public async Task<JobUrlVerificationResult> VerifyAndResolveJobUrlAsync(
        string? atsUrl,
        string? companyCareersUrl,
        string? sourceBoardUrl)
    {
        // 1. Priority 1: Verified Official ATS / Application URL
        if (!string.IsNullOrWhiteSpace(atsUrl))
        {
            bool isAtsActive = await CheckUrlReachableAsync(atsUrl);
            if (isAtsActive)
            {
                return new JobUrlVerificationResult
                {
                    Status = JobUrlStatus.Active,
                    ResolvedUrl = atsUrl,
                    ResolvedSource = "ATS",
                    IsVerified = true
                };
            }
        }

        // 2. Priority 2: Verified Official Company Careers Posting
        if (!string.IsNullOrWhiteSpace(companyCareersUrl))
        {
            bool isCompanyActive = await CheckUrlReachableAsync(companyCareersUrl);
            if (isCompanyActive)
            {
                return new JobUrlVerificationResult
                {
                    Status = JobUrlStatus.Active,
                    ResolvedUrl = companyCareersUrl,
                    ResolvedSource = "CompanyCareers",
                    IsVerified = true
                };
            }
        }

        // 3. Priority 3: Verified Source Listing as a fallback
        if (!string.IsNullOrWhiteSpace(sourceBoardUrl))
        {
            bool isSourceActive = await CheckUrlReachableAsync(sourceBoardUrl);
            if (isSourceActive)
            {
                return new JobUrlVerificationResult
                {
                    Status = JobUrlStatus.FallbackActive,
                    ResolvedUrl = sourceBoardUrl,
                    ResolvedSource = "SourceBoard",
                    IsVerified = true
                };
            }
        }

        // If no active official posting or canonical source could be verified
        return new JobUrlVerificationResult
        {
            Status = JobUrlStatus.Unavailable,
            ResolvedUrl = string.Empty,
            ResolvedSource = "None",
            IsVerified = false
        };
    }

    private async Task<bool> CheckUrlReachableAsync(string url)
    {
        if (string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return false;
        }

        // Only HTTP/HTTPS
        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
        {
            return false;
        }

        // Check memory cache first (1 hour TTL)
        string cacheKey = $"job_url_status_{url.Trim()}";
        if (_cache.TryGetValue(cacheKey, out bool isReachable))
        {
            return isReachable;
        }

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
            request.Headers.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");

            using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

            // Valid status codes
            int code = (int)response.StatusCode;
            bool active = code >= 200 && code < 400;

            // Reject explicit 404, 410, 403, 500
            if (response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.Gone)
            {
                active = false;
            }

            _cache.Set(cacheKey, active, TimeSpan.FromHours(1));
            return active;
        }
        catch
        {
            // Network timeout / connection error
            bool fallbackTrust = IsKnownReputableAtsOrJobDomain(uri.Host);
            _cache.Set(cacheKey, fallbackTrust, TimeSpan.FromMinutes(10));
            return fallbackTrust;
        }
    }

    private static string? ExtractAtsUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return null;
        var lower = url.ToLowerInvariant();
        if (lower.Contains("greenhouse.io") ||
            lower.Contains("lever.co") ||
            lower.Contains("ashbyhq.com") ||
            lower.Contains("workable.com") ||
            lower.Contains("smartrecruiters.com") ||
            lower.Contains("workday.com") ||
            lower.Contains("bamboohr.com"))
        {
            return url;
        }
        return null;
    }

    private static bool IsKnownReputableAtsOrJobDomain(string host)
    {
        var h = host.ToLowerInvariant();
        return h.Contains("greenhouse.io") ||
               h.Contains("lever.co") ||
               h.Contains("remotive.com") ||
               h.Contains("remoteok.com") ||
               h.Contains("jobicy.com") ||
               h.Contains("ashbyhq.com") ||
               h.Contains("workable.com");
    }
}
