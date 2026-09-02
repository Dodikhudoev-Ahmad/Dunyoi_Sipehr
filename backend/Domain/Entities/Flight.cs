using AeroTravel.Domain.Common;
using AeroTravel.Domain.Enums;

namespace AeroTravel.Domain.Entities;

/// A single chartered/booked flight the agency is running a group of clients on. Origin/
/// destination are FKs into the existing City catalog (not the public Destinations/Offers
/// catalog — a flight isn't a marketing "destination", just an airport pair) so admins pick from
/// a controlled list instead of free-typing a city name a second time with its own spelling.
public class Flight : Entity
{
    public string FlightNumber { get; private set; } = default!;
    public Guid OriginCityId { get; private set; }
    public Guid DestinationCityId { get; private set; }
    public DateTime DepartureAtUtc { get; private set; }
    public FlightStatus Status { get; private set; } = FlightStatus.Scheduled;

    public Guid? CreatedByAdminUserId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private Flight() { }

    public Flight(string flightNumber, Guid originCityId, Guid destinationCityId, DateTime departureAtUtc, Guid? createdByAdminUserId)
    {
        FlightNumber = flightNumber;
        OriginCityId = originCityId;
        DestinationCityId = destinationCityId;
        DepartureAtUtc = departureAtUtc;
        CreatedByAdminUserId = createdByAdminUserId;
    }

    public void Update(string flightNumber, Guid originCityId, Guid destinationCityId, DateTime departureAtUtc, FlightStatus status)
    {
        FlightNumber = flightNumber;
        OriginCityId = originCityId;
        DestinationCityId = destinationCityId;
        DepartureAtUtc = departureAtUtc;
        Status = status;
    }
}
