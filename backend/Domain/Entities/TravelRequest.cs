using AeroTravel.Domain.Common;
using AeroTravel.Domain.Enums;

namespace AeroTravel.Domain.Entities;

public class TravelRequest : Entity
{
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public TravelRequestStatus Status { get; private set; } = TravelRequestStatus.New;

    public string LastName { get; private set; } = default!;
    public string FirstName { get; private set; } = default!;
    /// Patronymic — optional (not every name convention has one, notably outside the ru locale).
    public string? MiddleName { get; private set; }
    public string Phone { get; private set; } = default!;
    public Locale PreferredLocale { get; private set; }

    public Guid? DestinationId { get; private set; }
    public string? DestinationSnapshotTitle { get; private set; }
    public Guid? OfferId { get; private set; }
    public string? OfferSnapshotTitle { get; private set; }

    public int PassengersAdults { get; private set; }
    public int PassengersChildren { get; private set; }
    /// One entry per child (PassengersChildren), 0-17 — a child under 12 books at the child fare,
    /// 12+ effectively books at the adult fare, so this drives pricing, not just headcount.
    public List<int> ChildrenAges { get; private set; } = [];
    public string? Message { get; private set; }

    public DateOnly DepartureDate { get; private set; }
    public DateOnly? ReturnDate { get; private set; }

    /// Relative filenames under the configured upload root (see IFileStorageService) — never a
    /// public URL. Passport photos are sensitive PII; only served back through the authenticated
    /// admin download endpoint, scoped to this request's own Id.
    public List<string> PassportPhotoPaths { get; private set; } = [];
    /// Separate from ConsentAcceptedAtUtc: passport/ID photo processing is a distinct, more
    /// sensitive processing purpose and needs its own explicit consent per the request.
    public DateTime PassportDataConsentAcceptedAtUtc { get; private set; }

    public DateTime ConsentAcceptedAtUtc { get; private set; }
    public string? SourceUtm { get; private set; }
    public string? SourceIp { get; private set; }
    public Locale SourceLocale { get; private set; }

    public Guid? AssignedAdminUserId { get; private set; }

    /// CRM deal value — set once a request is being worked, not required until the operator
    /// actually wants to record one (nullable). See DEC entry: the *requirement* that a value be
    /// set before closing a deal as Won is enforced client-side (a UI gate before the status-
    /// change API call fires), not here — the state machine above is intentionally untouched.
    public decimal? DealValue { get; private set; }
    public Currency? DealCurrency { get; private set; }

    /// Next-contact reminder — nullable, cleared by passing null. Purely a CRM operator aid (see
    /// Kanban/list red-flag highlighting); has no effect on the status state machine.
    public DateTime? NextFollowUpAtUtc { get; private set; }

    private TravelRequest() { }

    public TravelRequest(
        string lastName, string firstName, string? middleName, string phone, Locale preferredLocale,
        int passengersAdults, int passengersChildren, IReadOnlyList<int> childrenAges, string? message,
        DateOnly departureDate, DateOnly? returnDate,
        Guid? destinationId, string? destinationSnapshotTitle,
        Guid? offerId, string? offerSnapshotTitle,
        IReadOnlyList<string> passportPhotoPaths,
        string? sourceUtm, string? sourceIp, Locale sourceLocale)
    {
        LastName = lastName;
        FirstName = firstName;
        MiddleName = middleName;
        Phone = phone;
        PreferredLocale = preferredLocale;
        PassengersAdults = passengersAdults;
        PassengersChildren = passengersChildren;
        ChildrenAges = childrenAges.ToList();
        Message = message;
        DepartureDate = departureDate;
        ReturnDate = returnDate;
        DestinationId = destinationId;
        DestinationSnapshotTitle = destinationSnapshotTitle;
        OfferId = offerId;
        OfferSnapshotTitle = offerSnapshotTitle;
        PassportPhotoPaths = passportPhotoPaths.ToList();
        SourceUtm = sourceUtm;
        SourceIp = sourceIp;
        SourceLocale = sourceLocale;
        ConsentAcceptedAtUtc = DateTime.UtcNow;
        PassportDataConsentAcceptedAtUtc = DateTime.UtcNow;
    }

    private static readonly Dictionary<TravelRequestStatus, TravelRequestStatus[]> AllowedTransitions = new()
    {
        [TravelRequestStatus.New] = [TravelRequestStatus.Contacted, TravelRequestStatus.Lost],
        [TravelRequestStatus.Contacted] = [TravelRequestStatus.Qualified, TravelRequestStatus.Lost],
        [TravelRequestStatus.Qualified] = [TravelRequestStatus.Won, TravelRequestStatus.Lost],
        [TravelRequestStatus.Won] = [],
        [TravelRequestStatus.Lost] = [],
    };

    public bool CanTransitionTo(TravelRequestStatus next) => AllowedTransitions[Status].Contains(next);

    public void TransitionTo(TravelRequestStatus next)
    {
        if (!CanTransitionTo(next))
            throw new InvalidOperationException($"Cannot transition TravelRequest from {Status} to {next}.");
        Status = next;
    }

    public void AssignTo(Guid? adminUserId) => AssignedAdminUserId = adminUserId;

    public void SetDealValue(decimal value, Currency currency)
    {
        DealValue = value;
        DealCurrency = currency;
    }

    public void SetNextFollowUp(DateTime? nextFollowUpAtUtc) => NextFollowUpAtUtc = nextFollowUpAtUtc;
}
