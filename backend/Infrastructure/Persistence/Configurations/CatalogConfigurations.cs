using AeroTravel.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AeroTravel.Infrastructure.Persistence.Configurations;

public class DestinationConfiguration : IEntityTypeConfiguration<Destination>
{
    public void Configure(EntityTypeBuilder<Destination> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Slug).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => new { x.IsPublished, x.IsFeatured });
        builder.Property(x => x.GalleryUrls).HasColumnType("jsonb");
        builder.HasMany(x => x.Translations).WithOne().HasForeignKey(x => x.DestinationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Offers).WithOne(x => x.Destination).HasForeignKey(x => x.DestinationId).OnDelete(DeleteBehavior.SetNull);
        // Left unconfigured, EF Core defaults a required FK to Cascade — that would let deleting a
        // City silently delete every published Destination in it at the DB level, contradicting the
        // app-level "has children" guard in DeleteCityCommandHandler and the analogous explicit
        // Restrict on Country -> City (GeoConfigurations.cs). Restrict here so the two are consistent
        // and the invariant holds even outside the one guarded command path.
        builder.HasOne(x => x.City).WithMany().HasForeignKey(x => x.CityId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class DestinationTranslationConfiguration : IEntityTypeConfiguration<DestinationTranslation>
{
    public void Configure(EntityTypeBuilder<DestinationTranslation> builder)
    {
        builder.HasKey(x => new { x.DestinationId, x.Locale });
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Summary).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Highlights).HasColumnType("jsonb");
    }
}

public class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasMany(x => x.Translations).WithOne().HasForeignKey(x => x.ServiceId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ServiceTranslationConfiguration : IEntityTypeConfiguration<ServiceTranslation>
{
    public void Configure(EntityTypeBuilder<ServiceTranslation> builder)
    {
        builder.HasKey(x => new { x.ServiceId, x.Locale });
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
    }
}

public class OfferConfiguration : IEntityTypeConfiguration<Offer>
{
    public void Configure(EntityTypeBuilder<Offer> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Slug).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.DestinationId);
        // Public/admin offer listings filter and sort by these together (ListPublicOffersQuery /
        // ListAdminOffersQuery) the same way Destination already does above — Offer had no
        // equivalent index despite the identical query shape.
        builder.HasIndex(x => new { x.IsPublished, x.IsFeatured });
        builder.Property(x => x.PriceFrom).HasColumnType("numeric(12,2)");
        builder.Property(x => x.GalleryUrls).HasColumnType("jsonb");
        builder.HasMany(x => x.Translations).WithOne().HasForeignKey(x => x.OfferId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class OfferTranslationConfiguration : IEntityTypeConfiguration<OfferTranslation>
{
    public void Configure(EntityTypeBuilder<OfferTranslation> builder)
    {
        builder.HasKey(x => new { x.OfferId, x.Locale });
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
    }
}

public class OfferServiceConfiguration : IEntityTypeConfiguration<OfferService>
{
    public void Configure(EntityTypeBuilder<OfferService> builder)
    {
        builder.HasKey(x => new { x.OfferId, x.ServiceId });
    }
}
