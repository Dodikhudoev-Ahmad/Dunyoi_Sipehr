using System.Linq.Expressions;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Countries.Dtos;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Countries.Queries;

public record ListPublicCountriesQuery(Locale Locale) : IRequest<Result<List<CountryDto>>>;

public class ListPublicCountriesQueryHandler(IReadDbContext db) : IRequestHandler<ListPublicCountriesQuery, Result<List<CountryDto>>>
{
    public async Task<Result<List<CountryDto>>> Handle(ListPublicCountriesQuery request, CancellationToken cancellationToken)
    {
        var items = await db.Countries
            .OrderBy(c => c.SortOrder)
            .Select(c => new
            {
                c.Id,
                c.IsoCode,
                c.SortOrder,
                Translation = c.Translations.FirstOrDefault(t => t.Locale == request.Locale) ?? c.Translations.FirstOrDefault(t => t.Locale == Locale.Ru)
            })
            .ToListAsync(cancellationToken);

        var dtos = items.Select(c => new CountryDto(c.Id, c.IsoCode, c.Translation?.Name ?? "", c.SortOrder)).ToList();
        return Result.Success(dtos);
    }
}

public record ListAdminCountriesQuery(
    int Page, int PageSize, string? SortBy = null, string? SortDir = null, string? Search = null)
    : IRequest<Result<PagedResult<AdminCountryDto>>>;

public class ListAdminCountriesQueryHandler(IReadDbContext db) : IRequestHandler<ListAdminCountriesQuery, Result<PagedResult<AdminCountryDto>>>
{
    public static readonly IReadOnlyDictionary<string, Expression<Func<Country, object?>>> SortWhitelist = new Dictionary<string, Expression<Func<Country, object?>>>
    {
        ["sortOrder"] = c => c.SortOrder,
        ["isoCode"] = c => c.IsoCode,
    };

    public async Task<Result<PagedResult<AdminCountryDto>>> Handle(ListAdminCountriesQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        var query = db.Countries.AsQueryable();
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(c => c.IsoCode.Contains(term)
                || c.Translations.Any(t => t.Locale == Locale.Ru && t.Name.Contains(term)));
        }
        query = query.ApplySort(request.SortBy, request.SortDir, SortWhitelist, "sortOrder");

        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(c => new AdminCountryDto(c.Id, c.IsoCode, c.SortOrder,
                c.Translations.Select(t => new CountryTranslationInput(t.Locale, t.Name)).ToList()))
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedResult<AdminCountryDto>(items, page, pageSize, total));
    }
}

public record GetAdminCountryByIdQuery(Guid Id) : IRequest<Result<AdminCountryDto>>;

public class GetAdminCountryByIdQueryHandler(IReadDbContext db) : IRequestHandler<GetAdminCountryByIdQuery, Result<AdminCountryDto>>
{
    public async Task<Result<AdminCountryDto>> Handle(GetAdminCountryByIdQuery request, CancellationToken cancellationToken)
    {
        var dto = await db.Countries.Where(c => c.Id == request.Id)
            .Select(c => new AdminCountryDto(c.Id, c.IsoCode, c.SortOrder,
                c.Translations.Select(t => new CountryTranslationInput(t.Locale, t.Name)).ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        return dto is null
            ? Result.Failure<AdminCountryDto>(Error.NotFound("NOT_FOUND", "Country not found."))
            : Result.Success(dto);
    }
}
