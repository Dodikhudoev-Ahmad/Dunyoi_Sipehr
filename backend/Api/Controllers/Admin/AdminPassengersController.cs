using AeroTravel.Api.Common;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Features.Flights.Queries;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers.Admin;

// RBAC EXCEPTION — see AdminFlightsController: Editor and SuperAdmin both get full read/export
// access to the passenger registry, unlike the SuperAdmin-only pattern elsewhere in this app.
[Route("api/v1/admin/passengers")]
[Authorize(Roles = nameof(AdminRole.Editor) + "," + nameof(AdminRole.SuperAdmin))]
public class AdminPassengersController(ISender mediator, ICurrentUserService currentUser) : AdminApiControllerBase(mediator, currentUser)
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] Guid? flightId, [FromQuery] string? search, [FromQuery] DateTime? departureFromUtc, [FromQuery] DateTime? departureToUtc,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null, CancellationToken ct = default)
        => (await Mediator.Send(new ListPassengerRegistryQuery(flightId, search, departureFromUtc, departureToUtc, page, pageSize, sortBy, sortDir), ct)).ToActionResult().Result!;

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] Guid? flightId, [FromQuery] string? search, [FromQuery] DateTime? departureFromUtc, [FromQuery] DateTime? departureToUtc,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new ExportPassengerRegistryQuery(flightId, search, departureFromUtc, departureToUtc), ct);
        if (result.IsFailure) return result.ToActionResult().Result!;

        var fileName = $"passengers-{DateTime.UtcNow:yyyy-MM-dd}.xlsx";
        return File(result.Value, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
