using AeroTravel.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AeroTravel.Infrastructure.Persistence.Configurations;

public class FlightConfiguration : IEntityTypeConfiguration<Flight>
{
    public void Configure(EntityTypeBuilder<Flight> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FlightNumber).HasMaxLength(20).IsRequired();
        builder.HasIndex(x => x.FlightNumber).IsUnique();
        builder.HasIndex(x => x.DepartureAtUtc);
        builder.HasIndex(x => x.Status);
        builder.HasOne<AdminUser>().WithMany().HasForeignKey(x => x.CreatedByAdminUserId).OnDelete(DeleteBehavior.SetNull);
        // Restrict, matching Destination -> City (CatalogConfigurations.cs): a city with flights
        // referencing it can't be silently deleted out from under them.
        builder.HasOne<City>().WithMany().HasForeignKey(x => x.OriginCityId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<City>().WithMany().HasForeignKey(x => x.DestinationCityId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class FlightPassengerConfiguration : IEntityTypeConfiguration<FlightPassenger>
{
    public void Configure(EntityTypeBuilder<FlightPassenger> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(50).IsRequired();
        builder.HasOne<Flight>().WithMany().HasForeignKey(x => x.FlightId).OnDelete(DeleteBehavior.Cascade);
        // A client can only appear once per flight when added from CRM (manual entries have no
        // TravelRequestId to dedupe on, so they're intentionally exempt from this constraint).
        builder.HasIndex(x => new { x.FlightId, x.TravelRequestId })
            .IsUnique()
            .HasFilter("\"TravelRequestId\" IS NOT NULL");
        builder.HasOne<TravelRequest>().WithMany().HasForeignKey(x => x.TravelRequestId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne<AdminUser>().WithMany().HasForeignKey(x => x.AddedByAdminUserId).OnDelete(DeleteBehavior.SetNull);
        // Npgsql maps this onto the built-in xmin system column (see RowVersion doc comment on
        // the entity) — no extra storage or migration-managed column.
        builder.Property(x => x.RowVersion).IsRowVersion();
    }
}
