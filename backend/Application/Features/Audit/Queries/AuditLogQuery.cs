using System.Linq.Expressions;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Audit.Dtos;
using AeroTravel.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Audit.Queries;

public record ListAuditLogQuery(
    string? EntityType, Guid? EntityId, int Page, int PageSize, string? SortBy = null, string? SortDir = null)
    : IRequest<Result<PagedResult<AuditLogDto>>>;

public class ListAuditLogQueryHandler(IReadDbContext db) : IRequestHandler<ListAuditLogQuery, Result<PagedResult<AuditLogDto>>>
{
    public static readonly IReadOnlyDictionary<string, Expression<Func<AuditLog, object?>>> SortWhitelist = new Dictionary<string, Expression<Func<AuditLog, object?>>>
    {
        ["timestamp"] = a => a.TimestampUtc,
        ["entityType"] = a => a.EntityType,
        ["action"] = a => a.Action,
    };

    public async Task<Result<PagedResult<AuditLogDto>>> Handle(ListAuditLogQuery request, CancellationToken cancellationToken)
    {
        var query = db.AuditLogs.AsQueryable();
        if (!string.IsNullOrWhiteSpace(request.EntityType)) query = query.Where(a => a.EntityType == request.EntityType);
        if (request.EntityId is { } entityId) query = query.Where(a => a.EntityId == entityId);

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        query = query.ApplySort(request.SortBy, request.SortDir, SortWhitelist, "timestamp");
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(a => new AuditLogDto(
                a.Id, a.EntityType, a.EntityId, a.Action, a.AdminUserId,
                db.AdminUsers.Where(u => u.Id == a.AdminUserId).Select(u => u.DisplayName).FirstOrDefault(),
                a.TimestampUtc, a.DetailsJson))
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedResult<AuditLogDto>(items, page, pageSize, total));
    }
}
