namespace AeroTravel.Domain.Enums;

public enum AdminRole
{
    Editor = 0,
    SuperAdmin = 1,
    /// Sees only the Finance section (Api/Controllers/Admin/AdminFinanceController) — every other
    /// admin controller restricts its plain [Authorize] to Editor+SuperAdmin explicitly so this
    /// role can't reach them even by direct URL/API call. See AdminLayout.tsx / AdminApp.tsx for
    /// the matching frontend nav/route guards.
    Accountant = 2
}

/// How a Payment (Приход) was collected — display-only categorization, not linked to any
/// payment-processing integration (this agency takes no live payments, see MASTER_TZ §1).
public enum PaymentMethod
{
    Cash = 0,
    Card = 1,
    BankTransfer = 2,
    Other = 3
}

/// Manual expense-entry categories per MASTER_TZ Finance module spec.
public enum ExpenseCategory
{
    Rent = 0,
    Salary = 1,
    AirlineCommission = 2,
    Advertising = 3,
    Other = 4
}

public enum TravelRequestStatus
{
    New = 0,
    Contacted = 1,
    Qualified = 2,
    Won = 3,
    Lost = 4
}

public enum Currency
{
    Usd = 0,
    Eur = 1,
    Tjs = 2
}

public enum FlightStatus
{
    Scheduled = 0,
    Departed = 1,
    Cancelled = 2
}

public enum FlightPassengerSource
{
    Manual = 0,
    Crm = 1
}
