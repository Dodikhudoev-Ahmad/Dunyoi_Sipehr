using AeroTravel.Domain.Enums;

namespace AeroTravel.Application.Features.TravelRequests.Dtos;

public record CreateTravelRequestInput(
    string FullName, string Email, string Phone, Locale PreferredLocale,
    int PassengersAdults, int PassengersChildren, IReadOnlyList<int> ChildrenAges, string? Message,
    DateOnly DepartureDate, DateOnly? ReturnDate,
    Guid? DestinationId, Guid? OfferId, IReadOnlyList<string> PassportPhotoPaths, bool PassportDataConsentAccepted,
    string? SourceUtm, Locale SourceLocale,
    bool ConsentAccepted, string? Website);

public record TravelRequestListItemDto(
    Guid Id, DateTime CreatedAtUtc, TravelRequestStatus Status, string FullName, string Email, string Phone,
    DateOnly DepartureDate, DateOnly? ReturnDate,
    string? DestinationSnapshotTitle, string? OfferSnapshotTitle, Guid? AssignedAdminUserId);

public record TravelRequestDetailDto(
    Guid Id, DateTime CreatedAtUtc, TravelRequestStatus Status,
    string FullName, string Email, string Phone, Locale PreferredLocale,
    Guid? DestinationId, string? DestinationSnapshotTitle, Guid? OfferId, string? OfferSnapshotTitle,
    int PassengersAdults, int PassengersChildren, IReadOnlyList<int> ChildrenAges, string? Message,
    DateOnly DepartureDate, DateOnly? ReturnDate, IReadOnlyList<string> PassportPhotoPaths,
    DateTime ConsentAcceptedAtUtc, DateTime PassportDataConsentAcceptedAtUtc,
    string? SourceUtm, string? SourceIp, Locale SourceLocale,
    Guid? AssignedAdminUserId);
