using AeroTravel.Domain.Common;
using AeroTravel.Domain.Enums;

namespace AeroTravel.Domain.Entities;

public class Testimonial : Entity
{
    public string AuthorName { get; private set; } = default!;
    public string AuthorCountry { get; private set; } = default!;
    public string? AvatarUrl { get; private set; }
    public int Rating { get; private set; }
    public bool IsPublished { get; private set; }
    public int SortOrder { get; private set; }
    public List<TestimonialTranslation> Translations { get; private set; } = [];

    private Testimonial() { }

    public Testimonial(string authorName, string authorCountry, int rating)
    {
        AuthorName = authorName;
        AuthorCountry = authorCountry;
        Rating = Math.Clamp(rating, 1, 5);
    }

    public void SetTranslation(Locale locale, string quote)
    {
        var existing = Translations.FirstOrDefault(t => t.Locale == locale);
        if (existing is not null) existing.Update(quote);
        else Translations.Add(new TestimonialTranslation(Id, locale, quote));
    }

    public void SetPublishState(bool isPublished) => IsPublished = isPublished;
    public void SetAvatar(string? avatarUrl) => AvatarUrl = avatarUrl;
    public void SetSortOrder(int sortOrder) => SortOrder = sortOrder;

    public void UpdateAuthor(string authorName, string authorCountry, int rating)
    {
        AuthorName = authorName;
        AuthorCountry = authorCountry;
        Rating = Math.Clamp(rating, 1, 5);
    }
}

public class TestimonialTranslation
{
    public Guid TestimonialId { get; private set; }
    public Locale Locale { get; private set; }
    public string Quote { get; private set; } = default!;

    private TestimonialTranslation() { }
    public TestimonialTranslation(Guid testimonialId, Locale locale, string quote)
    {
        TestimonialId = testimonialId;
        Locale = locale;
        Quote = quote;
    }
    public void Update(string quote) => Quote = quote;
}

public class FaqItem : Entity
{
    public string Category { get; private set; } = default!;
    public int SortOrder { get; private set; }
    public bool IsPublished { get; private set; }
    public List<FaqItemTranslation> Translations { get; private set; } = [];

    private FaqItem() { }
    public FaqItem(string category) => Category = category;

    public void SetTranslation(Locale locale, string question, string answer)
    {
        var existing = Translations.FirstOrDefault(t => t.Locale == locale);
        if (existing is not null) existing.Update(question, answer);
        else Translations.Add(new FaqItemTranslation(Id, locale, question, answer));
    }

    public void SetPublishState(bool isPublished) => IsPublished = isPublished;
    public void SetSortOrder(int sortOrder) => SortOrder = sortOrder;
    public void SetCategory(string category) => Category = category;
}

public class FaqItemTranslation
{
    public Guid FaqItemId { get; private set; }
    public Locale Locale { get; private set; }
    public string Question { get; private set; } = default!;
    public string Answer { get; private set; } = default!;

    private FaqItemTranslation() { }
    public FaqItemTranslation(Guid faqItemId, Locale locale, string question, string answer)
    {
        FaqItemId = faqItemId;
        Locale = locale;
        Update(question, answer);
    }
    public void Update(string question, string answer)
    {
        Question = question;
        Answer = answer;
    }
}

public class SiteContent : Entity
{
    public string Key { get; private set; } = default!;
    public List<SiteContentTranslation> Translations { get; private set; } = [];

    private SiteContent() { }
    public SiteContent(string key) => Key = key;

    public void SetTranslation(Locale locale, string title, string body, string? extraJson = null)
    {
        var existing = Translations.FirstOrDefault(t => t.Locale == locale);
        if (existing is not null) existing.Update(title, body, extraJson);
        else Translations.Add(new SiteContentTranslation(Id, locale, title, body, extraJson));
    }
}

public class SiteContentTranslation
{
    public Guid SiteContentId { get; private set; }
    public Locale Locale { get; private set; }
    public string Title { get; private set; } = default!;
    public string Body { get; private set; } = default!;
    public string? ExtraJson { get; private set; }

    private SiteContentTranslation() { }
    public SiteContentTranslation(Guid siteContentId, Locale locale, string title, string body, string? extraJson)
    {
        SiteContentId = siteContentId;
        Locale = locale;
        Update(title, body, extraJson);
    }
    public void Update(string title, string body, string? extraJson)
    {
        Title = title;
        Body = body;
        ExtraJson = extraJson;
    }
}
