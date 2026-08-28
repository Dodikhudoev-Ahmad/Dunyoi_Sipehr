using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Auth.Dtos;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<Result<LoginResultDto>>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginCommandHandler(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher,
    IJwtTokenGenerator tokenGenerator,
    ICurrentUserService currentUser) : IRequestHandler<LoginCommand, Result<LoginResultDto>>
{
    public async Task<Result<LoginResultDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var admin = await db.AdminUsers.FirstOrDefaultAsync(a => a.Email == email, cancellationToken);

        if (admin is null || !passwordHasher.Verify(request.Password, admin.PasswordHash))
            return Result.Failure<LoginResultDto>(Error.Unauthorized("INVALID_CREDENTIALS", "Email or password is incorrect."));

        // Deliberately checked *after* the password verification above (not combined into the
        // same condition) — a deactivated account still needs an explicit, distinct message
        // ("Учётная запись деактивирована") per the ask, but only once the password itself has
        // actually been confirmed correct, so this doesn't leak "this account exists and is
        // deactivated" to someone who doesn't know the password.
        if (!admin.IsActive)
            return Result.Failure<LoginResultDto>(Error.Unauthorized("ACCOUNT_DEACTIVATED", "This account has been deactivated."));

        var (accessToken, expiresAtUtc) = tokenGenerator.GenerateAccessToken(admin);
        var rawRefreshToken = tokenGenerator.GenerateRefreshTokenValue();
        var refreshHash = tokenGenerator.HashRefreshTokenValue(rawRefreshToken);

        var refreshToken = admin.IssueRefreshToken(refreshHash, DateTime.UtcNow.AddDays(30), currentUser.IpAddress);
        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync(cancellationToken);

        var dto = new LoginResultDto(
            accessToken, expiresAtUtc, rawRefreshToken,
            new AdminUserDto(admin.Id, admin.Email, admin.DisplayName, admin.Role.ToString()));

        return Result.Success(dto);
    }
}
