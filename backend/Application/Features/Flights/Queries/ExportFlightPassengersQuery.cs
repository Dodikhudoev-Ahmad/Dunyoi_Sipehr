using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Flights.Queries;

public record ExportFlightPassengersQuery(Guid FlightId) : IRequest<Result<byte[]>>;

public class ExportFlightPassengersQueryHandler(IReadDbContext db, IExcelExportService excelExport)
    : IRequestHandler<ExportFlightPassengersQuery, Result<byte[]>>
{
    private static readonly string[] Headers = ["ФИО", "Телефон", "Источник", "Кто добавил", "Дата добавления"];

    public async Task<Result<byte[]>> Handle(ExportFlightPassengersQuery request, CancellationToken cancellationToken)
    {
        var flight = await db.Flights.Where(f => f.Id == request.FlightId)
            .Select(f => new { f.FlightNumber })
            .FirstOrDefaultAsync(cancellationToken);
        if (flight is null)
            return Result.Failure<byte[]>(Error.NotFound("NOT_FOUND", "Flight not found."));

        var items = await db.FlightPassengers.Where(p => p.FlightId == request.FlightId)
            .OrderBy(p => p.FullName)
            .Select(p => new
            {
                p.FullName,
                p.Phone,
                p.Source,
                AddedByAdminDisplayName = db.AdminUsers.Where(a => a.Id == p.AddedByAdminUserId).Select(a => a.DisplayName).FirstOrDefault(),
                p.AddedAtUtc,
            })
            .ToListAsync(cancellationToken);

        var rows = items.Select(p => (IReadOnlyList<object?>)
        [
            p.FullName,
            p.Phone,
            p.Source == FlightPassengerSource.Crm ? "CRM" : "Вручную",
            p.AddedByAdminDisplayName ?? "—",
            p.AddedAtUtc,
        ]).ToList();

        var bytes = excelExport.GenerateXlsx($"Рейс {flight.FlightNumber}", Headers, rows);
        return Result.Success(bytes);
    }
}
