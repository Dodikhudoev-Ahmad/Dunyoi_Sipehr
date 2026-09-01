using AeroTravel.Domain.Common;
using AeroTravel.Domain.Enums;

namespace AeroTravel.Domain.Entities;

/// One passenger manifest entry on a Flight — either entered by hand or pulled from an existing
/// CRM TravelRequest (FullName/Phone are copied in at add-time either way, editable afterwards,
/// so this manifest doesn't silently change if the source TravelRequest is later edited).
public class FlightPassenger : Entity
{
    public Guid FlightId { get; private set; }
    public FlightPassengerSource Source { get; private set; }
    public Guid? TravelRequestId { get; private set; }
    public string FullName { get; private set; } = default!;
    public string Phone { get; private set; } = default!;
    public Guid? AddedByAdminUserId { get; private set; }
    public DateTime AddedAtUtc { get; private set; } = DateTime.UtcNow;

    private FlightPassenger() { }

    public FlightPassenger(Guid flightId, FlightPassengerSource source, Guid? travelRequestId, string fullName, string phone, Guid? addedByAdminUserId)
    {
        FlightId = flightId;
        Source = source;
        TravelRequestId = travelRequestId;
        FullName = fullName;
        Phone = phone;
        AddedByAdminUserId = addedByAdminUserId;
    }

    /// Moves this manifest entry to a different flight (SuperAdmin-only, see
    /// TransferFlightPassengerCommand) — Source/TravelRequestId/AddedBy stay as originally
    /// recorded; only which flight this passenger is on changes.
    public void TransferToFlight(Guid newFlightId) => FlightId = newFlightId;
}
