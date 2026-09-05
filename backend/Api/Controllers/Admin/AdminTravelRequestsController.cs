using AeroTravel.Api.Common;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Features.Staff.Queries;
using AeroTravel.Application.Features.TravelRequests.Commands;
using AeroTravel.Application.Features.TravelRequests.Queries;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers.Admin;

public record UpdateStatusRequest(TravelRequestStatus Status);
public record AssignRequest(Guid? AdminUserId);
public record CreateNoteRequest(string Text);
public record UpdateDealValueRequest(decimal Value, Currency Currency);
public record UpdateFollowUpRequest(DateTime? Date);

[Route("api/v1/admin/travel-requests")]
[Authorize(Roles = nameof(AdminRole.Editor) + "," + nameof(AdminRole.SuperAdmin))]
public class AdminTravelRequestsController(ISender mediator, ICurrentUserService currentUser) : AdminApiControllerBase(mediator, currentUser)
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] TravelRequestStatus? status, [FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null, [FromQuery] string? search = null,
        [FromQuery] DateTime? dueBy = null,
        CancellationToken ct = default)
        => (await Mediator.Send(new ListAdminTravelRequestsQuery(status, fromUtc, toUtc, page, pageSize, sortBy, sortDir, search, dueBy), ct)).ToActionResult().Result!;

    /// Lightweight active-staff list for the "assign to" dropdown — both roles can read this (an
    /// Editor needs it to assign a request to themselves), unlike the full staff CRUD which is
    /// SuperAdmin-only (AdminUsersController).
    [HttpGet("assignable-admins")]
    public async Task<IActionResult> AssignableAdmins(CancellationToken ct)
        => (await Mediator.Send(new GetAssignableAdminsQuery(), ct)).ToActionResult().Result!;

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] TravelRequestStatus? status, [FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc,
        [FromQuery] string? search, CancellationToken ct = default)
    {
        var role = CurrentAdminRole ?? AdminRole.Editor; // fail closed: an unresolvable role is scoped as the more restrictive one
        var result = await Mediator.Send(new ExportAdminTravelRequestsQuery(status, fromUtc, toUtc, search, role, CurrentAdminUserId), ct);
        if (result.IsFailure) return result.ToActionResult().Result!;

        var fileName = $"travel-requests-{DateTime.UtcNow:yyyy-MM-dd}.xlsx";
        return File(result.Value, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => (await Mediator.Send(new GetAdminTravelRequestByIdQuery(id), ct)).ToActionResult().Result!;

    [HttpGet("{id:guid}/notes")]
    public async Task<IActionResult> ListNotes(Guid id, CancellationToken ct)
        => (await Mediator.Send(new ListTravelRequestNotesQuery(id), ct)).ToActionResult().Result!;

    [HttpPost("{id:guid}/notes")]
    public async Task<IActionResult> AddNote(Guid id, [FromBody] CreateNoteRequest request, CancellationToken ct)
    {
        if (CurrentAdminUserId is not { } authorId)
            return Unauthorized();

        var result = await Mediator.Send(new CreateTravelRequestNoteCommand(id, request.Text, authorId), ct);
        return result.IsSuccess ? Ok(result.Value) : result.ToActionResult().Result!;
    }

    [HttpPatch("{id:guid}/deal-value")]
    public async Task<IActionResult> UpdateDealValue(Guid id, [FromBody] UpdateDealValueRequest request, CancellationToken ct)
        => (await Mediator.Send(new UpdateTravelRequestDealValueCommand(id, request.Value, request.Currency, CurrentAdminUserId), ct)).ToActionResult();

    [HttpPatch("{id:guid}/follow-up")]
    public async Task<IActionResult> UpdateFollowUp(Guid id, [FromBody] UpdateFollowUpRequest request, CancellationToken ct)
        => (await Mediator.Send(new UpdateNextFollowUpCommand(id, request.Date, CurrentAdminUserId), ct)).ToActionResult();

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
