using AeroTravel.Domain.Common;
using AeroTravel.Domain.Enums;

namespace AeroTravel.Domain.Entities;

public class Destination : AuditableEntity
{
    public Guid CityId { get; private set; }
    public City? City { get; private set; }
    public string Slug { get; private set; } = default!;
    public string? HeroImageUrl { get; private set; }
    public List<string> GalleryUrls { get; private set; } = [];
    public bool IsFeatured { get; private set; }
    public bool IsPublished { get; private set; }
    public int SortOrder { get; private set; }
    public List<DestinationTranslation> Translations { get; private set; } = [];
    public List<Offer> Offers { get; private set; } = [];

    private Destination() { }

    public Destination(Guid cityId, string slug)
    {
        CityId = cityId;
        Slug = slug;
    }

    public void SetTranslation(Locale locale, string title, string summary, string description, IReadOnlyList<string> highlights, string? metaTitle = null, string? metaDescription = null)
    {
        var existing = Translations.FirstOrDefault(t => t.Locale == locale);
        if (existing is not null)
        {
            existing.Update(title, summary, description, highlights, metaTitle, metaDescription);
        }
        else
        {
            Translations.Add(new DestinationTranslation(Id, locale, title, summary, description, highlights, metaTitle, metaDescription));
        }
        Touch();
    }

    public void SetPublishState(bool isPublished, bool isFeatured)
    {
        IsPublished = isPublished;
        IsFeatured = isFeatured;
        Touch();
    }

    public void SetImages(string? heroImageUrl, IReadOnlyList<string> galleryUrls)
    {
        HeroImageUrl = heroImageUrl;
        GalleryUrls = galleryUrls.ToList();
        Touch();
    }

    public void SetSortOrder(int sortOrder) { SortOrder = sortOrder; Touch(); }
    public void SetSlug(string slug) { Slug = slug; Touch(); }
    public void SetCity(Guid cityId) { CityId = cityId; Touch(); }
}

public class DestinationTranslation
{
    public Guid DestinationId { get; private set; }
    public Locale Locale { get; private set; }
    public string Title { get; private set; } = default!;
    public string Summary { get; private set; } = default!;
    public string Description { get; private set; } = default!;
    public List<string> Highlights { get; private set; } = [];
    public string? MetaTitle { get; private set; }
    public string? MetaDescription { get; private set; }

    private DestinationTranslation() { }

    public DestinationTranslation(Guid destinationId, Locale locale, string title, string summary, string description, IReadOnlyList<string> highlights, string? metaTitle, string? metaDescription)
    {
        DestinationId = destinationId;
        Locale = locale;
        Update(title, summary, description, highlights, metaTitle, metaDescription);
    }

    public void Update(string title, string summary, string description, IReadOnlyList<string> highlights, string? metaTitle, string? metaDescription)
    {
        Title = title;
        Summary = summary;
        Description = description;
        Highlights = highlights.ToList();
        MetaTitle = metaTitle;
        MetaDescription = metaDescription;
    }
}

public class Service : AuditableEntity
{
    public string Icon { get; private set; } = default!;
    public bool IsPublished { get; private set; }
    public int SortOrder { get; private set; }
    public List<ServiceTranslation> Translations { get; private set; } = [];
    public List<OfferService> OfferServices { get; private set; } = [];

    private Service() { }

    public Service(string icon) => Icon = icon;

    public void SetTranslation(Locale locale, string name, string description)
    {
        var existing = Translations.FirstOrDefault(t => t.Locale == locale);
        if (existing is not null) existing.Update(name, description);
        else Translations.Add(new ServiceTranslation(Id, locale, name, description));
        Touch();
    }

    public void SetPublishState(bool isPublished) { IsPublished = isPublished; Touch(); }
    public void SetSortOrder(int sortOrder) { SortOrder = sortOrder; Touch(); }
    public void SetIcon(string icon) { Icon = icon; Touch(); }
}

