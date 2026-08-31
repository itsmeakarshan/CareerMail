using System.Security.Claims;
using System.Text.Json;
using CareerMail.Api.Data;
using CareerMail.Api.Models.Dtos;
using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Controllers;

[ApiController]
[Route("api/job-search")]
[Route("api/jobs")]
[Authorize]
public class JobSearchController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICvParsingService _cvParsingService;
    private readonly IJobSearchService _jobSearchService;
    private readonly IJobApplicationService _jobApplicationService;

    public JobSearchController(
        AppDbContext context,
        ICvParsingService cvParsingService,
        IJobSearchService jobSearchService,
        IJobApplicationService jobApplicationService)
    {
        _context = context;
        _cvParsingService = cvParsingService;
        _jobSearchService = jobSearchService;
        _jobApplicationService = jobApplicationService;
    }

    private long GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
        return long.TryParse(claim, out var id) ? id : 1;
    }

    [HttpPost("cv")]
    public async Task<IActionResult> UploadCv(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Please select a valid PDF, DOCX, or TXT file." });
        }

        var userId = GetUserId();
        using var stream = file.OpenReadStream();
        var cvProfile = await _cvParsingService.ParseAndSaveCvAsync(userId, stream, file.FileName);

        var existing = await _context.CvProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (existing != null)
        {
            existing.FileName = cvProfile.FileName;
            existing.RawText = cvProfile.RawText;
            existing.ExtractedSkillsJson = cvProfile.ExtractedSkillsJson;
            existing.TargetRolesJson = cvProfile.TargetRolesJson;
            existing.ExperienceYears = cvProfile.ExperienceYears;
            existing.EducationLevel = cvProfile.EducationLevel;
            existing.PreferredLocation = cvProfile.PreferredLocation;
            existing.IsRemotePreferred = cvProfile.IsRemotePreferred;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.CvProfiles.Add(cvProfile);
        }

        await _context.SaveChangesAsync();

        var activeProfile = existing ?? cvProfile;
        var dto = MapToDto(activeProfile);
        return Ok(dto);
    }

    [HttpGet("cv")]
    public async Task<IActionResult> GetCv()
    {
        var userId = GetUserId();
        var profile = await _context.CvProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null)
        {
            return Ok(null);
        }

        return Ok(MapToDto(profile));
    }

    // GET /api/jobs or GET /api/job-search/jobs
    [HttpGet("")]
    [HttpGet("jobs")]
    public async Task<IActionResult> SearchJobs(
        [FromQuery] string? q,
        [FromQuery] string? location,
        [FromQuery] string? workType,
        [FromQuery] int minScore = 0,
        [FromQuery] string sortBy = "score")
    {
        var userId = GetUserId();
        var profile = await GetActiveCvProfileAsync(userId);
        var jobs = await _jobSearchService.SearchJobsAsync(profile, q, location, workType, minScore, sortBy);
        return Ok(jobs);
    }

    // POST /api/jobs/search or POST /api/job-search/search
    [HttpPost("search")]
    public async Task<IActionResult> TriggerSearch([FromBody] JobSearchPayload payload)
    {
        var userId = GetUserId();
        var profile = await GetActiveCvProfileAsync(userId);
        var jobs = await _jobSearchService.SearchJobsAsync(
            profile,
            payload.Query,
            payload.Location,
            payload.WorkType,
            payload.MinScore,
            payload.SortBy ?? "score");
        return Ok(jobs);
    }

    // POST /api/jobs/match or POST /api/job-search/match
    [HttpPost("match")]
    public async Task<IActionResult> MatchJobsAgainstProfile([FromBody] JobSearchPayload payload)
    {
        var userId = GetUserId();
        var profile = await GetActiveCvProfileAsync(userId);
        var jobs = await _jobSearchService.SearchJobsAsync(
            profile,
            payload.Query,
            payload.Location,
            payload.WorkType,
            payload.MinScore,
            "score");
        return Ok(new
        {
            CandidateProfile = MapToDto(profile),
            TotalJobsMatched = jobs.Count,
            Jobs = jobs
        });
    }

    // GET /api/jobs/{id} or GET /api/job-search/jobs/{id}
    [HttpGet("{id}")]
    [HttpGet("jobs/{id}")]
    public async Task<IActionResult> GetJobById(string id)
    {
        var userId = GetUserId();
        var profile = await GetActiveCvProfileAsync(userId);
        var job = await _jobSearchService.GetJobByIdAsync(profile, id);
        if (job == null) return NotFound(new { message = $"Job with id '{id}' not found." });
        return Ok(job);
    }

    // POST /api/jobs/{id}/save or POST /api/job-search/save
    [HttpPost("{id}/save")]
    [HttpPost("save")]
    public async Task<IActionResult> SaveJob(string? id, [FromBody] SaveJobRequest req)
    {
        var userId = GetUserId();
        string jobId = !string.IsNullOrWhiteSpace(id) ? id : req.JobId;

        var existing = await _context.SavedJobListings.FirstOrDefaultAsync(s => s.UserId == userId && s.JobId == jobId);
        if (existing != null)
        {
            return Ok(existing);
        }

        var saved = new SavedJobListing
        {
            UserId = userId,
            JobId = jobId,
            Title = req.Title,
            Company = req.Company,
            Location = req.Location,
            EmploymentType = req.EmploymentType,
            Salary = req.Salary,
            Url = req.Url,
            MatchScore = req.MatchScore,
            SavedAt = DateTime.UtcNow
        };

        _context.SavedJobListings.Add(saved);
        await _context.SaveChangesAsync();
        return Ok(saved);
    }

    // POST /api/jobs/{id}/hide or POST /api/job-search/hide
    [HttpPost("{id}/hide")]
    [HttpPost("hide")]
    public IActionResult HideJob(string? id)
    {
        return Ok(new { success = true, hiddenJobId = id });
    }

    [HttpPost("convert-to-application")]
    public async Task<IActionResult> ConvertToApplication([FromBody] ConvertJobToApplicationRequest req)
    {
        var userId = GetUserId();
        var appRequest = new JobApplicationRequest
        {
            Company = req.Company,
            Title = req.Title,
            Location = string.IsNullOrWhiteSpace(req.Location) ? "Remote" : req.Location,
            EmploymentType = string.IsNullOrWhiteSpace(req.EmploymentType) ? "Full-time" : req.EmploymentType,
            Salary = string.IsNullOrWhiteSpace(req.Salary) ? "$90k - $140k" : req.Salary,
            DateApplied = DateOnly.FromDateTime(DateTime.UtcNow),
            Status = "APPLIED",
            Priority = "HIGH",
            Source = "Job Search Discovery",
            Notes = $"Discovered via Job Search. Description: {req.Description}\nURL: {req.Url}",
            ActivitySubtitle = "Applied from Job Search",
            RecruiterName = $"{req.Company} Hiring Team",
            RecruiterEmail = $"careers@{req.Company.ToLowerInvariant().Replace(" ", "")}.com",
            RecruiterTitle = "Recruitment Manager",
            RecruiterType = "HUMAN_RECRUITER",
            ContactConfidence = 85,
            ContactExtractionSource = "Job Listing Match"
        };

        var created = await _jobApplicationService.CreateApplicationAsync(userId, appRequest);
        return Ok(created);
    }

    [HttpGet("saved")]
    public async Task<IActionResult> GetSavedJobs()
    {
        var userId = GetUserId();
        var saved = await _context.SavedJobListings.Where(s => s.UserId == userId).OrderByDescending(s => s.SavedAt).ToListAsync();
        return Ok(saved);
    }

    private async Task<CvProfile> GetActiveCvProfileAsync(long userId)
    {
        var profile = await _context.CvProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null)
        {
            profile = new CvProfile
            {
                UserId = userId,
                FileName = "Default Profile Baseline",
                ExtractedSkillsJson = JsonSerializer.Serialize(new List<string> { "Software Engineer", "JavaScript", "React", "TypeScript", "C#", ".NET", "SQL", "Git", "REST API" }),
                TargetRolesJson = JsonSerializer.Serialize(new List<string> { "Software Engineer", "Full Stack Developer" }),
                ExperienceYears = 3,
                EducationLevel = "Bachelor's Degree",
                PreferredLocation = "Remote",
                IsRemotePreferred = true
            };
        }
        return profile;
    }

    private static CvProfileDto MapToDto(CvProfile p)
    {
        return new CvProfileDto
        {
            Id = p.Id,
            FileName = p.FileName,
            ExtractedSkills = JsonSerializer.Deserialize<List<string>>(p.ExtractedSkillsJson ?? "[]") ?? new List<string>(),
            TargetRoles = JsonSerializer.Deserialize<List<string>>(p.TargetRolesJson ?? "[]") ?? new List<string>(),
            ExperienceYears = p.ExperienceYears,
            EducationLevel = p.EducationLevel,
            PreferredLocation = p.PreferredLocation,
            IsRemotePreferred = p.IsRemotePreferred,
            UploadedAt = p.UpdatedAt
        };
    }
}

public class JobSearchPayload
{
    public string? Query { get; set; }
    public string? Location { get; set; }
    public string? WorkType { get; set; }
    public int MinScore { get; set; }
    public string? SortBy { get; set; }
}
