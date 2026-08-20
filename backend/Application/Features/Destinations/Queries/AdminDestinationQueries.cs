using System.Linq.Expressions;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Destinations.Dtos;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Destinations.Queries;

public record ListAdminDestinationsQuery(
    int Page, int PageSize, string? SortBy = null, string? SortDir = null,
    bool? IsPublished = null, string? Search = null) : IRequest<Result<PagedResult<AdminDestinationListItemDto>>>;

public class ListAdminDestinationsQueryHandler(IReadDbContext db) : IRequestHandler<ListAdminDestinationsQuery, Result<PagedResult<AdminDestinationListItemDto>>>
{
    public static readonly IReadOnlyDictionary<string, Expression<Func<Destination, object?>>> SortWhitelist = new Dictionary<string, Expression<Func<Destination, object?>>>
    {
        ["createdAt"] = d => d.CreatedAtUtc,
        ["slug"] = d => d.Slug,
        ["isPublished"] = d => d.IsPublished,
        ["isFeatured"] = d => d.IsFeatured,
        ["sortOrder"] = d => d.SortOrder,
    };

    public async Task<Result<PagedResult<AdminDestinationListItemDto>>> Handle(ListAdminDestinationsQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        var query = db.Destinations.AsQueryable();
        if (request.IsPublished is { } isPublished) query = query.Where(d => d.IsPublished == isPublished);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(d => d.Slug.Contains(term)
                || d.Translations.Any(t => t.Locale == Locale.Ru && t.Title.Contains(term)));
        }
        query = query.ApplySort(request.SortBy, request.SortDir, SortWhitelist, "createdAt");

        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(d => new AdminDestinationListItemDto(
                d.Id, d.Slug,
                (d.City!.Translations.FirstOrDefault(t => t.Locale == Locale.Ru) ?? d.City!.Translations.FirstOrDefault())!.Name,
                d.IsPublished, d.IsFeatured, d.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedResult<AdminDestinationListItemDto>(items, page, pageSize, total));
    }
}

public record GetAdminDestinationByIdQuery(Guid Id) : IRequest<Result<UpsertDestinationInput>>;

public class GetAdminDestinationByIdQueryHandler(IReadDbContext db) : IRequestHandler<GetAdminDestinationByIdQuery, Result<UpsertDestinationInput>>
{
    public async Task<Result<UpsertDestinationInput>> Handle(GetAdminDestinationByIdQuery request, CancellationToken cancellationToken)
    {
        var dto = await db.Destinations.Where(d => d.Id == request.Id)
            .Select(d => new UpsertDestinationInput(
                d.CityId, d.Slug, d.HeroImageUrl, d.GalleryUrls, d.IsPublished, d.IsFeatured, d.SortOrder,
                d.Translations.Select(t => new DestinationTranslationInput(t.Locale, t.Title, t.Summary, t.Description, t.Highlights, t.MetaTitle, t.MetaDescription)).ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        return dto is null
            ? Result.Failure<UpsertDestinationInput>(Error.NotFound("NOT_FOUND", "Destination not found."))
            : Result.Success(dto);
    }
}
