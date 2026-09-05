using AeroTravel.Domain.Common;
using AeroTravel.Domain.Enums;

namespace AeroTravel.Domain.Entities;

/// A recorded client payment ("Приход") — optionally linked to the TravelRequest it was collected
/// against (for the receivables/debt calculation) and/or the Flight it funds (for the per-flight
/// revenue report). Both links are nullable and independent: a payment can be logged against a
/// flight with no CRM request behind it (e.g. a walk-in), or against a request with no flight
/// assigned yet.
public class Payment : Entity
{
    public decimal Amount { get; private set; }
    public DateOnly PaidOnUtc { get; private set; }
    public string ClientName { get; private set; } = default!;
    public Guid? TravelRequestId { get; private set; }
    public Guid? FlightId { get; private set; }
    public PaymentMethod Method { get; private set; }
    public string? Comment { get; private set; }

    public Guid? CreatedByAdminUserId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private Payment() { }

    public Payment(
        decimal amount, DateOnly paidOnUtc, string clientName,
        Guid? travelRequestId, Guid? flightId, PaymentMethod method, string? comment,
        Guid? createdByAdminUserId)
    {
        Amount = amount;
        PaidOnUtc = paidOnUtc;
        ClientName = clientName;
        TravelRequestId = travelRequestId;
        FlightId = flightId;
        Method = method;
        Comment = comment;
        CreatedByAdminUserId = createdByAdminUserId;
    }
}

/// A manually-entered expense line ("Расход") — no linkage to CRM/flights, just a categorized
/// ledger entry per MASTER_TZ Finance module spec.
public class Expense : Entity
{
    public decimal Amount { get; private set; }
    public DateOnly SpentOnUtc { get; private set; }
    public ExpenseCategory Category { get; private set; }
    public string? Comment { get; private set; }

    public Guid? CreatedByAdminUserId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private Expense() { }

    public Expense(decimal amount, DateOnly spentOnUtc, ExpenseCategory category, string? comment, Guid? createdByAdminUserId)
    {
        Amount = amount;
        SpentOnUtc = spentOnUtc;
        Category = category;
        Comment = comment;
        CreatedByAdminUserId = createdByAdminUserId;
    }
}
