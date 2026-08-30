using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareerMail.Api.Controllers;

[Authorize]
[Route("api/applications")]
public class JobApplicationsController : BaseApiController
{
    private readonly IJobApplicationService _jobApplicationService;

    public JobApplicationsController(IJobApplicationService jobApplicationService)
    {
        _jobApplicationService = jobApplicationService;
    }

    [HttpGet]
    public async Task<ActionResult<List<JobApplication>>> GetAllApplications()
    {
        var list = await _jobApplicationService.GetAllApplicationsAsync(CurrentUserId);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<JobApplication>> GetApplicationById(long id)
    {
        var app = await _jobApplicationService.GetApplicationByIdAsync(CurrentUserId, id);
        return Ok(app);
    }

    [HttpPost]
    public async Task<ActionResult<JobApplication>> CreateApplication([FromBody] JobApplicationRequest request)
    {
        var app = await _jobApplicationService.CreateApplicationAsync(CurrentUserId, request);
        return Ok(app);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<JobApplication>> UpdateApplication(long id, [FromBody] JobApplicationRequest request)
    {
        var app = await _jobApplicationService.UpdateApplicationAsync(CurrentUserId, id, request);
        return Ok(app);
    }

    [HttpPatch("{id}")]
    public async Task<ActionResult<JobApplication>> PatchApplication(long id, [FromBody] JobApplicationRequest request)
    {
        var app = await _jobApplicationService.UpdateApplicationAsync(CurrentUserId, id, request);
        return Ok(app);
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<JobApplication>> UpdateStatus(long id, [FromBody] StatusUpdateRequest request)
    {
        var app = await _jobApplicationService.UpdateStatusAsync(CurrentUserId, id, request.Status);
        return Ok(app);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteApplication(long id)
    {
        await _jobApplicationService.DeleteApplicationAsync(CurrentUserId, id);
        return Ok(new { message = "Application deleted successfully" });
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<JobApplication>>> SearchApplications([FromQuery] string? q)
    {
        var results = await _jobApplicationService.SearchApplicationsAsync(CurrentUserId, q);
        return Ok(results);
    }
}
