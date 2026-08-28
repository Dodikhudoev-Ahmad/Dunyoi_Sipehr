using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Staff.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Staff.Queries;

public record ListAdminUsersQuery(int Page, int PageSize) : IRequest<Result<PagedResult<AdminStaffListItemDto>>>;

public class ListAdminUsersQueryHandler(IReadDbContext db) : IRequestHandler<ListAdminUsersQuery, Result<PagedResult<AdminStaffListItemDto>>>
{
    public async Task<Result<PagedResult<AdminStaffListItemDto>>> Handle(ListAdminUsersQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        var query = db.AdminUsers.OrderBy(a => a.DisplayName);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(a => new AdminStaffListItemDto(a.Id, a.DisplayName, a.Email, a.Role.ToString(), a.IsActive, a.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedResult<AdminStaffListItemDto>(items, page, pageSize, total));
    }
}

/// Backs the "assign to" / "responsible manager" dropdown wherever a Travel Request needs to
/// reference a staff member — active accounts only (a deactivated admin shouldn't be assignable
/// to new work), both roles included (either can be the owner of a lead).
public record GetAssignableAdminsQuery : IRequest<Result<IReadOnlyList<AssignableAdminDto>>>;

public class GetAssignableAdminsQueryHandler(IReadDbContext db) : IRequestHandler<GetAssignableAdminsQuery, Result<IReadOnlyList<AssignableAdminDto>>>
{
    public async Task<Result<IReadOnlyList<AssignableAdminDto>>> Handle(GetAssignableAdminsQuery request, CancellationToken cancellationToken)
    {
        var admins = await db.AdminUsers
            .Where(a => a.IsActive)
            .OrderBy(a => a.DisplayName)
            .Select(a => new AssignableAdminDto(a.Id, a.DisplayName))
            .ToListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<AssignableAdminDto>>(admins);
    }
}
