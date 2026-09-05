using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Finance.Dtos;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Finance.Queries;

// ---------------------------------------------------------------------------------------------
// Shared date-range filtering — Payment.PaidOnUtc / Expense.SpentOnUtc are DateOnly, so every
// Finance query takes a plain from/to DateOnly pair (matches the frontend's <input type="date">
// period filter) rather than a DateTime range with a time-of-day component that has no meaning here.
// ---------------------------------------------------------------------------------------------
internal static class FinanceQueryHelpers
{
    public static IQueryable<Payment> FilterPayments(IReadDbContext db, DateOnly? from, DateOnly? to)
    {
        var query = db.Payments.AsQueryable();
        if (from is { } f) query = query.Where(p => p.PaidOnUtc >= f);
        if (to is { } t) query = query.Where(p => p.PaidOnUtc <= t);
        return query;
    }

    public static IQueryable<Expense> FilterExpenses(IReadDbContext db, DateOnly? from, DateOnly? to)
    {
        var query = db.Expenses.AsQueryable();
        if (from is { } f) query = query.Where(e => e.SpentOnUtc >= f);
        if (to is { } t) query = query.Where(e => e.SpentOnUtc <= t);
        return query;
    }

    public static async Task<List<TransactionDto>> LoadTransactionsAsync(IReadDbContext db, DateOnly? from, DateOnly? to, string? type, CancellationToken ct)
    {
        var result = new List<TransactionDto>();

        if (type is null || type == "Income")
        {
            var incomeRows = await FilterPayments(db, from, to)
                .Select(p => new
                {
                    p.Id,
                    p.PaidOnUtc,
                    p.Amount,
                    p.Method,
                    p.ClientName,
                    p.Comment,
                    FlightNumber = p.FlightId != null ? db.Flights.Where(f => f.Id == p.FlightId).Select(f => f.FlightNumber).FirstOrDefault() : null,
                    DestinationTitle = p.TravelRequestId != null
                        ? db.TravelRequests.Where(t => t.Id == p.TravelRequestId).Select(t => t.DestinationSnapshotTitle ?? t.OfferSnapshotTitle).FirstOrDefault()
                        : null,
                    p.CreatedByAdminUserId,
                    CreatedByAdminDisplayName = db.AdminUsers.Where(a => a.Id == p.CreatedByAdminUserId).Select(a => a.DisplayName).FirstOrDefault(),
                })
                .ToListAsync(ct);

            result.AddRange(incomeRows.Select(p => new TransactionDto(
                p.Id, "Income", p.PaidOnUtc, p.Amount, p.Method.ToString(),
                p.FlightNumber ?? p.DestinationTitle, p.ClientName, p.Comment,
                p.CreatedByAdminUserId, p.CreatedByAdminDisplayName)));
        }

        if (type is null || type == "Expense")
        {
            var expenseRows = await FilterExpenses(db, from, to)
                .Select(e => new
                {
                    e.Id,
                    e.SpentOnUtc,
                    e.Amount,
                    e.Category,
                    e.Comment,
                    e.CreatedByAdminUserId,
                    CreatedByAdminDisplayName = db.AdminUsers.Where(a => a.Id == e.CreatedByAdminUserId).Select(a => a.DisplayName).FirstOrDefault(),
                })
                .ToListAsync(ct);

            result.AddRange(expenseRows.Select(e => new TransactionDto(
                e.Id, "Expense", e.SpentOnUtc, e.Amount, e.Category.ToString(),
                null, null, e.Comment,
                e.CreatedByAdminUserId, e.CreatedByAdminDisplayName)));
        }

        return result;
    }
}

public record ListFinanceTransactionsQuery(
    DateOnly? FromDate, DateOnly? ToDate, string? Type, int Page, int PageSize, string? SortBy, string? SortDir)
    : IRequest<Result<PagedResult<TransactionDto>>>;

