using AeroTravel.Domain.Enums;

namespace AeroTravel.Application.Features.Flights.Dtos;

public record UpsertFlightInput(string FlightNumber, string OriginCity, string DestinationCity, DateTime DepartureAtUtc, FlightStatus Status);

public record FlightListItemDto(
    Guid Id, string FlightNumber, string OriginCity, string DestinationCity, DateTime DepartureAtUtc, FlightStatus Status,
    int PassengerCount, DateTime CreatedAtUtc);

public record FlightDetailDto(
    Guid Id, string FlightNumber, string OriginCity, string DestinationCity, DateTime DepartureAtUtc, FlightStatus Status,
    Guid? CreatedByAdminUserId, string? CreatedByAdminDisplayName, DateTime CreatedAtUtc);

public record FlightPassengerDto(
    Guid Id, Guid FlightId, FlightPassengerSource Source, Guid? TravelRequestId, string FullName, string Phone,
    Guid? AddedByAdminUserId, string? AddedByAdminDisplayName, DateTime AddedAtUtc);

/// One row of the cross-flight registry (GET /admin/passengers) — same passenger fields as
/// FlightPassengerDto plus the flight it belongs to, since that's the whole point of the view.
public record PassengerRegistryItemDto(
    Guid Id, Guid FlightId, string FlightNumber, DateTime FlightDepartureAtUtc,
    FlightPassengerSource Source, Guid? TravelRequestId, string FullName, string Phone,
    Guid? AddedByAdminUserId, string? AddedByAdminDisplayName, DateTime AddedAtUtc);

public record AddManualPassengerInput(string FullName, string Phone);
public record AddPassengerFromRequestInput(Guid TravelRequestId, string FullName, string Phone);
