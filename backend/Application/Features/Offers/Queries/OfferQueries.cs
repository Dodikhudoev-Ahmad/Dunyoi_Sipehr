using System.Linq.Expressions;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Offers.Dtos;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Offers.Queries;

public record ListPublicOffersQuery(Locale Locale, Guid? DestinationId, bool? Featured, int Page, int PageSize)
    : IRequest<Result<PagedResult<OfferListItemDto>>>;

public class ListPublicOffersQueryHandler(IReadDbContext db) : IRequestHandler<ListPublicOffersQuery, Result<PagedResult<OfferListItemDto>>>
{
    public async Task<Result<PagedResult<OfferListItemDto>>> Handle(ListPublicOffersQuery request, CancellationToken cancellationToken)
    {
        var query = db.Offers.Where(o => o.IsPublished);
        if (request.DestinationId is { } destId) query = query.Where(o => o.DestinationId == destId);
        if (request.Featured is { } featured) query = query.Where(o => o.IsFeatured == featured);

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(o => o.SortOrder).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(o => new
            {
                o.Id,
                o.Slug,
                o.PriceFrom,
                o.Currency,
                o.DurationDays,
                o.GalleryUrls,
                o.IsFeatured,
                Translation = o.Translations.FirstOrDefault(t => t.Locale == request.Locale) ?? o.Translations.FirstOrDefault(t => t.Locale == Locale.Ru)
            })
            .ToListAsync(cancellationToken);

        var dtos = items.Select(o => new OfferListItemDto(
            o.Id, o.Slug, o.Translation!.Title, o.Translation.Summary, o.PriceFrom, o.Currency, o.DurationDays,
            o.GalleryUrls.FirstOrDefault(), o.IsFeatured)).ToList();

        return Result.Success(new PagedResult<OfferListItemDto>(dtos, page, pageSize, total));
    }
}

public record GetPublicOfferBySlugQuery(string Slug, Locale Locale) : IRequest<Result<OfferDetailDto>>;

public class GetPublicOfferBySlugQueryHandler(IReadDbContext db) : IRequestHandler<GetPublicOfferBySlugQuery, Result<OfferDetailDto>>
{
    public async Task<Result<OfferDetailDto>> Handle(GetPublicOfferBySlugQuery request, CancellationToken cancellationToken)
    {
        var offer = await db.Offers.Where(o => o.Slug == request.Slug && o.IsPublished)
            .Select(o => new
            {
                o.Id,
                o.Slug,
                o.PriceFrom,
                o.Currency,
                o.DurationDays,
                o.ValidUntilUtc,
                o.GalleryUrls,
                o.IsFeatured,
                o.DestinationId,
                DestinationTitle = o.Destination!.Translations.FirstOrDefault(t => t.Locale == request.Locale) ?? o.Destination!.Translations.FirstOrDefault(t => t.Locale == Locale.Ru),
                ServiceIds = o.OfferServices.Select(os => os.ServiceId).ToList(),
                Translation = o.Translations.FirstOrDefault(t => t.Locale == request.Locale) ?? o.Translations.FirstOrDefault(t => t.Locale == Locale.Ru)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (offer is null)
            return Result.Failure<OfferDetailDto>(Error.NotFound("NOT_FOUND", "Offer not found."));

        return Result.Success(new OfferDetailDto(
            offer.Id, offer.Slug, offer.Translation!.Title, offer.Translation.Summary, offer.Translation.Description,
            offer.PriceFrom, offer.Currency, offer.DurationDays, offer.ValidUntilUtc, offer.GalleryUrls, offer.IsFeatured,
            offer.DestinationId, offer.DestinationTitle?.Title, offer.ServiceIds));
    }
}

public record ListAdminOffersQuery(
    int Page, int PageSize, string? SortBy = null, string? SortDir = null,
    bool? IsPublished = null, Guid? DestinationId = null, string? Search = null) : IRequest<Result<PagedResult<AdminOfferListItemDto>>>;

public class ListAdminOffersQueryHandler(IReadDbContext db) : IRequestHandler<ListAdminOffersQuery, Result<PagedResult<AdminOfferListItemDto>>>
{
    public static readonly IReadOnlyDictionary<string, Expression<Func<Offer, object?>>> SortWhitelist = new Dictionary<string, Expression<Func<Offer, object?>>>
    {
        ["createdAt"] = o => o.CreatedAtUtc,
        ["slug"] = o => o.Slug,
        ["priceFrom"] = o => o.PriceFrom,
        ["durationDays"] = o => o.DurationDays,
        ["isPublished"] = o => o.IsPublished,
        ["isFeatured"] = o => o.IsFeatured,
        ["sortOrder"] = o => o.SortOrder,
    };

    public async Task<Result<PagedResult<AdminOfferListItemDto>>> Handle(ListAdminOffersQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        var query = db.Offers.AsQueryable();
        if (request.IsPublished is { } isPublished) query = query.Where(o => o.IsPublished == isPublished);
        if (request.DestinationId is { } destinationId) query = query.Where(o => o.DestinationId == destinationId);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(o => o.Slug.Contains(term)
                || o.Translations.Any(t => t.Locale == Locale.Ru && t.Title.Contains(term)));
        }
        query = query.ApplySort(request.SortBy, request.SortDir, SortWhitelist, "createdAt");

        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(o => new AdminOfferListItemDto(o.Id, o.Slug, o.PriceFrom, o.Currency, o.IsPublished, o.IsFeatured, o.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedResult<AdminOfferListItemDto>(items, page, pageSize, total));
    }
}

public record GetAdminOfferByIdQuery(Guid Id) : IRequest<Result<UpsertOfferInput>>;

public class GetAdminOfferByIdQueryHandler(IReadDbContext db) : IRequestHandler<GetAdminOfferByIdQuery, Result<UpsertOfferInput>>
{
    public async Task<Result<UpsertOfferInput>> Handle(GetAdminOfferByIdQuery request, CancellationToken cancellationToken)
    {
        var dto = await db.Offers.Where(o => o.Id == request.Id)
            .Select(o => new UpsertOfferInput(
                o.DestinationId, o.Slug, o.PriceFrom, o.Currency, o.DurationDays, o.GalleryUrls, o.ValidUntilUtc,
                o.IsPublished, o.IsFeatured, o.SortOrder,
                o.OfferServices.Select(os => os.ServiceId).ToList(),
                o.Translations.Select(t => new OfferTranslationInput(t.Locale, t.Title, t.Summary, t.Description, t.MetaTitle, t.MetaDescription)).ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        return dto is null
            ? Result.Failure<UpsertOfferInput>(Error.NotFound("NOT_FOUND", "Offer not found."))
            : Result.Success(dto);
    }
}
