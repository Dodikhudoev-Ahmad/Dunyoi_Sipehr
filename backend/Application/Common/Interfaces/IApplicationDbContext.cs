using AeroTravel.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Country> Countries { get; }
    DbSet<City> Cities { get; }
    DbSet<Destination> Destinations { get; }
    DbSet<Service> Services { get; }
    DbSet<Offer> Offers { get; }
    DbSet<Testimonial> Testimonials { get; }
    DbSet<FaqItem> FaqItems { get; }
    DbSet<SiteContent> SiteContents { get; }
    DbSet<TravelRequest> TravelRequests { get; }
    DbSet<TravelRequestNote> TravelRequestNotes { get; }
    DbSet<AdminUser> AdminUsers { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}

/// Read-only projection surface for query handlers — same underlying context, narrower contract (DEC: keeps queries from mutating state).
public interface IReadDbContext
{
    IQueryable<Country> Countries { get; }
    IQueryable<City> Cities { get; }
    IQueryable<Destination> Destinations { get; }
    IQueryable<Service> Services { get; }
    IQueryable<Offer> Offers { get; }
    IQueryable<Testimonial> Testimonials { get; }
    IQueryable<FaqItem> FaqItems { get; }
    IQueryable<SiteContent> SiteContents { get; }
    IQueryable<TravelRequest> TravelRequests { get; }
    IQueryable<TravelRequestNote> TravelRequestNotes { get; }
    IQueryable<AdminUser> AdminUsers { get; }
    IQueryable<AuditLog> AuditLogs { get; }
}
