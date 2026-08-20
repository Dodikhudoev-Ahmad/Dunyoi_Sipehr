using AeroTravel.Api.Common;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Features.TravelRequests.Commands;
using AeroTravel.Application.Features.TravelRequests.Queries;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers.Admin;

public record UpdateStatusRequest(TravelRequestStatus Status);
public record AssignRequest(Guid? AdminUserId);

[Route("api/v1/admin/travel-requests")]
[Authorize]
public class AdminTravelRequestsController(ISender mediator, ICurrentUserService currentUser) : AdminApiControllerBase(mediator, currentUser)
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] TravelRequestStatus? status, [FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null, [FromQuery] string? search = null,
        CancellationToken ct = default)
        => (await Mediator.Send(new ListAdminTravelRequestsQuery(status, fromUtc, toUtc, page, pageSize, sortBy, sortDir, search), ct)).ToActionResult().Result!;

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => (await Mediator.Send(new GetAdminTravelRequestByIdQuery(id), ct)).ToActionResult().Result!;

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request, CancellationToken ct)
        => (await Mediator.Send(new UpdateTravelRequestStatusCommand(id, request.Status, CurrentAdminUserId), ct)).ToActionResult();

    [HttpPatch("{id:guid}/assign")]
    public async Task<IActionResult> Assign(Guid id, [FromBody] AssignRequest request, CancellationToken ct)
        => (await Mediator.Send(new AssignTravelRequestCommand(id, request.AdminUserId, CurrentAdminUserId), ct)).ToActionResult();

    /// Streams a single passport photo. Never a public/static URL — passport photos are
    /// sensitive PII (see DEC-012) — so this is the only way to view one, gated by the same
    /// [Authorize] as every other admin action, and scoped to fileNames actually attached to
    /// this specific request (see GetTravelRequestPassportPhotoQuery).
    [HttpGet("{id:guid}/passport-photos/{fileName}")]
    public async Task<IActionResult> GetPassportPhoto(Guid id, string fileName, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetTravelRequestPassportPhotoQuery(id, fileName), ct);
        return result.IsSuccess ? File(result.Value.Content, result.Value.ContentType) : result.ToActionResult().Result!;
    }
}
