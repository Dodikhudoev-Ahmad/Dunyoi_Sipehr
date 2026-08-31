using System.Linq.Expressions;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Flights.Dtos;
using AeroTravel.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Flights.Queries;

/// The cross-flight registry (GET /admin/passengers) — every FlightPassenger row joined to its
/// Flight, unlike ListFlightPassengersQuery which is scoped to one flight.
public record ListPassengerRegistryQuery(
    Guid? FlightId, string? Search, DateTime? DepartureFromUtc, DateTime? DepartureToUtc,
    int Page, int PageSize, string? SortBy = null, string? SortDir = null)
    : IRequest<Result<PagedResult<PassengerRegistryItemDto>>>;

public class ListPassengerRegistryQueryHandler(IReadDbContext db) : IRequestHandler<ListPassengerRegistryQuery, Result<PagedResult<PassengerRegistryItemDto>>>
{
    public static readonly IReadOnlyDictionary<string, Expression<Func<FlightPassenger, object?>>> SortWhitelist = new Dictionary<string, Expression<Func<FlightPassenger, object?>>>
    {
        ["addedAtUtc"] = p => p.AddedAtUtc,
        ["fullName"] = p => p.FullName,
    };

    public async Task<Result<PagedResult<PassengerRegistryItemDto>>> Handle(ListPassengerRegistryQuery request, CancellationToken cancellationToken)
    {
        var query = BuildQuery(db, request.FlightId, request.Search, request.DepartureFromUtc, request.DepartureToUtc);

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        query = query.ApplySort(request.SortBy, request.SortDir, SortWhitelist, "addedAtUtc");
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new PassengerRegistryItemDto(
                p.Id, p.FlightId, db.Flights.Where(f => f.Id == p.FlightId).Select(f => f.FlightNumber).FirstOrDefault() ?? "—",
                db.Flights.Where(f => f.Id == p.FlightId).Select(f => f.DepartureAtUtc).FirstOrDefault(),
                p.Source, p.TravelRequestId, p.FullName, p.Phone,
                p.AddedByAdminUserId, db.AdminUsers.Where(a => a.Id == p.AddedByAdminUserId).Select(a => a.DisplayName).FirstOrDefault(),
                p.AddedAtUtc))
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedResult<PassengerRegistryItemDto>(items, page, pageSize, total));
    }

    internal static IQueryable<FlightPassenger> BuildQuery(
        IReadDbContext db, Guid? flightId, string? search, DateTime? departureFromUtc, DateTime? departureToUtc)
    {
        var query = db.FlightPassengers.AsQueryable();
        if (flightId is { } fid) query = query.Where(p => p.FlightId == fid);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(p => p.FullName.Contains(term) || p.Phone.Contains(term));
        }
        if (departureFromUtc is { } from) query = query.Where(p => db.Flights.Any(f => f.Id == p.FlightId && f.DepartureAtUtc >= from));
        if (departureToUtc is { } to) query = query.Where(p => db.Flights.Any(f => f.Id == p.FlightId && f.DepartureAtUtc <= to));
        return query;
    }
}

public record ExportPassengerRegistryQuery(Guid? FlightId, string? Search, DateTime? DepartureFromUtc, DateTime? DepartureToUtc)
    : IRequest<Result<byte[]>>;

public class ExportPassengerRegistryQueryHandler(IReadDbContext db, IExcelExportService excelExport)
    : IRequestHandler<ExportPassengerRegistryQuery, Result<byte[]>>
{
    private static readonly string[] Headers = ["ФИО", "Телефон", "Рейс", "Дата вылета", "Источник", "Кто добавил", "Дата добавления"];

    public async Task<Result<byte[]>> Handle(ExportPassengerRegistryQuery request, CancellationToken cancellationToken)
    {
        var query = ListPassengerRegistryQueryHandler.BuildQuery(db, request.FlightId, request.Search, request.DepartureFromUtc, request.DepartureToUtc);

        var items = await query.OrderByDescending(p => p.AddedAtUtc)
            .Select(p => new
            {
                p.FullName,
                p.Phone,
                FlightNumber = db.Flights.Where(f => f.Id == p.FlightId).Select(f => f.FlightNumber).FirstOrDefault(),
                DepartureAtUtc = db.Flights.Where(f => f.Id == p.FlightId).Select(f => f.DepartureAtUtc).FirstOrDefault(),
                p.Source,
                AddedByAdminDisplayName = db.AdminUsers.Where(a => a.Id == p.AddedByAdminUserId).Select(a => a.DisplayName).FirstOrDefault(),
                p.AddedAtUtc,
            })
            .ToListAsync(cancellationToken);

        var rows = items.Select(p => (IReadOnlyList<object?>)
        [
            p.FullName,
            p.Phone,
            p.FlightNumber ?? "—",
            p.DepartureAtUtc,
            p.Source == Domain.Enums.FlightPassengerSource.Crm ? "CRM" : "Вручную",
            p.AddedByAdminDisplayName ?? "—",
            p.AddedAtUtc,
        ]).ToList();

        var bytes = excelExport.GenerateXlsx("Реестр пассажиров", Headers, rows);
        return Result.Success(bytes);
    }
}
