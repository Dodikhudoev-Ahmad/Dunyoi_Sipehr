using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Content.Dtos;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Content.Queries;

public record ListPublicTestimonialsQuery(Locale Locale) : IRequest<Result<List<TestimonialDto>>>;

public class ListPublicTestimonialsQueryHandler(IReadDbContext db) : IRequestHandler<ListPublicTestimonialsQuery, Result<List<TestimonialDto>>>
{
    public async Task<Result<List<TestimonialDto>>> Handle(ListPublicTestimonialsQuery request, CancellationToken cancellationToken)
    {
        var items = await db.Testimonials.Where(t => t.IsPublished)
            .OrderBy(t => t.SortOrder)
            .Select(t => new
            {
                t.Id,
                t.AuthorName,
                t.AuthorCountry,
                t.AvatarUrl,
                t.Rating,
                Translation = t.Translations.FirstOrDefault(tr => tr.Locale == request.Locale) ?? t.Translations.FirstOrDefault(tr => tr.Locale == Locale.Ru)
            })
            .ToListAsync(cancellationToken);

        var dtos = items.Select(t => new TestimonialDto(t.Id, t.AuthorName, t.AuthorCountry, t.AvatarUrl, t.Rating, t.Translation?.Quote ?? "")).ToList();
        return Result.Success(dtos);
    }
}

public record ListPublicFaqQuery(Locale Locale) : IRequest<Result<List<FaqItemDto>>>;

public class ListPublicFaqQueryHandler(IReadDbContext db) : IRequestHandler<ListPublicFaqQuery, Result<List<FaqItemDto>>>
{
    public async Task<Result<List<FaqItemDto>>> Handle(ListPublicFaqQuery request, CancellationToken cancellationToken)
    {
        var items = await db.FaqItems.Where(f => f.IsPublished)
            .OrderBy(f => f.SortOrder)
            .Select(f => new
            {
                f.Id,
                f.Category,
                Translation = f.Translations.FirstOrDefault(t => t.Locale == request.Locale) ?? f.Translations.FirstOrDefault(t => t.Locale == Locale.Ru)
            })
            .ToListAsync(cancellationToken);

        var dtos = items.Select(f => new FaqItemDto(f.Id, f.Category, f.Translation?.Question ?? "", f.Translation?.Answer ?? "")).ToList();
        return Result.Success(dtos);
    }
}

public record GetPublicSiteContentByKeyQuery(string Key, Locale Locale) : IRequest<Result<SiteContentDto>>;

public class GetPublicSiteContentByKeyQueryHandler(IReadDbContext db) : IRequestHandler<GetPublicSiteContentByKeyQuery, Result<SiteContentDto>>
{
    public async Task<Result<SiteContentDto>> Handle(GetPublicSiteContentByKeyQuery request, CancellationToken cancellationToken)
    {
        var content = await db.SiteContents.Where(s => s.Key == request.Key)
            .Select(s => new
            {
                s.Id,
                s.Key,
                Translation = s.Translations.FirstOrDefault(t => t.Locale == request.Locale) ?? s.Translations.FirstOrDefault(t => t.Locale == Locale.Ru)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (content is null || content.Translation is null)
            return Result.Failure<SiteContentDto>(Error.NotFound("NOT_FOUND", "Site content not found."));

        return Result.Success(new SiteContentDto(content.Id, content.Key, content.Translation.Title, content.Translation.Body, content.Translation.ExtraJson));
    }
}
