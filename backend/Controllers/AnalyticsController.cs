using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareerMail.Api.Controllers;

[Authorize]
[Route("api/analytics")]
[Route("api/dashboard")]
public class AnalyticsController : BaseApiController
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet]
    [HttpGet("dashboard")]
    [HttpGet("summary")]
    public async Task<ActionResult<AnalyticsResponse>> GetDashboardAnalytics()
    {
        var response = await _analyticsService.GetDashboardAnalyticsAsync(CurrentUserId);
        return Ok(response);
    }
}
