using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareerMail.Api.Controllers;

[Authorize]
[Route("api/interviews")]
public class InterviewsController : BaseApiController
{
    private readonly IInterviewService _interviewService;

    public InterviewsController(IInterviewService interviewService)
    {
        _interviewService = interviewService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Interview>>> GetAllInterviews()
    {
        var list = await _interviewService.GetAllInterviewsAsync(CurrentUserId);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Interview>> GetInterviewById(long id)
    {
        var interview = await _interviewService.GetInterviewByIdAsync(CurrentUserId, id);
        return Ok(interview);
    }

    [HttpPost]
    public async Task<ActionResult<Interview>> CreateInterview([FromBody] InterviewRequest request)
    {
        var interview = await _interviewService.CreateInterviewAsync(CurrentUserId, request);
        return Ok(interview);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Interview>> UpdateInterview(long id, [FromBody] InterviewRequest request)
    {
        var interview = await _interviewService.UpdateInterviewAsync(CurrentUserId, id, request);
        return Ok(interview);
    }

    [HttpPatch("{id}")]
    public async Task<ActionResult<Interview>> PatchInterview(long id, [FromBody] InterviewRequest request)
    {
        var interview = await _interviewService.UpdateInterviewAsync(CurrentUserId, id, request);
        return Ok(interview);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInterview(long id)
    {
        await _interviewService.DeleteInterviewAsync(CurrentUserId, id);
        return Ok(new { message = "Interview deleted successfully" });
    }
}
