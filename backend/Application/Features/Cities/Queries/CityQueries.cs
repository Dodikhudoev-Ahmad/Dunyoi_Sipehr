using System.Linq.Expressions;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Cities.Dtos;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Cities.Queries;

public record ListPublicCitiesQuery(Locale Locale, Guid? CountryId) : IRequest<Result<List<CityDto>>>;

public class ListPublicCitiesQueryHandler(IReadDbContext db) : IRequestHandler<ListPublicCitiesQuery, Result<List<CityDto>>>
{
    public async Task<Result<List<CityDto>>> Handle(ListPublicCitiesQuery request, CancellationToken cancellationToken)
    {
        var query = db.Cities.AsQueryable();
        if (request.CountryId is { } countryId) query = query.Where(c => c.CountryId == countryId);

        var items = await query
            .OrderBy(c => c.SortOrder)
            .Select(c => new
            {
                c.Id,
                c.CountryId,
                c.SortOrder,
                Translation = c.Translations.FirstOrDefault(t => t.Locale == request.Locale) ?? c.Translations.FirstOrDefault(t => t.Locale == Locale.Ru)
            })
            .ToListAsync(cancellationToken);

        var dtos = items.Select(c => new CityDto(c.Id, c.CountryId, c.Translation?.Name ?? "", c.SortOrder)).ToList();
        return Result.Success(dtos);
    }
}

public record ListAdminCitiesQuery(
    int Page, int PageSize, Guid? CountryId, string? SortBy = null, string? SortDir = null, string? Search = null)
    : IRequest<Result<PagedResult<AdminCityDto>>>;

public class ListAdminCitiesQueryHandler(IReadDbContext db) : IRequestHandler<ListAdminCitiesQuery, Result<PagedResult<AdminCityDto>>>
{
    public static readonly IReadOnlyDictionary<string, Expression<Func<City, object?>>> SortWhitelist = new Dictionary<string, Expression<Func<City, object?>>>
    {
        ["sortOrder"] = c => c.SortOrder,
        ["countryId"] = c => c.CountryId,
    };

    public async Task<Result<PagedResult<AdminCityDto>>> Handle(ListAdminCitiesQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        var query = db.Cities.AsQueryable();
        if (request.CountryId is { } countryId) query = query.Where(c => c.CountryId == countryId);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(c => c.Translations.Any(t => t.Locale == Locale.Ru && t.Name.Contains(term)));
        }
        query = query.ApplySort(request.SortBy, request.SortDir, SortWhitelist, "sortOrder");

        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(c => new AdminCityDto(c.Id, c.CountryId, c.SortOrder,
                c.Translations.Select(t => new CityTranslationInput(t.Locale, t.Name)).ToList()))
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedResult<AdminCityDto>(items, page, pageSize, total));
    }
}

public record GetAdminCityByIdQuery(Guid Id) : IRequest<Result<AdminCityDto>>;

public class GetAdminCityByIdQueryHandler(IReadDbContext db) : IRequestHandler<GetAdminCityByIdQuery, Result<AdminCityDto>>
{
    public async Task<Result<AdminCityDto>> Handle(GetAdminCityByIdQuery request, CancellationToken cancellationToken)
    {
        var dto = await db.Cities.Where(c => c.Id == request.Id)
            .Select(c => new AdminCityDto(c.Id, c.CountryId, c.SortOrder,
                c.Translations.Select(t => new CityTranslationInput(t.Locale, t.Name)).ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        return dto is null
            ? Result.Failure<AdminCityDto>(Error.NotFound("NOT_FOUND", "City not found."))
            : Result.Success(dto);
    }
}
