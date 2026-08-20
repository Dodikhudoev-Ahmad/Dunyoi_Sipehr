namespace AeroTravel.Application.Features.Audit.Dtos;

public record AuditLogDto(Guid Id, string EntityType, Guid EntityId, string Action, Guid? AdminUserId, DateTime TimestampUtc, string? DetailsJson);
