using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareerMail.Api.Controllers;

[Authorize]
[Route("api/opportunities")]
public class OpportunitiesController : BaseApiController
{
    private readonly IOpportunityService _opportunityService;
    private readonly IAuthService _authService;

    public OpportunitiesController(IOpportunityService opportunityService, IAuthService authService)
    {
        _opportunityService = opportunityService;
        _authService = authService;
    }

    [HttpGet]
    public async Task<ActionResult<List<OpportunityDTO>>> GetOpportunities()
    {
        var user = await _authService.GetCurrentUserAsync(CurrentUserId);
        var list = await _opportunityService.GetOpportunitiesAsync(user);
        return Ok(list);
    }

    [HttpPost("{emailId}/convert")]
    public async Task<ActionResult<JobApplication>> ConvertOpportunity(long emailId, [FromBody] JobApplicationRequest? customRequest)
    {
        var user = await _authService.GetCurrentUserAsync(CurrentUserId);
        var app = await _opportunityService.ConvertOpportunityAsync(user, emailId, customRequest);
        return Ok(app);
    }

    [HttpPost("scan")]
    public async Task<ActionResult<Dictionary<string, object>>> ScanGmailForOpportunities()
    {
        var user = await _authService.GetCurrentUserAsync(CurrentUserId);
        var result = await _opportunityService.ScanGmailForOpportunitiesAsync(user);
        return Ok(result);
    }
}
