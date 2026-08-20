using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Auth.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Auth.Queries;

public record MeQuery : IRequest<Result<AdminUserDto>>;

public class MeQueryHandler(IReadDbContext db, ICurrentUserService currentUser) : IRequestHandler<MeQuery, Result<AdminUserDto>>
{
    public async Task<Result<AdminUserDto>> Handle(MeQuery request, CancellationToken cancellationToken)
    {
        if (currentUser.AdminUserId is null)
            return Result.Failure<AdminUserDto>(Error.Unauthorized("UNAUTHORIZED", "Not authenticated."));

        var admin = await db.AdminUsers.FirstOrDefaultAsync(a => a.Id == currentUser.AdminUserId, cancellationToken);
        if (admin is null)
            return Result.Failure<AdminUserDto>(Error.Unauthorized("UNAUTHORIZED", "Account not found."));

        return Result.Success(new AdminUserDto(admin.Id, admin.Email, admin.DisplayName, admin.Role.ToString()));
    }
}
