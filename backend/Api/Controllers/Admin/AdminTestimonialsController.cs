using AeroTravel.Api.Common;
using AeroTravel.Domain.Enums;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Features.Content.Commands;
using AeroTravel.Application.Features.Content.Dtos;
using AeroTravel.Application.Features.Content.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers.Admin;

[Route("api/v1/admin/testimonials")]
[Authorize]
public class AdminTestimonialsController(ISender mediator, ICurrentUserService currentUser) : AdminApiControllerBase(mediator, currentUser)
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null,
        [FromQuery] bool? isPublished = null, [FromQuery] string? search = null, CancellationToken ct = default)
        => (await Mediator.Send(new ListAdminTestimonialsQuery(page, pageSize, sortBy, sortDir, isPublished, search), ct)).ToActionResult().Result!;

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => (await Mediator.Send(new GetAdminTestimonialByIdQuery(id), ct)).ToActionResult().Result!;

    [HttpPost]
    [Authorize(Roles = nameof(AdminRole.SuperAdmin))]
    public async Task<IActionResult> Create([FromBody] UpsertTestimonialInput input, CancellationToken ct)
    {
        var result = await Mediator.Send(new CreateTestimonialCommand(input, CurrentAdminUserId), ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value }, new { id = result.Value })
            : result.ToActionResult().Result!;
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(AdminRole.SuperAdmin))]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertTestimonialInput input, CancellationToken ct)
        => (await Mediator.Send(new UpdateTestimonialCommand(id, input, CurrentAdminUserId), ct)).ToActionResult();

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(AdminRole.SuperAdmin))]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => (await Mediator.Send(new DeleteTestimonialCommand(id, CurrentAdminUserId), ct)).ToActionResult();
}
