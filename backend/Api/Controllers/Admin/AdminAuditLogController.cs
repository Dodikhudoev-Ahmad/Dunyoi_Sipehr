using AeroTravel.Api.Common;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Features.Audit.Queries;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers.Admin;

/// SuperAdmin only — this is the technical mutation trail across every CMS entity plus staff
/// accounts, not something a CRM operator (Editor) needs. Editor's equivalent for a single
/// request's history is the new Notes feature (TravelRequestNote), which stays on the shared
/// AdminTravelRequestsController instead.
[Route("api/v1/admin/audit-log")]
[Authorize(Roles = nameof(AdminRole.SuperAdmin))]
public class AdminAuditLogController(ISender mediator, ICurrentUserService currentUser) : AdminApiControllerBase(mediator, currentUser)
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? entityType, [FromQuery] Guid? entityId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null, CancellationToken ct = default)
        => (await Mediator.Send(new ListAuditLogQuery(entityType, entityId, page, pageSize, sortBy, sortDir), ct)).ToActionResult().Result!;
}
