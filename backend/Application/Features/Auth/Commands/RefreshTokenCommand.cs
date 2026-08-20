using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Auth.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Auth.Commands;

public record RefreshTokenCommand(string RawRefreshToken) : IRequest<Result<RefreshResultDto>>;

public class RefreshTokenCommandHandler(
    IApplicationDbContext db,
    IJwtTokenGenerator tokenGenerator,
    ICurrentUserService currentUser) : IRequestHandler<RefreshTokenCommand, Result<RefreshResultDto>>
{
    public async Task<Result<RefreshResultDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RawRefreshToken))
            return Result.Failure<RefreshResultDto>(Error.Unauthorized("INVALID_REFRESH_TOKEN", "Missing refresh token."));

        var hash = tokenGenerator.HashRefreshTokenValue(request.RawRefreshToken);
        var existing = await db.RefreshTokens
            .FirstOrDefaultAsync(r => r.TokenHash == hash, cancellationToken);

        if (existing is null || !existing.IsActive)
            return Result.Failure<RefreshResultDto>(Error.Unauthorized("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired."));

        var admin = await db.AdminUsers.FirstOrDefaultAsync(a => a.Id == existing.AdminUserId, cancellationToken);
        if (admin is null || !admin.IsActive)
            return Result.Failure<RefreshResultDto>(Error.Unauthorized("INVALID_REFRESH_TOKEN", "Account is inactive."));

        var (accessToken, expiresAtUtc) = tokenGenerator.GenerateAccessToken(admin);
        var newRaw = tokenGenerator.GenerateRefreshTokenValue();
        var newHash = tokenGenerator.HashRefreshTokenValue(newRaw);
        var newToken = admin.IssueRefreshToken(newHash, DateTime.UtcNow.AddDays(30), currentUser.IpAddress);
        db.RefreshTokens.Add(newToken);
        existing.Revoke(newToken.Id);

        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(new RefreshResultDto(accessToken, expiresAtUtc, newRaw));
    }
}
