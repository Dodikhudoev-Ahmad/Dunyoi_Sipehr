using AeroTravel.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AeroTravel.Infrastructure.Persistence.Configurations;

public class CountryConfiguration : IEntityTypeConfiguration<Country>
{
    public void Configure(EntityTypeBuilder<Country> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.IsoCode).HasMaxLength(2).IsRequired();
        builder.HasIndex(x => x.IsoCode).IsUnique();
        builder.HasMany(x => x.Cities).WithOne(x => x.Country).HasForeignKey(x => x.CountryId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.Translations).WithOne().HasForeignKey(x => x.CountryId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class CountryTranslationConfiguration : IEntityTypeConfiguration<CountryTranslation>
{
    public void Configure(EntityTypeBuilder<CountryTranslation> builder)
    {
        builder.HasKey(x => new { x.CountryId, x.Locale });
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
    }
}

public class CityConfiguration : IEntityTypeConfiguration<City>
{
    public void Configure(EntityTypeBuilder<City> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.CountryId);
        builder.HasMany(x => x.Translations).WithOne().HasForeignKey(x => x.CityId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class CityTranslationConfiguration : IEntityTypeConfiguration<CityTranslation>
{
    public void Configure(EntityTypeBuilder<CityTranslation> builder)
    {
        builder.HasKey(x => new { x.CityId, x.Locale });
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
    }
}
