using AeroTravel.Api.Common;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Features.Staff.Commands;
using AeroTravel.Application.Features.Staff.Queries;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers.Admin;

public record CreateStaffRequest(string DisplayName, string Email, string Password, AdminRole Role);
public record UpdateStaffRequest(string? DisplayName, AdminRole? Role, bool? IsActive);

/// Staff account management — SuperAdmin only, no exceptions. Route is `staff`, not `users`, to
/// keep it unambiguously separate from any future customer-facing "user" concept (there is none
/// today — public visitors never log in, see MASTER_TZ.md — but the naming is deliberate anyway).
[Route("api/v1/admin/staff")]
[Authorize(Roles = nameof(AdminRole.SuperAdmin))]
public class AdminUsersController(ISender mediator, ICurrentUserService currentUser) : AdminApiControllerBase(mediator, currentUser)
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
        => (await Mediator.Send(new ListAdminUsersQuery(page, pageSize), ct)).ToActionResult().Result!;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStaffRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new CreateAdminUserCommand(request.DisplayName, request.Email, request.Password, request.Role, CurrentAdminUserId), ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(List), new { id = result.Value }, new { id = result.Value })
            : result.ToActionResult().Result!;
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStaffRequest request, CancellationToken ct)
        => (await Mediator.Send(new UpdateAdminUserCommand(id, request.DisplayName, request.Role, request.IsActive, CurrentAdminUserId), ct)).ToActionResult();

    /// Returns the new temporary password in the response body exactly once — never stored or
    /// logged in plaintext anywhere, never retrievable again after this response.
    [HttpPost("{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new ResetAdminUserPasswordCommand(id, CurrentAdminUserId), ct);
        return result.IsSuccess ? Ok(new { temporaryPassword = result.Value }) : result.ToActionResult().Result!;
    }
}
