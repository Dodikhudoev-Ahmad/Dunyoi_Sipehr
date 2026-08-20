using System.Linq.Expressions;

namespace AeroTravel.Application.Common.Models;

/// Applies sorting from a client-supplied sortBy/sortDir pair against an explicit whitelist of
/// (name -> key selector), per MASTER_TZ.md §5 ("Pagination/filtering/sorting on all admin list
/// endpoints with an explicit sortable-fields whitelist"). An unknown or missing sortBy silently
/// falls back to defaultSortBy instead of building OrderBy from the raw string or throwing — no
/// dynamic/reflection-based ordering is ever constructed from client input.
public static class QuerySortExtensions
{
    public static IOrderedQueryable<T> ApplySort<T>(
        this IQueryable<T> query,
        string? sortBy,
        string? sortDir,
        IReadOnlyDictionary<string, Expression<Func<T, object?>>> whitelist,
        string defaultSortBy)
    {
        var key = sortBy is not null && whitelist.ContainsKey(sortBy) ? sortBy : defaultSortBy;
        var selector = whitelist[key];
        var descending = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        return descending ? query.OrderByDescending(selector) : query.OrderBy(selector);
    }
}
