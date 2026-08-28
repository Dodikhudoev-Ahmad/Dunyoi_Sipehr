using System.Linq.Expressions;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.TravelRequests.Dtos;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.TravelRequests.Queries;

public record ListAdminTravelRequestsQuery(
    TravelRequestStatus? Status, DateTime? FromUtc, DateTime? ToUtc, int Page, int PageSize,
    string? SortBy = null, string? SortDir = null, string? Search = null,
    /// Requests whose NextFollowUpAtUtc falls on-or-before this instant — the "overdue or due
    /// today" filter for the dashboard's "Требуют внимания сегодня" counter and any future list
    /// filter UI. Null (no value supplied) means no follow-up filtering at all.
    DateTime? DueBy = null,
    Guid? AssignedAdminUserId = null)
    : IRequest<Result<PagedResult<TravelRequestListItemDto>>>;

public class ListAdminTravelRequestsQueryHandler(IReadDbContext db) : IRequestHandler<ListAdminTravelRequestsQuery, Result<PagedResult<TravelRequestListItemDto>>>
{
    public static readonly IReadOnlyDictionary<string, Expression<Func<TravelRequest, object?>>> SortWhitelist = new Dictionary<string, Expression<Func<TravelRequest, object?>>>
    {
        ["createdAt"] = t => t.CreatedAtUtc,
        ["status"] = t => t.Status,
        ["lastName"] = t => t.LastName,
    };

    public async Task<Result<PagedResult<TravelRequestListItemDto>>> Handle(ListAdminTravelRequestsQuery request, CancellationToken cancellationToken)
    {
        var query = db.TravelRequests.AsQueryable();
        if (request.Status is { } status) query = query.Where(t => t.Status == status);
        if (request.FromUtc is { } from) query = query.Where(t => t.CreatedAtUtc >= from);
        if (request.ToUtc is { } to) query = query.Where(t => t.CreatedAtUtc <= to);
        if (request.DueBy is { } dueBy) query = query.Where(t => t.NextFollowUpAtUtc != null && t.NextFollowUpAtUtc <= dueBy);
        if (request.AssignedAdminUserId is { } assignedTo) query = query.Where(t => t.AssignedAdminUserId == assignedTo);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(t => t.LastName.Contains(term) || t.FirstName.Contains(term) || (t.MiddleName != null && t.MiddleName.Contains(term)) || t.Phone.Contains(term));
        }

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        query = query.ApplySort(request.SortBy, request.SortDir, SortWhitelist, "createdAt");
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => new TravelRequestListItemDto(
                t.Id, t.CreatedAtUtc, t.Status, t.LastName, t.FirstName, t.MiddleName, t.Phone,
                t.DepartureDate, t.ReturnDate,
                t.DestinationSnapshotTitle, t.OfferSnapshotTitle, t.AssignedAdminUserId,
                db.AdminUsers.Where(a => a.Id == t.AssignedAdminUserId).Select(a => a.DisplayName).FirstOrDefault(),
                t.DealValue, t.DealCurrency, t.NextFollowUpAtUtc))
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedResult<TravelRequestListItemDto>(items, page, pageSize, total));
    }
}

public record GetAdminTravelRequestByIdQuery(Guid Id) : IRequest<Result<TravelRequestDetailDto>>;

public class GetAdminTravelRequestByIdQueryHandler(IReadDbContext db) : IRequestHandler<GetAdminTravelRequestByIdQuery, Result<TravelRequestDetailDto>>
{
    public async Task<Result<TravelRequestDetailDto>> Handle(GetAdminTravelRequestByIdQuery request, CancellationToken cancellationToken)
    {
        var dto = await db.TravelRequests.Where(t => t.Id == request.Id)
            .Select(t => new TravelRequestDetailDto(
                t.Id, t.CreatedAtUtc, t.Status, t.LastName, t.FirstName, t.MiddleName, t.Phone, t.PreferredLocale,
                t.DestinationId, t.DestinationSnapshotTitle, t.OfferId, t.OfferSnapshotTitle,
                t.PassengersAdults, t.PassengersChildren, t.ChildrenAges, t.Message,
                t.DepartureDate, t.ReturnDate, t.PassportPhotoPaths,
                t.ConsentAcceptedAtUtc, t.PassportDataConsentAcceptedAtUtc,
                t.SourceUtm, t.SourceIp, t.SourceLocale,
                t.AssignedAdminUserId, db.AdminUsers.Where(a => a.Id == t.AssignedAdminUserId).Select(a => a.DisplayName).FirstOrDefault(),
                t.DealValue, t.DealCurrency, t.NextFollowUpAtUtc))
            .FirstOrDefaultAsync(cancellationToken);

        return dto is null
            ? Result.Failure<TravelRequestDetailDto>(Error.NotFound("NOT_FOUND", "Travel request not found."))
            : Result.Success(dto);
    }
}

public record ListTravelRequestNotesQuery(Guid TravelRequestId) : IRequest<Result<IReadOnlyList<TravelRequestNoteDto>>>;

public class ListTravelRequestNotesQueryHandler(IReadDbContext db) : IRequestHandler<ListTravelRequestNotesQuery, Result<IReadOnlyList<TravelRequestNoteDto>>>
{
    public async Task<Result<IReadOnlyList<TravelRequestNoteDto>>> Handle(ListTravelRequestNotesQuery request, CancellationToken cancellationToken)
    {
        var exists = await db.TravelRequests.AnyAsync(t => t.Id == request.TravelRequestId, cancellationToken);
        if (!exists)
            return Result.Failure<IReadOnlyList<TravelRequestNoteDto>>(Error.NotFound("NOT_FOUND", "Travel request not found."));

        var notes = await db.TravelRequestNotes
            .Where(n => n.TravelRequestId == request.TravelRequestId)
            .OrderByDescending(n => n.CreatedAtUtc)
            .Select(n => new TravelRequestNoteDto(
                n.Id, n.TravelRequestId, n.Text, n.CreatedAtUtc, n.AuthorAdminUserId,
                db.AdminUsers.Where(a => a.Id == n.AuthorAdminUserId).Select(a => a.DisplayName).FirstOrDefault() ?? "—"))
            .ToListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<TravelRequestNoteDto>>(notes);
    }
}
