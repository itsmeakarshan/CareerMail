using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareerMail.Api.Controllers;

[Authorize]
[Route("api/followups")]
[Route("api/follow-ups")]
public class FollowUpsController : BaseApiController
{
    private readonly IFollowUpService _followUpService;

    public FollowUpsController(IFollowUpService followUpService)
    {
        _followUpService = followUpService;
    }

    [HttpGet]
    public async Task<ActionResult<List<FollowUp>>> GetAllFollowUps()
    {
        var list = await _followUpService.GetAllFollowUpsAsync(CurrentUserId);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FollowUp>> GetFollowUpById(long id)
    {
        var followUp = await _followUpService.GetFollowUpByIdAsync(CurrentUserId, id);
        return Ok(followUp);
    }

    [HttpPost]
    public async Task<ActionResult<FollowUp>> CreateFollowUp([FromBody] FollowUpRequest request)
    {
        var followUp = await _followUpService.CreateFollowUpAsync(CurrentUserId, request);
        return Ok(followUp);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<FollowUp>> UpdateFollowUp(long id, [FromBody] FollowUpRequest request)
    {
        var followUp = await _followUpService.UpdateFollowUpAsync(CurrentUserId, id, request);
        return Ok(followUp);
    }

    [HttpPatch("{id}")]
    public async Task<ActionResult<FollowUp>> PatchFollowUp(long id, [FromBody] FollowUpRequest request)
    {
        var followUp = await _followUpService.UpdateFollowUpAsync(CurrentUserId, id, request);
        return Ok(followUp);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFollowUp(long id)
    {
        await _followUpService.DeleteFollowUpAsync(CurrentUserId, id);
        return Ok(new { message = "Follow-up deleted successfully" });
    }
}