public class ServiceTranslation
{
    public Guid ServiceId { get; private set; }
    public Locale Locale { get; private set; }
    public string Name { get; private set; } = default!;
    public string Description { get; private set; } = default!;

    private ServiceTranslation() { }

    public ServiceTranslation(Guid serviceId, Locale locale, string name, string description)
    {
        ServiceId = serviceId;
        Locale = locale;
        Update(name, description);
    }

    public void Update(string name, string description)
    {
        Name = name;
        Description = description;
    }
}

public class Offer : AuditableEntity
{
    public Guid? DestinationId { get; private set; }
    public Destination? Destination { get; private set; }
    public string Slug { get; private set; } = default!;
    public decimal PriceFrom { get; private set; }
    public Currency Currency { get; private set; }
    public int? DurationDays { get; private set; }
    public List<string> GalleryUrls { get; private set; } = [];
    public DateTime? ValidUntilUtc { get; private set; }
    public bool IsFeatured { get; private set; }
    public bool IsPublished { get; private set; }
    public int SortOrder { get; private set; }
    public List<OfferTranslation> Translations { get; private set; } = [];
    public List<OfferService> OfferServices { get; private set; } = [];

    private Offer() { }

    public Offer(string slug, decimal priceFrom, Currency currency, Guid? destinationId = null)
    {
        Slug = slug;
        PriceFrom = priceFrom;
        Currency = currency;
        DestinationId = destinationId;
    }

    public void SetTranslation(Locale locale, string title, string summary, string description, string? metaTitle = null, string? metaDescription = null)
    {
        var existing = Translations.FirstOrDefault(t => t.Locale == locale);
        if (existing is not null) existing.Update(title, summary, description, metaTitle, metaDescription);
        else Translations.Add(new OfferTranslation(Id, locale, title, summary, description, metaTitle, metaDescription));
        Touch();
    }

    public void SetPublishState(bool isPublished, bool isFeatured) { IsPublished = isPublished; IsFeatured = isFeatured; Touch(); }
    public void SetPricing(decimal priceFrom, Currency currency, int? durationDays, DateTime? validUntilUtc)
    {
        PriceFrom = priceFrom;
        Currency = currency;
        DurationDays = durationDays;
        ValidUntilUtc = validUntilUtc;
        Touch();
    }

    public void SetSlug(string slug) { Slug = slug; Touch(); }
    public void SetSortOrder(int sortOrder) { SortOrder = sortOrder; Touch(); }
    public void SetDestination(Guid? destinationId) { DestinationId = destinationId; Touch(); }
    public void SetImages(IReadOnlyList<string> galleryUrls) { GalleryUrls = galleryUrls.ToList(); Touch(); }

    public void SetServices(IReadOnlyList<Guid> serviceIds)
    {
        OfferServices.Clear();
        foreach (var serviceId in serviceIds.Distinct())
            OfferServices.Add(new OfferService(Id, serviceId));
        Touch();
    }
}

public class OfferTranslation
{
    public Guid OfferId { get; private set; }
    public Locale Locale { get; private set; }
    public string Title { get; private set; } = default!;
    public string Summary { get; private set; } = default!;
    public string Description { get; private set; } = default!;
    public string? MetaTitle { get; private set; }
    public string? MetaDescription { get; private set; }

    private OfferTranslation() { }

    public OfferTranslation(Guid offerId, Locale locale, string title, string summary, string description, string? metaTitle, string? metaDescription)
    {
        OfferId = offerId;
        Locale = locale;
        Update(title, summary, description, metaTitle, metaDescription);
    }

    public void Update(string title, string summary, string description, string? metaTitle, string? metaDescription)
    {
        Title = title;
        Summary = summary;
        Description = description;
        MetaTitle = metaTitle;
        MetaDescription = metaDescription;
    }
}

public class OfferService
{
    public Guid OfferId { get; private set; }
    public Guid ServiceId { get; private set; }

    private OfferService() { }
    public OfferService(Guid offerId, Guid serviceId)
    {
        OfferId = offerId;
        ServiceId = serviceId;
    }
}
