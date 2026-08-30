using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareerMail.Api.Controllers;

[Route("api/health")]
public class HealthController : BaseApiController
{
    [HttpGet]
    [AllowAnonymous]
    public IActionResult HealthCheck()
    {
        return Ok(new
        {
            status = "UP",
            service = "CareerMail .NET API",
            timestamp = DateTime.UtcNow
        });
    }
}
