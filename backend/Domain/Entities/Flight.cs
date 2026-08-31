using AeroTravel.Domain.Common;
using AeroTravel.Domain.Enums;

namespace AeroTravel.Domain.Entities;

/// A single chartered/booked flight the agency is running a group of clients on — not tied to
/// the public Destinations/Offers catalog (OriginCity/DestinationCity are free text) so this
/// module can't destabilize that existing model.
public class Flight : Entity
{
    public string FlightNumber { get; private set; } = default!;
    public string OriginCity { get; private set; } = default!;
    public string DestinationCity { get; private set; } = default!;
    public DateTime DepartureAtUtc { get; private set; }
    public FlightStatus Status { get; private set; } = FlightStatus.Scheduled;

    public Guid? CreatedByAdminUserId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private Flight() { }

    public Flight(string flightNumber, string originCity, string destinationCity, DateTime departureAtUtc, Guid? createdByAdminUserId)
    {
        FlightNumber = flightNumber;
        OriginCity = originCity;
        DestinationCity = destinationCity;
        DepartureAtUtc = departureAtUtc;
        CreatedByAdminUserId = createdByAdminUserId;
    }

    public void Update(string flightNumber, string originCity, string destinationCity, DateTime departureAtUtc, FlightStatus status)
    {
        FlightNumber = flightNumber;
        OriginCity = originCity;
        DestinationCity = destinationCity;
        DepartureAtUtc = departureAtUtc;
        Status = status;
    }
}
