using AeroTravel.Domain.Enums;

namespace AeroTravel.Application.Features.Destinations.Dtos;

public record DestinationListItemDto(Guid Id, string Slug, string Title, string Summary, string? HeroImageUrl, bool IsFeatured);

public record DestinationDetailDto(
    Guid Id, string Slug, string Title, string Summary, string Description,
    IReadOnlyList<string> Highlights, string? HeroImageUrl, IReadOnlyList<string> GalleryUrls,
    string CityName, string CountryName, bool IsFeatured);

public record DestinationTranslationInput(Locale Locale, string Title, string Summary, string Description, List<string> Highlights, string? MetaTitle, string? MetaDescription);

public record UpsertDestinationInput(
    Guid CityId, string Slug, string? HeroImageUrl, List<string> GalleryUrls,
    bool IsPublished, bool IsFeatured, int SortOrder,
    List<DestinationTranslationInput> Translations);

public record AdminDestinationListItemDto(Guid Id, string Slug, string CityName, bool IsPublished, bool IsFeatured, DateTime CreatedAtUtc);
