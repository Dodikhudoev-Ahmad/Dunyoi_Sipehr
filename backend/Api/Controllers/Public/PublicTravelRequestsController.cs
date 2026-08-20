using AeroTravel.Api.Common;
using AeroTravel.Application.Features.TravelRequests.Commands;
using AeroTravel.Application.Features.TravelRequests.Dtos;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AeroTravel.Api.Controllers.Public;

[Route("api/v1/public/travel-requests")]
[EnableRateLimiting("travel-requests")]
public class PublicTravelRequestsController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTravelRequestInput input, CancellationToken ct)
    {
        var sourceIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await Mediator.Send(new CreateTravelRequestCommand(input, sourceIp), ct);
        return result.ToActionResult().Result ?? NoContent();
    }

    /// Uploads a single passport/ID photo ahead of form submission; the returned filename is
    /// referenced in the subsequent Create call's PassportPhotoPaths. Same rate-limit policy as
    /// Create — a legitimate submission is at most 1-2 uploads plus the final POST, well within
    /// the per-IP window (see DEC-004), while it still caps how many files an abuser can write.
    [HttpPost("passport-photos")]
    [RequestSizeLimit(UploadPassportPhotoCommandValidator.MaxSizeBytes)]
    public async Task<IActionResult> UploadPassportPhoto(IFormFile file, CancellationToken ct)
    {
        await using var stream = file.OpenReadStream();
        var result = await Mediator.Send(new UploadPassportPhotoCommand(stream, file.Length), ct);
        return result.ToActionResult().Result!;
    }
}
