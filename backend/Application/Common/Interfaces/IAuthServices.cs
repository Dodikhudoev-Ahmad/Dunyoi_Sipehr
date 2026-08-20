using AeroTravel.Domain.Entities;

namespace AeroTravel.Application.Common.Interfaces;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface IJwtTokenGenerator
{
    (string token, DateTime expiresAtUtc) GenerateAccessToken(AdminUser user);
    string GenerateRefreshTokenValue();
    string HashRefreshTokenValue(string rawValue);
}

public interface ICurrentUserService
{
    Guid? AdminUserId { get; }
    string? IpAddress { get; }
}

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}
