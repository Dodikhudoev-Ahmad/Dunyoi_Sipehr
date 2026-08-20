using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IApplicationDbContext, IReadDbContext
{
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<Destination> Destinations => Set<Destination>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();
    public DbSet<FaqItem> FaqItems => Set<FaqItem>();
    public DbSet<SiteContent> SiteContents => Set<SiteContent>();
    public DbSet<TravelRequest> TravelRequests => Set<TravelRequest>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    IQueryable<Country> IReadDbContext.Countries => Countries.AsNoTracking();
    IQueryable<City> IReadDbContext.Cities => Cities.AsNoTracking();
    IQueryable<Destination> IReadDbContext.Destinations => Destinations.AsNoTracking();
    IQueryable<Service> IReadDbContext.Services => Services.AsNoTracking();
    IQueryable<Offer> IReadDbContext.Offers => Offers.AsNoTracking();
    IQueryable<Testimonial> IReadDbContext.Testimonials => Testimonials.AsNoTracking();
    IQueryable<FaqItem> IReadDbContext.FaqItems => FaqItems.AsNoTracking();
    IQueryable<SiteContent> IReadDbContext.SiteContents => SiteContents.AsNoTracking();
    IQueryable<TravelRequest> IReadDbContext.TravelRequests => TravelRequests.AsNoTracking();
    IQueryable<AdminUser> IReadDbContext.AdminUsers => AdminUsers.AsNoTracking();
    IQueryable<AuditLog> IReadDbContext.AuditLogs => AuditLogs.AsNoTracking();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
