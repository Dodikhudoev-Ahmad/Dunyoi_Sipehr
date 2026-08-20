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

        if (admin is null || !admin.IsActive || !passwordHasher.Verify(request.Password, admin.PasswordHash))
            return Result.Failure<LoginResultDto>(Error.Unauthorized("INVALID_CREDENTIALS", "Email or password is incorrect."));

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
