using System.Linq.Expressions;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Services.Dtos;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Services.Queries;

public record ListPublicServicesQuery(Locale Locale) : IRequest<Result<List<ServiceDto>>>;

public class ListPublicServicesQueryHandler(IReadDbContext db) : IRequestHandler<ListPublicServicesQuery, Result<List<ServiceDto>>>
{
    public async Task<Result<List<ServiceDto>>> Handle(ListPublicServicesQuery request, CancellationToken cancellationToken)
    {
        var items = await db.Services.Where(s => s.IsPublished)
            .OrderBy(s => s.SortOrder)
            .Select(s => new
            {
                s.Id,
                s.Icon,
                Translation = s.Translations.FirstOrDefault(t => t.Locale == request.Locale) ?? s.Translations.FirstOrDefault(t => t.Locale == Locale.Ru)
            })
            .ToListAsync(cancellationToken);

        var dtos = items.Select(s => new ServiceDto(s.Id, s.Icon, s.Translation?.Name ?? "", s.Translation?.Description ?? "")).ToList();
        return Result.Success(dtos);
    }
}

public record ListAdminServicesQuery(
    int Page, int PageSize, string? SortBy = null, string? SortDir = null,
    bool? IsPublished = null, string? Search = null) : IRequest<Result<PagedResult<AdminServiceDto>>>;

public class ListAdminServicesQueryHandler(IReadDbContext db) : IRequestHandler<ListAdminServicesQuery, Result<PagedResult<AdminServiceDto>>>
{
    public static readonly IReadOnlyDictionary<string, Expression<Func<Service, object?>>> SortWhitelist = new Dictionary<string, Expression<Func<Service, object?>>>
    {
        ["sortOrder"] = s => s.SortOrder,
        ["isPublished"] = s => s.IsPublished,
        ["createdAt"] = s => s.CreatedAtUtc,
    };

    public async Task<Result<PagedResult<AdminServiceDto>>> Handle(ListAdminServicesQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        var query = db.Services.AsQueryable();
        if (request.IsPublished is { } isPublished) query = query.Where(s => s.IsPublished == isPublished);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(s => s.Translations.Any(t => t.Locale == Locale.Ru && t.Name.Contains(term)));
        }
        query = query.ApplySort(request.SortBy, request.SortDir, SortWhitelist, "sortOrder");

        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(s => new AdminServiceDto(s.Id, s.Icon, s.IsPublished, s.SortOrder,
                s.Translations.Select(t => new ServiceTranslationInput(t.Locale, t.Name, t.Description)).ToList()))
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedResult<AdminServiceDto>(items, page, pageSize, total));
    }
}

public record GetAdminServiceByIdQuery(Guid Id) : IRequest<Result<AdminServiceDto>>;

public class GetAdminServiceByIdQueryHandler(IReadDbContext db) : IRequestHandler<GetAdminServiceByIdQuery, Result<AdminServiceDto>>
{
    public async Task<Result<AdminServiceDto>> Handle(GetAdminServiceByIdQuery request, CancellationToken cancellationToken)
    {
        var dto = await db.Services.Where(s => s.Id == request.Id)
            .Select(s => new AdminServiceDto(s.Id, s.Icon, s.IsPublished, s.SortOrder,
                s.Translations.Select(t => new ServiceTranslationInput(t.Locale, t.Name, t.Description)).ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        return dto is null
            ? Result.Failure<AdminServiceDto>(Error.NotFound("NOT_FOUND", "Service not found."))
            : Result.Success(dto);
    }
}
