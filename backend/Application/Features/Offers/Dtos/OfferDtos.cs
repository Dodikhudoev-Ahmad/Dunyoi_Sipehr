using AeroTravel.Domain.Enums;

namespace AeroTravel.Application.Features.Offers.Dtos;

public record OfferListItemDto(Guid Id, string Slug, string Title, string Summary, decimal PriceFrom, Currency Currency, int? DurationDays, string? HeroImageUrl, bool IsFeatured);

public record OfferDetailDto(
    Guid Id, string Slug, string Title, string Summary, string Description,
    decimal PriceFrom, Currency Currency, int? DurationDays, DateTime? ValidUntilUtc,
    IReadOnlyList<string> GalleryUrls, bool IsFeatured, Guid? DestinationId, string? DestinationTitle,
    IReadOnlyList<Guid> ServiceIds);

public record OfferTranslationInput(Locale Locale, string Title, string Summary, string Description, string? MetaTitle, string? MetaDescription);

public record UpsertOfferInput(
    Guid? DestinationId, string Slug, decimal PriceFrom, Currency Currency, int? DurationDays,
    List<string> GalleryUrls, DateTime? ValidUntilUtc, bool IsPublished, bool IsFeatured, int SortOrder,
    List<Guid> ServiceIds, List<OfferTranslationInput> Translations);

public record AdminOfferListItemDto(Guid Id, string Slug, decimal PriceFrom, Currency Currency, bool IsPublished, bool IsFeatured, DateTime CreatedAtUtc);
