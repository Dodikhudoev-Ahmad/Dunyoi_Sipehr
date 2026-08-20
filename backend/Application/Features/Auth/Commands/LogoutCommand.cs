using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Auth.Commands;

public record LogoutCommand(string RawRefreshToken) : IRequest<Result>;

public class LogoutCommandHandler(IApplicationDbContext db, IJwtTokenGenerator tokenGenerator) : IRequestHandler<LogoutCommand, Result>
{
    public async Task<Result> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RawRefreshToken))
            return Result.Success();

        var hash = tokenGenerator.HashRefreshTokenValue(request.RawRefreshToken);
        var existing = await db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash, cancellationToken);
        existing?.Revoke();
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
