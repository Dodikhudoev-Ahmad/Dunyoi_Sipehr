using AeroTravel.Domain.Enums;

namespace AeroTravel.Application.Features.Content.Dtos;

public record TestimonialDto(Guid Id, string AuthorName, string AuthorCountry, string? AvatarUrl, int Rating, string Quote);
public record TestimonialTranslationInput(Locale Locale, string Quote);
public record UpsertTestimonialInput(string AuthorName, string AuthorCountry, string? AvatarUrl, int Rating, bool IsPublished, int SortOrder, List<TestimonialTranslationInput> Translations);
public record AdminTestimonialDto(Guid Id, string AuthorName, string AuthorCountry, string? AvatarUrl, int Rating, bool IsPublished, int SortOrder, List<TestimonialTranslationInput> Translations);

public record FaqItemDto(Guid Id, string Category, string Question, string Answer);
public record FaqItemTranslationInput(Locale Locale, string Question, string Answer);
public record UpsertFaqItemInput(string Category, bool IsPublished, int SortOrder, List<FaqItemTranslationInput> Translations);
public record AdminFaqItemDto(Guid Id, string Category, bool IsPublished, int SortOrder, List<FaqItemTranslationInput> Translations);

public record SiteContentDto(Guid Id, string Key, string Title, string Body, string? ExtraJson);
public record SiteContentTranslationInput(Locale Locale, string Title, string Body, string? ExtraJson);
public record UpsertSiteContentInput(string Key, List<SiteContentTranslationInput> Translations);
public record AdminSiteContentDto(Guid Id, string Key, List<SiteContentTranslationInput> Translations);
