using AeroTravel.Domain.Enums;

namespace AeroTravel.Application.Features.Countries.Dtos;

public record CountryDto(Guid Id, string IsoCode, string Name, int SortOrder);
public record CountryTranslationInput(Locale Locale, string Name);
public record UpsertCountryInput(string IsoCode, int SortOrder, List<CountryTranslationInput> Translations);
public record AdminCountryDto(Guid Id, string IsoCode, int SortOrder, List<CountryTranslationInput> Translations);
