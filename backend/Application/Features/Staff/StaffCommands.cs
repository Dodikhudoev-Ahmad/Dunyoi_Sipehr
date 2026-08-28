using System.Security.Cryptography;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Staff.Commands;

public record CreateAdminUserCommand(string DisplayName, string Email, string Password, AdminRole Role, Guid? ActorAdminUserId) : IRequest<Result<Guid>>;

public class CreateAdminUserCommandValidator : AbstractValidator<CreateAdminUserCommand>
{
    public CreateAdminUserCommandValidator()
    {
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(10);
        RuleFor(x => x.Role).IsInEnum();
    }
}

public class CreateAdminUserCommandHandler(IApplicationDbContext db, IPasswordHasher passwordHasher)
    : IRequestHandler<CreateAdminUserCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateAdminUserCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var exists = await db.AdminUsers.AnyAsync(a => a.Email == email, cancellationToken);
        if (exists)
            return Result.Failure<Guid>(Error.Conflict("CONFLICT_DUPLICATE", "A staff account with this email already exists."));

        var admin = new AdminUser(email, passwordHasher.Hash(request.Password), request.DisplayName, request.Role);
        db.AdminUsers.Add(admin);

        db.AuditLogs.Add(new AuditLog(nameof(AdminUser), admin.Id, "Create", request.ActorAdminUserId,
            $"{{\"email\":\"{email}\",\"role\":\"{request.Role}\"}}"));
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(admin.Id);
    }
}

public record UpdateAdminUserCommand(Guid Id, string? DisplayName, AdminRole? Role, bool? IsActive, Guid? ActorAdminUserId) : IRequest<Result>;

public class UpdateAdminUserCommandValidator : AbstractValidator<UpdateAdminUserCommand>
{
    public UpdateAdminUserCommandValidator()
    {
        RuleFor(x => x.DisplayName).MaximumLength(200).When(x => x.DisplayName is not null);
        RuleFor(x => x.Role).IsInEnum().When(x => x.Role is not null);
    }
}

public class UpdateAdminUserCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateAdminUserCommand, Result>
{
    public async Task<Result> Handle(UpdateAdminUserCommand request, CancellationToken cancellationToken)
    {
        var admin = await db.AdminUsers.FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);
        if (admin is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Staff account not found."));

        // A SuperAdmin can manage every other account without exception, but must not be able to
        // lock themselves out — deactivating or demoting your own only-way-back-in account is an
        // unrecoverable mistake (no other admin route restores access), not a legitimate use case.
        var isActingOnSelf = request.ActorAdminUserId is { } actorId && actorId == admin.Id;
        if (isActingOnSelf && request.IsActive == false)
            return Result.Failure(Error.Validation("VALIDATION_FAILED", "You cannot deactivate your own account."));
        if (isActingOnSelf && request.Role is { } newRole && newRole != admin.Role)
            return Result.Failure(Error.Validation("VALIDATION_FAILED", "You cannot change your own role."));

        if (request.DisplayName is { } displayName) admin.SetDisplayName(displayName);
        if (request.Role is { } role) admin.SetRole(role);
        if (request.IsActive is { } isActive)
        {
            if (isActive) admin.Activate();
            else admin.Deactivate();
        }

        db.AuditLogs.Add(new AuditLog(nameof(AdminUser), admin.Id, "Update", request.ActorAdminUserId,
            $"{{\"displayName\":{(request.DisplayName is null ? "null" : $"\"{request.DisplayName}\"")},\"role\":{(request.Role is null ? "null" : $"\"{request.Role}\"")},\"isActive\":{(request.IsActive is null ? "null" : request.IsActive.Value.ToString().ToLowerInvariant())}}}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record ResetAdminUserPasswordCommand(Guid Id, Guid? ActorAdminUserId) : IRequest<Result<string>>;

public class ResetAdminUserPasswordCommandHandler(IApplicationDbContext db, IPasswordHasher passwordHasher)
    : IRequestHandler<ResetAdminUserPasswordCommand, Result<string>>
{
    // Unambiguous characters only (no 0/O, 1/l/I) — this gets read aloud or retyped by a human
    // once, from a screen, so avoiding lookalikes matters more than raw entropy here; 16 chars
    // from a 55-character set is still comfortably >90 bits.
    private const string Alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";

    public async Task<Result<string>> Handle(ResetAdminUserPasswordCommand request, CancellationToken cancellationToken)
    {
        var admin = await db.AdminUsers.FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);
        if (admin is null)
            return Result.Failure<string>(Error.NotFound("NOT_FOUND", "Staff account not found."));

        var newPassword = GenerateTemporaryPassword();
        admin.SetPasswordHash(passwordHasher.Hash(newPassword));

        db.AuditLogs.Add(new AuditLog(nameof(AdminUser), admin.Id, "ResetPassword", request.ActorAdminUserId));
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(newPassword);
    }

    private static string GenerateTemporaryPassword(int length = 16)
    {
        var bytes = RandomNumberGenerator.GetBytes(length);
        var chars = new char[length];
        for (var i = 0; i < length; i++)
            chars[i] = Alphabet[bytes[i] % Alphabet.Length];
        return new string(chars);
    }
}
