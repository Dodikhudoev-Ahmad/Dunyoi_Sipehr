namespace AeroTravel.Application.Features.Auth.Dtos;

public record AdminUserDto(Guid Id, string Email, string DisplayName, string Role);
public record LoginResultDto(string AccessToken, DateTime ExpiresAtUtc, string RefreshToken, AdminUserDto Admin);
public record RefreshResultDto(string AccessToken, DateTime ExpiresAtUtc, string RefreshToken);