public class ListFinanceTransactionsQueryHandler(IReadDbContext db) : IRequestHandler<ListFinanceTransactionsQuery, Result<PagedResult<TransactionDto>>>
{
    public async Task<Result<PagedResult<TransactionDto>>> Handle(ListFinanceTransactionsQuery request, CancellationToken cancellationToken)
    {
        var all = await FinanceQueryHelpers.LoadTransactionsAsync(db, request.FromDate, request.ToDate, request.Type, cancellationToken);

        var descending = !string.Equals(request.SortDir, "asc", StringComparison.OrdinalIgnoreCase);
        IEnumerable<TransactionDto> sorted = request.SortBy switch
        {
            "amount" => descending ? all.OrderByDescending(t => t.Amount) : all.OrderBy(t => t.Amount),
            _ => descending ? all.OrderByDescending(t => t.Date) : all.OrderBy(t => t.Date),
        };
        var ordered = sorted.ToList();

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;
        var items = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return Result.Success(new PagedResult<TransactionDto>(items, page, pageSize, ordered.Count));
    }
}

public record ExportFinanceTransactionsQuery(DateOnly? FromDate, DateOnly? ToDate, string? Type) : IRequest<Result<byte[]>>;

public class ExportFinanceTransactionsQueryHandler(IReadDbContext db, IExcelExportService excelExport)
    : IRequestHandler<ExportFinanceTransactionsQuery, Result<byte[]>>
{
    private static readonly string[] Headers = ["Дата", "Тип", "Сумма", "Категория/способ", "Рейс/направление", "Клиент", "Комментарий", "Кто добавил"];

    public async Task<Result<byte[]>> Handle(ExportFinanceTransactionsQuery request, CancellationToken cancellationToken)
    {
        var all = await FinanceQueryHelpers.LoadTransactionsAsync(db, request.FromDate, request.ToDate, request.Type, cancellationToken);
        var ordered = all.OrderByDescending(t => t.Date).ToList();

        var rows = ordered.Select(t => (IReadOnlyList<object?>)
        [
            t.Date.ToDateTime(TimeOnly.MinValue),
            t.Type == "Income" ? "Приход" : "Расход",
            t.Amount,
            t.CategoryOrMethod,
            t.Label ?? "—",
            t.ClientName ?? "—",
            t.Comment ?? "—",
            t.CreatedByAdminDisplayName ?? "—",
        ]).ToList();

        var bytes = excelExport.GenerateXlsx("Финансы", Headers, rows);
        return Result.Success(bytes);
    }
}

public record GetFinanceSummaryQuery(DateOnly? FromDate, DateOnly? ToDate) : IRequest<Result<FinanceSummaryDto>>;

public class GetFinanceSummaryQueryHandler(IReadDbContext db) : IRequestHandler<GetFinanceSummaryQuery, Result<FinanceSummaryDto>>
{
    public async Task<Result<FinanceSummaryDto>> Handle(GetFinanceSummaryQuery request, CancellationToken cancellationToken)
    {
        var incomeForPeriod = await FinanceQueryHelpers.FilterPayments(db, request.FromDate, request.ToDate).SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;
        var expenseForPeriod = await FinanceQueryHelpers.FilterExpenses(db, request.FromDate, request.ToDate).SumAsync(e => (decimal?)e.Amount, cancellationToken) ?? 0m;

        // Balance is a running total, independent of the period filter — "текущий остаток", not
        // "остаток за период" (see MASTER_TZ Finance spec item 3).
        var totalIncome = await db.Payments.SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;
        var totalExpense = await db.Expenses.SumAsync(e => (decimal?)e.Amount, cancellationToken) ?? 0m;

        var totalReceivables = await ReceivablesQueryHelper.BuildRemainingOnly(db).SumAsync(x => (decimal?)x, cancellationToken) ?? 0m;

        return Result.Success(new FinanceSummaryDto(incomeForPeriod, expenseForPeriod, totalIncome - totalExpense, totalReceivables));
    }
}

/// A GroupJoin-based left join (TravelRequests to a GroupBy'd Payments aggregate) turned out not
/// to be translatable here once a Where/OrderBy needed the computed "remaining" value — EF Core
/// rejected it regardless of how the intermediate shape was structured. A per-row correlated
/// subquery (the same pattern already used everywhere else in this codebase for a scalar lookup,
/// e.g. FlightNumber/DisplayName in FinanceQueryHelpers above) sidesteps the whole problem and
/// translates cleanly.
internal static class ReceivablesQueryHelper
{
    // The correlated subquery (db.Payments.Where(...).Sum(...)) has to be written inline at every
    // call site below, not factored into a shared helper method — EF Core decomposes an IQueryable
    // chain it can see directly inside the Select() lambda's expression tree into a SQL correlated
    // subquery, but it can't look inside a separately-compiled C# method call to do the same.
    private static IQueryable<TravelRequest> TravelRequestsWithDeal(IReadDbContext db) => db.TravelRequests.Where(t => t.DealValue != null);

