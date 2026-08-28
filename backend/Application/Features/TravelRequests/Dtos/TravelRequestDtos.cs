using AeroTravel.Domain.Enums;

namespace AeroTravel.Application.Features.TravelRequests.Dtos;

public record TravelRequestNoteDto(Guid Id, Guid TravelRequestId, string Text, DateTime CreatedAtUtc, Guid AuthorAdminUserId, string AuthorDisplayName);

public record CreateTravelRequestInput(
    string LastName, string FirstName, string? MiddleName, string Phone, Locale PreferredLocale,
    int PassengersAdults, int PassengersChildren, IReadOnlyList<int> ChildrenAges, string? Message,
    DateOnly DepartureDate, DateOnly? ReturnDate,
    Guid? DestinationId, Guid? OfferId, IReadOnlyList<string> PassportPhotoPaths, bool PassportDataConsentAccepted,
    string? SourceUtm, Locale SourceLocale,
    bool ConsentAccepted, string? Website);

public record TravelRequestListItemDto(
    Guid Id, DateTime CreatedAtUtc, TravelRequestStatus Status, string LastName, string FirstName, string? MiddleName, string Phone,
    DateOnly DepartureDate, DateOnly? ReturnDate,
    string? DestinationSnapshotTitle, string? OfferSnapshotTitle, Guid? AssignedAdminUserId, string? AssignedAdminDisplayName,
    decimal? DealValue, Currency? DealCurrency, DateTime? NextFollowUpAtUtc);

public record TravelRequestDetailDto(
    Guid Id, DateTime CreatedAtUtc, TravelRequestStatus Status,
    string LastName, string FirstName, string? MiddleName, string Phone, Locale PreferredLocale,
    Guid? DestinationId, string? DestinationSnapshotTitle, Guid? OfferId, string? OfferSnapshotTitle,
    int PassengersAdults, int PassengersChildren, IReadOnlyList<int> ChildrenAges, string? Message,
    DateOnly DepartureDate, DateOnly? ReturnDate, IReadOnlyList<string> PassportPhotoPaths,
    DateTime ConsentAcceptedAtUtc, DateTime PassportDataConsentAcceptedAtUtc,
    string? SourceUtm, string? SourceIp, Locale SourceLocale,
    Guid? AssignedAdminUserId, string? AssignedAdminDisplayName,
    decimal? DealValue, Currency? DealCurrency, DateTime? NextFollowUpAtUtc);
