namespace AeroTravel.Application.Features.Audit.Dtos;

// AdminDisplayName is looked up from AdminUsers by AdminUserId at query time (see
// ListAuditLogQueryHandler) rather than denormalized onto AuditLog itself, so it always
// reflects the admin's current name and survives deactivation (DisplayName is never cleared,
// only IsActive flips) -- only a genuinely orphaned AdminUserId (no such row) leaves it null.
public record AuditLogDto(Guid Id, string EntityType, Guid EntityId, string Action, Guid? AdminUserId, string? AdminDisplayName, DateTime TimestampUtc, string? DetailsJson);