    public static IQueryable<decimal> BuildRemainingOnly(IReadDbContext db) =>
        TravelRequestsWithDeal(db)
            .Select(t => t.DealValue!.Value - ((db.Payments.Where(p => p.TravelRequestId == t.Id).Sum(p => (decimal?)p.Amount)) ?? 0m))
            .Where(remaining => remaining > 0.01m);

    /// Ordered, filtered rows still in anonymous-type form (with `Remaining` and `Id` still
    /// separate fields) — the caller pages this (Skip/Take) and only then projects to
    /// ReceivableDto, since OrderBy must run before that conversion to stay translatable.
    public static IQueryable<ReceivableDto> BuildOrderedDtos(IReadDbContext db)
    {
        var rows = TravelRequestsWithDeal(db)
            .Select(t => new
            {
                t.Id,
                ClientName = t.LastName + " " + t.FirstName,
                DealValue = t.DealValue!.Value,
                Paid = (db.Payments.Where(p => p.TravelRequestId == t.Id).Sum(p => (decimal?)p.Amount)) ?? 0m,
            })
            .Select(x => new { x.Id, x.ClientName, x.DealValue, x.Paid, Remaining = x.DealValue - x.Paid })
            .Where(x => x.Remaining > 0.01m);

        return rows.OrderByDescending(x => x.Remaining).Select(x => new ReceivableDto(x.Id, x.ClientName, x.DealValue, x.Paid, x.Remaining));
    }

    public static IQueryable<Guid> BuildIdsOnly(IReadDbContext db) =>
        TravelRequestsWithDeal(db)
            .Select(t => new { t.Id, Remaining = t.DealValue!.Value - ((db.Payments.Where(p => p.TravelRequestId == t.Id).Sum(p => (decimal?)p.Amount)) ?? 0m) })
            .Where(x => x.Remaining > 0.01m)
            .Select(x => x.Id);
}

public record ListReceivablesQuery(int Page, int PageSize) : IRequest<Result<PagedResult<ReceivableDto>>>;

public class ListReceivablesQueryHandler(IReadDbContext db) : IRequestHandler<ListReceivablesQuery, Result<PagedResult<ReceivableDto>>>
{
    public async Task<Result<PagedResult<ReceivableDto>>> Handle(ListReceivablesQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        var total = await ReceivablesQueryHelper.BuildIdsOnly(db).CountAsync(cancellationToken);
        var items = await ReceivablesQueryHelper.BuildOrderedDtos(db)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedResult<ReceivableDto>(items, page, pageSize, total));
    }
}

public record GetFinanceFlightReportQuery(DateOnly? FromDate, DateOnly? ToDate) : IRequest<Result<IReadOnlyList<FlightReportItemDto>>>;

public class GetFinanceFlightReportQueryHandler(IReadDbContext db) : IRequestHandler<GetFinanceFlightReportQuery, Result<IReadOnlyList<FlightReportItemDto>>>
{
    public async Task<Result<IReadOnlyList<FlightReportItemDto>>> Handle(GetFinanceFlightReportQuery request, CancellationToken cancellationToken)
    {
        var rows = await FinanceQueryHelpers.FilterPayments(db, request.FromDate, request.ToDate)
            .Select(p => new
            {
                p.Amount,
                FlightNumber = p.FlightId != null ? db.Flights.Where(f => f.Id == p.FlightId).Select(f => f.FlightNumber).FirstOrDefault() : null,
                DestinationTitle = p.TravelRequestId != null
                    ? db.TravelRequests.Where(t => t.Id == p.TravelRequestId).Select(t => t.DestinationSnapshotTitle ?? t.OfferSnapshotTitle).FirstOrDefault()
                    : null,
            })
            .ToListAsync(cancellationToken);

        var grouped = rows
            .GroupBy(r => r.FlightNumber ?? r.DestinationTitle ?? "Без привязки")
            .Select(g => new FlightReportItemDto(g.Key, g.Sum(x => x.Amount)))
            .OrderByDescending(x => x.Total)
            .ToList();

        return Result.Success<IReadOnlyList<FlightReportItemDto>>(grouped);
    }
}

