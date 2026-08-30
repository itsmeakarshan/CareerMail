using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareerMail.Api.Controllers;

[Authorize]
[Route("api/assistant")]
public class CareerAssistantController : BaseApiController
{
    private readonly ICareerAssistantService _assistantService;

    public CareerAssistantController(ICareerAssistantService assistantService)
    {
        _assistantService = assistantService;
    }

    [HttpPost("ask")]
    [HttpPost("query")]
    public async Task<ActionResult<AssistantQueryResponse>> AskAssistant([FromBody] AssistantQueryRequest request)
    {
        var response = await _assistantService.AskAssistantAsync(CurrentUserId, request);
        return Ok(response);
    }
}
