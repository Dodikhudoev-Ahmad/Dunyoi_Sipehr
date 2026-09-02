using System.Linq.Expressions;
using System.Text.RegularExpressions;
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

/// Powers the "Добавить рейс" form's pre-filled number field. Looks across *every* flight, not
/// just whatever page the list happens to have cached client-side — the list is paginated, so the
/// highest number could easily be off-screen and a frontend-only computation would silently
/// suggest a stale/duplicate number once there are more flights than fit on one page.
public record GetNextFlightNumberQuery : IRequest<Result<NextFlightNumberDto>>;

public class GetNextFlightNumberQueryHandler(IReadDbContext db) : IRequestHandler<GetNextFlightNumberQuery, Result<NextFlightNumberDto>>
{
    // Trailing run of digits, with everything before it (possibly empty) captured as the prefix —
    // matches "FZ100" -> ("FZ", "100"), "DS-045" -> ("DS-", "045"), "45" -> ("", "45").
    private static readonly Regex TrailingNumber = new(@"^(.*?)(\d+)$", RegexOptions.Compiled);

    public async Task<Result<NextFlightNumberDto>> Handle(GetNextFlightNumberQuery request, CancellationToken cancellationToken)
    {
        var numbers = await db.Flights.Select(f => f.FlightNumber).ToListAsync(cancellationToken);

        string? bestPrefix = null;
        var bestValue = -1;
        var bestDigitWidth = 0;

        foreach (var number in numbers)
        {
            var match = TrailingNumber.Match(number);
            if (!match.Success) continue;

            var digits = match.Groups[2].Value;
            if (!int.TryParse(digits, out var value)) continue;

            if (value > bestValue)
            {
                bestValue = value;
                bestPrefix = match.Groups[1].Value;
                bestDigitWidth = digits.Length;
            }
        }

        if (bestPrefix is null)
            return Result.Success(new NextFlightNumberDto(null));

        // Zero-padded to match the width of the number it's incrementing from (e.g. "045" -> "046",
        // not "46") — falls out naturally once the incremented value needs an extra digit ("099" -> "100").
        var nextDigits = (bestValue + 1).ToString().PadLeft(bestDigitWidth, '0');
        return Result.Success(new NextFlightNumberDto($"{bestPrefix}{nextDigits}"));
    }
}