public record GetFinanceMonthlySeriesQuery(int Months = 6) : IRequest<Result<IReadOnlyList<MonthlySeriesPointDto>>>;

public class GetFinanceMonthlySeriesQueryHandler(IReadDbContext db) : IRequestHandler<GetFinanceMonthlySeriesQuery, Result<IReadOnlyList<MonthlySeriesPointDto>>>
{
    private static readonly string[] MonthAbbrRu = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

    public async Task<Result<IReadOnlyList<MonthlySeriesPointDto>>> Handle(GetFinanceMonthlySeriesQuery request, CancellationToken cancellationToken)
    {
        var months = request.Months is < 1 or > 36 ? 6 : request.Months;
        var todayUtc = DateTime.UtcNow;
        var rangeStart = new DateOnly(todayUtc.Year, todayUtc.Month, 1).AddMonths(-(months - 1));

        var incomeRows = await db.Payments.Where(p => p.PaidOnUtc >= rangeStart)
            .GroupBy(p => new { p.PaidOnUtc.Year, p.PaidOnUtc.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(p => p.Amount) })
            .ToListAsync(cancellationToken);

        var expenseRows = await db.Expenses.Where(e => e.SpentOnUtc >= rangeStart)
            .GroupBy(e => new { e.SpentOnUtc.Year, e.SpentOnUtc.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(e => e.Amount) })
            .ToListAsync(cancellationToken);

        var points = new List<MonthlySeriesPointDto>();
        for (var i = months - 1; i >= 0; i--)
        {
            var cursor = new DateOnly(todayUtc.Year, todayUtc.Month, 1).AddMonths(-i);
            var income = incomeRows.FirstOrDefault(r => r.Year == cursor.Year && r.Month == cursor.Month)?.Total ?? 0m;
            var expense = expenseRows.FirstOrDefault(r => r.Year == cursor.Year && r.Month == cursor.Month)?.Total ?? 0m;
            points.Add(new MonthlySeriesPointDto(cursor.Year, cursor.Month, $"{MonthAbbrRu[cursor.Month - 1]} {cursor.Year}", income, expense));
        }

        return Result.Success<IReadOnlyList<MonthlySeriesPointDto>>(points);
    }
}

public record GetFinanceFlightsLookupQuery : IRequest<Result<IReadOnlyList<FinanceFlightLookupItemDto>>>;

public class GetFinanceFlightsLookupQueryHandler(IReadDbContext db) : IRequestHandler<GetFinanceFlightsLookupQuery, Result<IReadOnlyList<FinanceFlightLookupItemDto>>>
{
    public async Task<Result<IReadOnlyList<FinanceFlightLookupItemDto>>> Handle(GetFinanceFlightsLookupQuery request, CancellationToken cancellationToken)
    {
        var items = await db.Flights.OrderByDescending(f => f.DepartureAtUtc).Take(200)
            .Select(f => new FinanceFlightLookupItemDto(f.Id, f.FlightNumber, f.DepartureAtUtc))
            .ToListAsync(cancellationToken);
        return Result.Success<IReadOnlyList<FinanceFlightLookupItemDto>>(items);
    }
}

public record GetFinanceTravelRequestsLookupQuery(string? Search) : IRequest<Result<IReadOnlyList<FinanceTravelRequestLookupItemDto>>>;

public class GetFinanceTravelRequestsLookupQueryHandler(IReadDbContext db) : IRequestHandler<GetFinanceTravelRequestsLookupQuery, Result<IReadOnlyList<FinanceTravelRequestLookupItemDto>>>
{
    public async Task<Result<IReadOnlyList<FinanceTravelRequestLookupItemDto>>> Handle(GetFinanceTravelRequestsLookupQuery request, CancellationToken cancellationToken)
    {
        var query = db.TravelRequests.AsQueryable();
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(t => (t.LastName + " " + t.FirstName).Contains(term) || t.Phone.Contains(term));
        }

        var items = await query.OrderByDescending(t => t.CreatedAtUtc).Take(50)
            .Select(t => new FinanceTravelRequestLookupItemDto(t.Id, t.LastName + " " + t.FirstName, t.Phone, t.DealValue))
            .ToListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<FinanceTravelRequestLookupItemDto>>(items);
    }
}
