using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Destinations.Dtos;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Destinations.Queries;

public record ListPublicDestinationsQuery(Locale Locale, bool? Featured, Guid? CityId, int Page, int PageSize)
    : IRequest<Result<PagedResult<DestinationListItemDto>>>;

public class ListPublicDestinationsQueryHandler(IReadDbContext db)
    : IRequestHandler<ListPublicDestinationsQuery, Result<PagedResult<DestinationListItemDto>>>
{
    public async Task<Result<PagedResult<DestinationListItemDto>>> Handle(ListPublicDestinationsQuery request, CancellationToken cancellationToken)
    {
        var query = db.Destinations.Where(d => d.IsPublished);
        if (request.Featured is { } featured) query = query.Where(d => d.IsFeatured == featured);
        if (request.CityId is { } cityId) query = query.Where(d => d.CityId == cityId);

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(d => d.SortOrder)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new
            {
                d.Id,
                d.Slug,
                d.HeroImageUrl,
                d.IsFeatured,
                Translation = d.Translations.FirstOrDefault(t => t.Locale == request.Locale)
                    ?? d.Translations.FirstOrDefault(t => t.Locale == Locale.Ru)
            })
            .ToListAsync(cancellationToken);

        var dtos = items.Select(d => new DestinationListItemDto(
            d.Id, d.Slug, d.Translation!.Title, d.Translation.Summary, d.HeroImageUrl, d.IsFeatured)).ToList();

        return Result.Success(new PagedResult<DestinationListItemDto>(dtos, page, pageSize, total));
    }
}

public record GetPublicDestinationBySlugQuery(string Slug, Locale Locale) : IRequest<Result<DestinationDetailDto>>;

public class GetPublicDestinationBySlugQueryHandler(IReadDbContext db)
    : IRequestHandler<GetPublicDestinationBySlugQuery, Result<DestinationDetailDto>>
{
    public async Task<Result<DestinationDetailDto>> Handle(GetPublicDestinationBySlugQuery request, CancellationToken cancellationToken)
    {
        var destination = await db.Destinations
            .Where(d => d.Slug == request.Slug && d.IsPublished)
            .Select(d => new
            {
                d.Id,
                d.Slug,
                d.HeroImageUrl,
                d.GalleryUrls,
                d.IsFeatured,
                CityName = d.City!.Translations.FirstOrDefault(t => t.Locale == request.Locale) ?? d.City!.Translations.FirstOrDefault(t => t.Locale == Locale.Ru),
                CountryName = d.City!.Country!.Translations.FirstOrDefault(t => t.Locale == request.Locale) ?? d.City!.Country!.Translations.FirstOrDefault(t => t.Locale == Locale.Ru),
                Translation = d.Translations.FirstOrDefault(t => t.Locale == request.Locale) ?? d.Translations.FirstOrDefault(t => t.Locale == Locale.Ru)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (destination is null)
            return Result.Failure<DestinationDetailDto>(Error.NotFound("NOT_FOUND", "Destination not found."));

        return Result.Success(new DestinationDetailDto(
            destination.Id, destination.Slug, destination.Translation!.Title, destination.Translation.Summary,
            destination.Translation.Description, destination.Translation.Highlights,
            destination.HeroImageUrl, destination.GalleryUrls,
            destination.CityName?.Name ?? "", destination.CountryName?.Name ?? "", destination.IsFeatured));
    }
}
