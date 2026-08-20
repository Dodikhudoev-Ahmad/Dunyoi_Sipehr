using AeroTravel.Domain.Enums;

namespace AeroTravel.Application.Features.Services.Dtos;

public record ServiceDto(Guid Id, string Icon, string Name, string Description);
public record ServiceTranslationInput(Locale Locale, string Name, string Description);
public record UpsertServiceInput(string Icon, bool IsPublished, int SortOrder, List<ServiceTranslationInput> Translations);
public record AdminServiceDto(Guid Id, string Icon, bool IsPublished, int SortOrder, List<ServiceTranslationInput> Translations);
