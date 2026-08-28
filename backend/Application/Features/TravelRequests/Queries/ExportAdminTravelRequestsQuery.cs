using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.TravelRequests.Queries;

/// `RequestingAdminRole`/`RequestingAdminUserId` drive the access-control rule (not a plain
/// filter the caller chooses): SuperAdmin exports every request matching the filter; Editor's
/// export is silently narrowed to only requests assigned to them, regardless of what they pass —
/// this is data protection, not a convenience filter, so it's enforced here in the handler, not
/// left to the controller/client to opt into.
public record ExportAdminTravelRequestsQuery(
    TravelRequestStatus? Status, DateTime? FromUtc, DateTime? ToUtc, string? Search,
    AdminRole RequestingAdminRole, Guid? RequestingAdminUserId)
    : IRequest<Result<byte[]>>;

public class ExportAdminTravelRequestsQueryHandler(IReadDbContext db, IExcelExportService excelExport)
    : IRequestHandler<ExportAdminTravelRequestsQuery, Result<byte[]>>
{
    private static readonly IReadOnlyDictionary<TravelRequestStatus, string> StatusLabels = new Dictionary<TravelRequestStatus, string>
    {
        [TravelRequestStatus.New] = "Новая",
        [TravelRequestStatus.Contacted] = "Связались",
        [TravelRequestStatus.Qualified] = "Обсуждаем",
        [TravelRequestStatus.Won] = "Успех",
        [TravelRequestStatus.Lost] = "Отказ",
    };

    private static readonly string[] Headers =
    [
        "ФИО", "Телефон", "Направление", "Статус", "Дата создания", "Дата вылета", "Дата возврата",
        "Взрослые", "Дети", "Сумма сделки", "Валюта", "Ответственный менеджер", "Следующий контакт",
    ];

    public async Task<Result<byte[]>> Handle(ExportAdminTravelRequestsQuery request, CancellationToken cancellationToken)
    {
        var query = db.TravelRequests.AsQueryable();
        if (request.Status is { } status) query = query.Where(t => t.Status == status);
        if (request.FromUtc is { } from) query = query.Where(t => t.CreatedAtUtc >= from);
        if (request.ToUtc is { } to) query = query.Where(t => t.CreatedAtUtc <= to);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(t => t.LastName.Contains(term) || t.FirstName.Contains(term) || (t.MiddleName != null && t.MiddleName.Contains(term)) || t.Phone.Contains(term));
        }

        // The access-control narrowing itself — see the type's doc comment. Not conditional on
        // any client-supplied flag: an Editor's role alone determines this.
        if (request.RequestingAdminRole != AdminRole.SuperAdmin)
            query = query.Where(t => t.AssignedAdminUserId == request.RequestingAdminUserId);

        var items = await query
            .OrderByDescending(t => t.CreatedAtUtc)
            .Select(t => new
            {
                t.LastName,
                t.FirstName,
                t.MiddleName,
                t.Phone,
                Destination = t.DestinationSnapshotTitle ?? t.OfferSnapshotTitle,
                t.Status,
                t.CreatedAtUtc,
                t.DepartureDate,
                t.ReturnDate,
                t.PassengersAdults,
                t.PassengersChildren,
                t.DealValue,
                t.DealCurrency,
                AssignedAdminDisplayName = db.AdminUsers.Where(a => a.Id == t.AssignedAdminUserId).Select(a => a.DisplayName).FirstOrDefault(),
                t.NextFollowUpAtUtc,
            })
            .ToListAsync(cancellationToken);

        var rows = items.Select(t => (IReadOnlyList<object?>)
        [
            string.Join(' ', new[] { t.LastName, t.FirstName, t.MiddleName }.Where(s => !string.IsNullOrWhiteSpace(s))),
            t.Phone,
            t.Destination ?? "—",
            StatusLabels[t.Status],
            t.CreatedAtUtc,
            t.DepartureDate,
            (object?)t.ReturnDate ?? "—",
            t.PassengersAdults,
            t.PassengersChildren,
            (object?)t.DealValue ?? "—",
            t.DealCurrency?.ToString().ToUpperInvariant() ?? "—",
            t.AssignedAdminDisplayName ?? "—",
            (object?)t.NextFollowUpAtUtc ?? "—",
        ]).ToList();

        var bytes = excelExport.GenerateXlsx("Заявки", Headers, rows);
        return Result.Success(bytes);
    }
}
