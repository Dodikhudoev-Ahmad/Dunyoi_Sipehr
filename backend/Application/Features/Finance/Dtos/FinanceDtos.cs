using AeroTravel.Domain.Enums;

namespace AeroTravel.Application.Features.Finance.Dtos;

/// No date field — the operation date is always "today" on the server (see
/// CreatePaymentCommandHandler), never client-supplied, so a payment can't be backdated/postdated
/// to manipulate the balance or period reports.
public record UpsertPaymentInput(
    decimal Amount, string ClientName,
    Guid? TravelRequestId, Guid? FlightId, PaymentMethod Method, string? Comment);

/// Same "always today" rule as UpsertPaymentInput — see CreateExpenseCommandHandler.
public record UpsertExpenseInput(decimal Amount, ExpenseCategory Category, string? Comment);

/// One row of the unified transaction journal (GET /admin/finance/transactions) — Payments and
/// Expenses projected into a common shape so the frontend renders a single sortable table instead
/// of two. `CategoryOrMethod` holds the Payment's PaymentMethod name or the Expense's
/// ExpenseCategory name (both plain enum-name strings, same convention as every other admin DTO);
/// `Label` holds the flight/destination for a payment or is null for an expense.
public record TransactionDto(
    Guid Id, string Type, DateOnly Date, decimal Amount, string CategoryOrMethod,
    string? Label, string? ClientName, string? Comment,
    Guid? CreatedByAdminUserId, string? CreatedByAdminDisplayName);

public record FinanceSummaryDto(decimal IncomeForPeriod, decimal ExpenseForPeriod, decimal BalanceAllTime, decimal TotalReceivables);

/// A TravelRequest with a deal value set where collected payments haven't caught up to it yet.
public record ReceivableDto(Guid TravelRequestId, string ClientName, decimal DealValue, decimal Paid, decimal Remaining);

public record FlightReportItemDto(string Label, decimal Total);

public record MonthlySeriesPointDto(int Year, int Month, string MonthLabel, decimal Income, decimal Expense);

/// Lightweight lookup rows for the "Приход" form's flight/request pickers — the Finance module
/// gets its own read-only projections here rather than depending on AdminFlightsController /
/// AdminTravelRequestsController's Editor-scoped endpoints (see RBAC note on those controllers).
public record FinanceFlightLookupItemDto(Guid Id, string FlightNumber, DateTime DepartureAtUtc);
public record FinanceTravelRequestLookupItemDto(Guid Id, string ClientName, string Phone, decimal? DealValue);
