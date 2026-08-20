using System.Linq.Expressions;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Content.Dtos;
using AeroTravel.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Content.Queries;

public record ListAdminTestimonialsQuery(
    int Page, int PageSize, string? SortBy = null, string? SortDir = null,
    bool? IsPublished = null, string? Search = null) : IRequest<Result<PagedResult<AdminTestimonialDto>>>;

public class ListAdminTestimonialsQueryHandler(IReadDbContext db) : IRequestHandler<ListAdminTestimonialsQuery, Result<PagedResult<AdminTestimonialDto>>>
{
    public static readonly IReadOnlyDictionary<string, Expression<Func<Testimonial, object?>>> SortWhitelist = new Dictionary<string, Expression<Func<Testimonial, object?>>>
    {
        ["sortOrder"] = t => t.SortOrder,
        ["rating"] = t => t.Rating,
        ["authorName"] = t => t.AuthorName,
        ["isPublished"] = t => t.IsPublished,
    };

    public async Task<Result<PagedResult<AdminTestimonialDto>>> Handle(ListAdminTestimonialsQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;
        var query = db.Testimonials.AsQueryable();
        if (request.IsPublished is { } isPublished) query = query.Where(t => t.IsPublished == isPublished);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(t => t.AuthorName.Contains(term));
        }
        query = query.ApplySort(request.SortBy, request.SortDir, SortWhitelist, "sortOrder");
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => new AdminTestimonialDto(t.Id, t.AuthorName, t.AuthorCountry, t.AvatarUrl, t.Rating, t.IsPublished, t.SortOrder,
                t.Translations.Select(tr => new TestimonialTranslationInput(tr.Locale, tr.Quote)).ToList()))
            .ToListAsync(cancellationToken);
        return Result.Success(new PagedResult<AdminTestimonialDto>(items, page, pageSize, total));
    }
}

public record GetAdminTestimonialByIdQuery(Guid Id) : IRequest<Result<AdminTestimonialDto>>;

public class GetAdminTestimonialByIdQueryHandler(IReadDbContext db) : IRequestHandler<GetAdminTestimonialByIdQuery, Result<AdminTestimonialDto>>
{
    public async Task<Result<AdminTestimonialDto>> Handle(GetAdminTestimonialByIdQuery request, CancellationToken cancellationToken)
    {
        var dto = await db.Testimonials.Where(t => t.Id == request.Id)
            .Select(t => new AdminTestimonialDto(t.Id, t.AuthorName, t.AuthorCountry, t.AvatarUrl, t.Rating, t.IsPublished, t.SortOrder,
                t.Translations.Select(tr => new TestimonialTranslationInput(tr.Locale, tr.Quote)).ToList()))
            .FirstOrDefaultAsync(cancellationToken);
        return dto is null
            ? Result.Failure<AdminTestimonialDto>(Error.NotFound("NOT_FOUND", "Testimonial not found."))
            : Result.Success(dto);
    }
}

public record ListAdminFaqQuery(
    int Page, int PageSize, string? SortBy = null, string? SortDir = null,
    bool? IsPublished = null, string? Category = null) : IRequest<Result<PagedResult<AdminFaqItemDto>>>;

public class ListAdminFaqQueryHandler(IReadDbContext db) : IRequestHandler<ListAdminFaqQuery, Result<PagedResult<AdminFaqItemDto>>>
{
    public static readonly IReadOnlyDictionary<string, Expression<Func<FaqItem, object?>>> SortWhitelist = new Dictionary<string, Expression<Func<FaqItem, object?>>>
    {
        ["sortOrder"] = f => f.SortOrder,
        ["category"] = f => f.Category,
        ["isPublished"] = f => f.IsPublished,
    };

