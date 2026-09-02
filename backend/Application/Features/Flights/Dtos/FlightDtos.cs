using AeroTravel.Domain.Enums;

namespace AeroTravel.Application.Features.Flights.Dtos;

public record UpsertFlightInput(string FlightNumber, Guid OriginCityId, Guid DestinationCityId, DateTime DepartureAtUtc, FlightStatus Status);

/// OriginCity/DestinationCity are the resolved ru-locale city names (admin UI is ru-only), kept
/// alongside the raw ids so list/detail views can render the route as text without a second
/// lookup, while the edit form still has the ids to pre-select the right dropdown option.
public record FlightListItemDto(
    Guid Id, string FlightNumber, Guid OriginCityId, string OriginCity, Guid DestinationCityId, string DestinationCity,
    DateTime DepartureAtUtc, FlightStatus Status, int PassengerCount, DateTime CreatedAtUtc);

public record FlightDetailDto(
    Guid Id, string FlightNumber, Guid OriginCityId, string OriginCity, Guid DestinationCityId, string DestinationCity,
    DateTime DepartureAtUtc, FlightStatus Status,
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

/// Null when no existing flight number has a parseable trailing numeric part to increment from
/// (empty catalog, or every number so far is non-numeric) — the create form just starts blank
/// in that case rather than guessing a made-up starting number.
public record NextFlightNumberDto(string? SuggestedNumber);
