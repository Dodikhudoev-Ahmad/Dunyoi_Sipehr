using System.Linq.Expressions;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Flights.Dtos;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Flights.Queries;

public record ListAdminFlightsQuery(
    FlightStatus? Status, DateTime? FromUtc, DateTime? ToUtc, string? Search,
    int Page, int PageSize, string? SortBy = null, string? SortDir = null)
    : IRequest<Result<PagedResult<FlightListItemDto>>>;

public class ListAdminFlightsQueryHandler(IReadDbContext db) : IRequestHandler<ListAdminFlightsQuery, Result<PagedResult<FlightListItemDto>>>
{
    public static readonly IReadOnlyDictionary<string, Expression<Func<Flight, object?>>> SortWhitelist = new Dictionary<string, Expression<Func<Flight, object?>>>
    {
        ["departureAtUtc"] = f => f.DepartureAtUtc,
        ["flightNumber"] = f => f.FlightNumber,
        ["status"] = f => f.Status,
        ["createdAtUtc"] = f => f.CreatedAtUtc,
    };

    public async Task<Result<PagedResult<FlightListItemDto>>> Handle(ListAdminFlightsQuery request, CancellationToken cancellationToken)
    {
        var query = db.Flights.AsQueryable();
        if (request.Status is { } status) query = query.Where(f => f.Status == status);
        if (request.FromUtc is { } from) query = query.Where(f => f.DepartureAtUtc >= from);
        if (request.ToUtc is { } to) query = query.Where(f => f.DepartureAtUtc <= to);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(f => f.FlightNumber.Contains(term)
                || db.Cities.Where(c => c.Id == f.OriginCityId).SelectMany(c => c.Translations).Any(t => t.Name.Contains(term))
                || db.Cities.Where(c => c.Id == f.DestinationCityId).SelectMany(c => c.Translations).Any(t => t.Name.Contains(term)));
        }

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        query = query.ApplySort(request.SortBy, request.SortDir, SortWhitelist, "departureAtUtc");
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(f => new FlightListItemDto(
                f.Id, f.FlightNumber,
                f.OriginCityId, db.Cities.Where(c => c.Id == f.OriginCityId).SelectMany(c => c.Translations).Where(t => t.Locale == Locale.Ru).Select(t => t.Name).FirstOrDefault() ?? "—",
                f.DestinationCityId, db.Cities.Where(c => c.Id == f.DestinationCityId).SelectMany(c => c.Translations).Where(t => t.Locale == Locale.Ru).Select(t => t.Name).FirstOrDefault() ?? "—",
                f.DepartureAtUtc, f.Status,
                db.FlightPassengers.Count(p => p.FlightId == f.Id), f.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedResult<FlightListItemDto>(items, page, pageSize, total));
    }
}

public record GetAdminFlightByIdQuery(Guid Id) : IRequest<Result<FlightDetailDto>>;

public class GetAdminFlightByIdQueryHandler(IReadDbContext db) : IRequestHandler<GetAdminFlightByIdQuery, Result<FlightDetailDto>>
{
    public async Task<Result<FlightDetailDto>> Handle(GetAdminFlightByIdQuery request, CancellationToken cancellationToken)
    {
        var dto = await db.Flights.Where(f => f.Id == request.Id)
            .Select(f => new FlightDetailDto(
                f.Id, f.FlightNumber,
                f.OriginCityId, db.Cities.Where(c => c.Id == f.OriginCityId).SelectMany(c => c.Translations).Where(t => t.Locale == Locale.Ru).Select(t => t.Name).FirstOrDefault() ?? "—",
                f.DestinationCityId, db.Cities.Where(c => c.Id == f.DestinationCityId).SelectMany(c => c.Translations).Where(t => t.Locale == Locale.Ru).Select(t => t.Name).FirstOrDefault() ?? "—",
                f.DepartureAtUtc, f.Status,
                f.CreatedByAdminUserId, db.AdminUsers.Where(a => a.Id == f.CreatedByAdminUserId).Select(a => a.DisplayName).FirstOrDefault(),
                f.CreatedAtUtc))
            .FirstOrDefaultAsync(cancellationToken);

        return dto is null
            ? Result.Failure<FlightDetailDto>(Error.NotFound("NOT_FOUND", "Flight not found."))
            : Result.Success(dto);
    }
}

public record ListFlightPassengersQuery(Guid FlightId) : IRequest<Result<IReadOnlyList<FlightPassengerDto>>>;

public class ListFlightPassengersQueryHandler(IReadDbContext db) : IRequestHandler<ListFlightPassengersQuery, Result<IReadOnlyList<FlightPassengerDto>>>
{
    public async Task<Result<IReadOnlyList<FlightPassengerDto>>> Handle(ListFlightPassengersQuery request, CancellationToken cancellationToken)
    {
        var flightExists = await db.Flights.AnyAsync(f => f.Id == request.FlightId, cancellationToken);
        if (!flightExists)
            return Result.Failure<IReadOnlyList<FlightPassengerDto>>(Error.NotFound("NOT_FOUND", "Flight not found."));

        var passengers = await db.FlightPassengers
            .Where(p => p.FlightId == request.FlightId)
            .OrderByDescending(p => p.AddedAtUtc)
            .Select(p => new FlightPassengerDto(
                p.Id, p.FlightId, p.Source, p.TravelRequestId, p.FullName, p.Phone,
                p.AddedByAdminUserId, db.AdminUsers.Where(a => a.Id == p.AddedByAdminUserId).Select(a => a.DisplayName).FirstOrDefault(),
                p.AddedAtUtc))
            .ToListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<FlightPassengerDto>>(passengers);
    }
}
