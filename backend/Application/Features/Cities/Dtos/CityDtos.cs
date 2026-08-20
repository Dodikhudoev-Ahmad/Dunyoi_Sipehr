using AeroTravel.Domain.Enums;

namespace AeroTravel.Application.Features.Cities.Dtos;

public record CityDto(Guid Id, Guid CountryId, string Name, int SortOrder);
public record CityTranslationInput(Locale Locale, string Name);
public record UpsertCityInput(Guid CountryId, int SortOrder, List<CityTranslationInput> Translations);
public record AdminCityDto(Guid Id, Guid CountryId, int SortOrder, List<CityTranslationInput> Translations);
