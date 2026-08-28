using AeroTravel.Api.Common;
using AeroTravel.Domain.Enums;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Features.Cities.Commands;
using AeroTravel.Application.Features.Cities.Dtos;
using AeroTravel.Application.Features.Cities.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers.Admin;

[Route("api/v1/admin/cities")]
[Authorize]
public class AdminCitiesController(ISender mediator, ICurrentUserService currentUser) : AdminApiControllerBase(mediator, currentUser)
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] Guid? countryId = null,
        [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null, [FromQuery] string? search = null,
        CancellationToken ct = default)
        => (await Mediator.Send(new ListAdminCitiesQuery(page, pageSize, countryId, sortBy, sortDir, search), ct)).ToActionResult().Result!;

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => (await Mediator.Send(new GetAdminCityByIdQuery(id), ct)).ToActionResult().Result!;

    [HttpPost]
    [Authorize(Roles = nameof(AdminRole.SuperAdmin))]
    public async Task<IActionResult> Create([FromBody] UpsertCityInput input, CancellationToken ct)
    {
        var result = await Mediator.Send(new CreateCityCommand(input, CurrentAdminUserId), ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value }, new { id = result.Value })
            : result.ToActionResult().Result!;
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(AdminRole.SuperAdmin))]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertCityInput input, CancellationToken ct)
        => (await Mediator.Send(new UpdateCityCommand(id, input, CurrentAdminUserId), ct)).ToActionResult();

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(AdminRole.SuperAdmin))]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => (await Mediator.Send(new DeleteCityCommand(id, CurrentAdminUserId), ct)).ToActionResult();
}
