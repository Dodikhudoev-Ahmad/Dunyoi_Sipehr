using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Auth.Dtos;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Auth.Commands;

public record BootstrapAdminCommand(string Email, string Password, string DisplayName) : IRequest<Result<AdminUserDto>>;

public class BootstrapAdminCommandValidator : AbstractValidator<BootstrapAdminCommand>
{
    public BootstrapAdminCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(10);
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(200);
    }
}

public class BootstrapAdminCommandHandler(IApplicationDbContext db, IPasswordHasher passwordHasher)
    : IRequestHandler<BootstrapAdminCommand, Result<AdminUserDto>>
{
    public async Task<Result<AdminUserDto>> Handle(BootstrapAdminCommand request, CancellationToken cancellationToken)
    {
        var anyExists = await db.AdminUsers.AnyAsync(cancellationToken);
        if (anyExists)
            return Result.Failure<AdminUserDto>(Error.Forbidden("BOOTSTRAP_ALREADY_DONE", "An admin account already exists."));

        var admin = new AdminUser(request.Email, passwordHasher.Hash(request.Password), request.DisplayName, AdminRole.SuperAdmin);
        db.AdminUsers.Add(admin);
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(new AdminUserDto(admin.Id, admin.Email, admin.DisplayName, admin.Role.ToString()));
    }
}
