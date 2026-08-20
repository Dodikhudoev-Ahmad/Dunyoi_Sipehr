using AeroTravel.Domain.Common;
using AeroTravel.Domain.Enums;

namespace AeroTravel.Domain.Entities;

public class Country : Entity
{
    public string IsoCode { get; private set; } = default!;
    public int SortOrder { get; private set; }
    public List<CountryTranslation> Translations { get; private set; } = [];
    public List<City> Cities { get; private set; } = [];

    private Country() { }

    public Country(string isoCode, int sortOrder = 0)
    {
        IsoCode = isoCode.ToUpperInvariant();
        SortOrder = sortOrder;
    }

    public void SetTranslation(Locale locale, string name)
    {
        var existing = Translations.FirstOrDefault(t => t.Locale == locale);
        if (existing is not null)
        {
            existing.Update(name);
            return;
        }
        Translations.Add(new CountryTranslation(Id, locale, name));
    }

    public void Update(string isoCode, int sortOrder)
    {
        IsoCode = isoCode.ToUpperInvariant();
        SortOrder = sortOrder;
    }
}

public class CountryTranslation
{
    public Guid CountryId { get; private set; }
    public Locale Locale { get; private set; }
    public string Name { get; private set; } = default!;

    private CountryTranslation() { }

    public CountryTranslation(Guid countryId, Locale locale, string name)
    {
        CountryId = countryId;
        Locale = locale;
        Name = name;
    }

    public void Update(string name) => Name = name;
}

public class City : Entity
{
    public Guid CountryId { get; private set; }
    public Country? Country { get; private set; }
    public int SortOrder { get; private set; }
    public List<CityTranslation> Translations { get; private set; } = [];

    private City() { }

    public City(Guid countryId, int sortOrder = 0)
    {
        CountryId = countryId;
        SortOrder = sortOrder;
    }

    public void SetTranslation(Locale locale, string name)
    {
        var existing = Translations.FirstOrDefault(t => t.Locale == locale);
        if (existing is not null)
        {
            existing.Update(name);
            return;
        }
        Translations.Add(new CityTranslation(Id, locale, name));
    }

    public void Update(Guid countryId, int sortOrder)
    {
        CountryId = countryId;
        SortOrder = sortOrder;
    }
}

public class CityTranslation
{
    public Guid CityId { get; private set; }
    public Locale Locale { get; private set; }
    public string Name { get; private set; } = default!;

    private CityTranslation() { }

    public CityTranslation(Guid cityId, Locale locale, string name)
    {
        CityId = cityId;
        Locale = locale;
        Name = name;
    }

    public void Update(string name) => Name = name;
}
