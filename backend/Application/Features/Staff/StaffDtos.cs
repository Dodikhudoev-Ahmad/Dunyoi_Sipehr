namespace AeroTravel.Application.Features.Staff.Dtos;

public record AdminStaffListItemDto(Guid Id, string DisplayName, string Email, string Role, bool IsActive, DateTime CreatedAtUtc);

/// Minimal shape for the "assign to" dropdown — active staff only, no email/role noise.
public record AssignableAdminDto(Guid Id, string DisplayName);
