using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace CareerMail.Api.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected long CurrentUserId
    {
        get
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (long.TryParse(claim, out var id))
            {
                return id;
            }
            throw new UnauthorizedAccessException("User is not authenticated");
        }
    }
}