    public async Task<Result<PagedResult<AdminFaqItemDto>>> Handle(ListAdminFaqQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;
        var query = db.FaqItems.AsQueryable();
        if (request.IsPublished is { } isPublished) query = query.Where(f => f.IsPublished == isPublished);
        if (!string.IsNullOrWhiteSpace(request.Category)) query = query.Where(f => f.Category == request.Category);
        query = query.ApplySort(request.SortBy, request.SortDir, SortWhitelist, "sortOrder");
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(f => new AdminFaqItemDto(f.Id, f.Category, f.IsPublished, f.SortOrder,
                f.Translations.Select(t => new FaqItemTranslationInput(t.Locale, t.Question, t.Answer)).ToList()))
            .ToListAsync(cancellationToken);
        return Result.Success(new PagedResult<AdminFaqItemDto>(items, page, pageSize, total));
    }
}

public record GetAdminFaqByIdQuery(Guid Id) : IRequest<Result<AdminFaqItemDto>>;

public class GetAdminFaqByIdQueryHandler(IReadDbContext db) : IRequestHandler<GetAdminFaqByIdQuery, Result<AdminFaqItemDto>>
{
    public async Task<Result<AdminFaqItemDto>> Handle(GetAdminFaqByIdQuery request, CancellationToken cancellationToken)
    {
        var dto = await db.FaqItems.Where(f => f.Id == request.Id)
            .Select(f => new AdminFaqItemDto(f.Id, f.Category, f.IsPublished, f.SortOrder,
                f.Translations.Select(t => new FaqItemTranslationInput(t.Locale, t.Question, t.Answer)).ToList()))
            .FirstOrDefaultAsync(cancellationToken);
        return dto is null
            ? Result.Failure<AdminFaqItemDto>(Error.NotFound("NOT_FOUND", "FAQ item not found."))
            : Result.Success(dto);
    }
}

public record ListAdminSiteContentQuery(
    int Page, int PageSize, string? SortBy = null, string? SortDir = null, string? Search = null)
    : IRequest<Result<PagedResult<AdminSiteContentDto>>>;

public class ListAdminSiteContentQueryHandler(IReadDbContext db) : IRequestHandler<ListAdminSiteContentQuery, Result<PagedResult<AdminSiteContentDto>>>
{
    public static readonly IReadOnlyDictionary<string, Expression<Func<SiteContent, object?>>> SortWhitelist = new Dictionary<string, Expression<Func<SiteContent, object?>>>
    {
        ["key"] = s => s.Key,
    };

    public async Task<Result<PagedResult<AdminSiteContentDto>>> Handle(ListAdminSiteContentQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;
        var query = db.SiteContents.AsQueryable();
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(s => s.Key.Contains(term));
        }
        query = query.ApplySort(request.SortBy, request.SortDir, SortWhitelist, "key");
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(s => new AdminSiteContentDto(s.Id, s.Key,
                s.Translations.Select(t => new SiteContentTranslationInput(t.Locale, t.Title, t.Body, t.ExtraJson)).ToList()))
            .ToListAsync(cancellationToken);
        return Result.Success(new PagedResult<AdminSiteContentDto>(items, page, pageSize, total));
    }
}

public record GetAdminSiteContentByIdQuery(Guid Id) : IRequest<Result<AdminSiteContentDto>>;

public class GetAdminSiteContentByIdQueryHandler(IReadDbContext db) : IRequestHandler<GetAdminSiteContentByIdQuery, Result<AdminSiteContentDto>>
{
    public async Task<Result<AdminSiteContentDto>> Handle(GetAdminSiteContentByIdQuery request, CancellationToken cancellationToken)
    {
        var dto = await db.SiteContents.Where(s => s.Id == request.Id)
            .Select(s => new AdminSiteContentDto(s.Id, s.Key,
                s.Translations.Select(t => new SiteContentTranslationInput(t.Locale, t.Title, t.Body, t.ExtraJson)).ToList()))
            .FirstOrDefaultAsync(cancellationToken);
        return dto is null
            ? Result.Failure<AdminSiteContentDto>(Error.NotFound("NOT_FOUND", "Site content not found."))
            : Result.Success(dto);
    }
}
