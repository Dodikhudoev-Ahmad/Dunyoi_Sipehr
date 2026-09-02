using AeroTravel.Api.Common;
using AeroTravel.Application.Features.TravelRequests.Commands;
using AeroTravel.Application.Features.TravelRequests.Dtos;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AeroTravel.Api.Controllers.Public;

[Route("api/v1/public/travel-requests")]
public class PublicTravelRequestsController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpPost]
    [EnableRateLimiting("travel-request-submit")]
    public async Task<IActionResult> Create([FromBody] CreateTravelRequestInput input, CancellationToken ct)
    {
        var sourceIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await Mediator.Send(new CreateTravelRequestCommand(input, sourceIp), ct);
        return result.ToActionResult().Result ?? NoContent();
    }

    /// Uploads a single passport/ID photo ahead of form submission; the returned filename is
    /// referenced in the subsequent Create call's PassportPhotoPaths. Its own, looser rate-limit
    /// policy (5/min) — a real submission is 1 upload plus the final POST, which used to share
    /// a single 1/min policy with Create at the controller level; that made the second request of
    /// any real submission always fail with 429. Separate policies fix that while keeping Create
    /// itself tight (see DEC-004 / the 1/min tightening pending CAPTCHA).
    [HttpPost("passport-photos")]
    [EnableRateLimiting("travel-request-photo-upload")]
    [RequestSizeLimit(UploadPassportPhotoCommandValidator.MaxSizeBytes)]
    public async Task<IActionResult> UploadPassportPhoto(IFormFile file, CancellationToken ct)
    {
        await using var stream = file.OpenReadStream();
        var result = await Mediator.Send(new UploadPassportPhotoCommand(stream, file.Length), ct);
        return result.ToActionResult().Result!;
    }
}
