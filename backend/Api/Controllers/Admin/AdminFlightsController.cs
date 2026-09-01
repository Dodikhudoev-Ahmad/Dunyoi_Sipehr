using AeroTravel.Api.Common;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Features.Flights.Commands;
using AeroTravel.Application.Features.Flights.Dtos;
using AeroTravel.Application.Features.Flights.Queries;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers.Admin;

// RBAC EXCEPTION: unlike every other admin controller (where delete is SuperAdmin-only), the
// Flights module gives Editor and SuperAdmin identical full CRUD access to flights and their
// passenger manifests — this is a deliberate product decision for this module only, not an
// oversight. Do not copy the plain [Authorize] used here as a precedent for other controllers.
[Route("api/v1/admin/flights")]
[Authorize]
public class AdminFlightsController(ISender mediator, ICurrentUserService currentUser) : AdminApiControllerBase(mediator, currentUser)
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] FlightStatus? status, [FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc, [FromQuery] string? search,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null, CancellationToken ct = default)
        => (await Mediator.Send(new ListAdminFlightsQuery(status, fromUtc, toUtc, search, page, pageSize, sortBy, sortDir), ct)).ToActionResult().Result!;

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => (await Mediator.Send(new GetAdminFlightByIdQuery(id), ct)).ToActionResult().Result!;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertFlightInput input, CancellationToken ct)
    {
        var result = await Mediator.Send(new CreateFlightCommand(input, CurrentAdminUserId), ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value }, new { id = result.Value })
            : result.ToActionResult().Result!;
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertFlightInput input, CancellationToken ct)
        => (await Mediator.Send(new UpdateFlightCommand(id, input, CurrentAdminUserId), ct)).ToActionResult();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => (await Mediator.Send(new DeleteFlightCommand(id, CurrentAdminUserId), ct)).ToActionResult();

    [HttpGet("{id:guid}/export")]
    public async Task<IActionResult> Export(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new ExportFlightPassengersQuery(id), ct);
        if (result.IsFailure) return result.ToActionResult().Result!;

        var fileName = $"flight-{id}-{DateTime.UtcNow:yyyy-MM-dd}.xlsx";
        return File(result.Value, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    [HttpGet("{id:guid}/passengers")]
    public async Task<IActionResult> ListPassengers(Guid id, CancellationToken ct)
        => (await Mediator.Send(new ListFlightPassengersQuery(id), ct)).ToActionResult().Result!;

    [HttpPost("{id:guid}/passengers/manual")]
    public async Task<IActionResult> AddManualPassenger(Guid id, [FromBody] AddManualPassengerInput input, CancellationToken ct)
    {
        var result = await Mediator.Send(new AddManualFlightPassengerCommand(id, input.FullName, input.Phone, CurrentAdminUserId), ct);
        return result.IsSuccess ? Ok(new { id = result.Value }) : result.ToActionResult().Result!;
    }

    [HttpPost("{id:guid}/passengers/from-request")]
    public async Task<IActionResult> AddPassengerFromRequest(Guid id, [FromBody] AddPassengerFromRequestInput input, CancellationToken ct)
    {
        var result = await Mediator.Send(new AddFlightPassengerFromRequestCommand(id, input.TravelRequestId, input.FullName, input.Phone, CurrentAdminUserId), ct);
        return result.IsSuccess ? Ok(new { id = result.Value }) : result.ToActionResult().Result!;
    }

    [HttpDelete("{id:guid}/passengers/{passengerId:guid}")]
    public async Task<IActionResult> DeletePassenger(Guid id, Guid passengerId, CancellationToken ct)
        => (await Mediator.Send(new DeleteFlightPassengerCommand(id, passengerId, CurrentAdminUserId), ct)).ToActionResult();

    /// SuperAdmin-only override of this controller's class-level RBAC exception (see the comment
    /// above) — moving a passenger between flights is a more consequential action than adding
    /// one, so unlike the rest of this controller it follows the app's normal SuperAdmin-only rule.
    [HttpPost("transfer-passenger")]
    [Authorize(Roles = nameof(AdminRole.SuperAdmin))]
    public async Task<IActionResult> TransferPassenger([FromBody] TransferPassengerRequest request, CancellationToken ct)
        => (await Mediator.Send(new TransferFlightPassengerCommand(request.PassengerId, request.TargetFlightId, CurrentAdminUserId), ct)).ToActionResult();
}

public record TransferPassengerRequest(Guid PassengerId, Guid TargetFlightId);
