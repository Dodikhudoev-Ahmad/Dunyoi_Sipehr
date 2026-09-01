using AeroTravel.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AeroTravel.Infrastructure.Persistence.Configurations;

/// TEMPORARY table — see PassportPhoto's doc comment and docs/BLOCKERS.md BLK-008.
public class PassportPhotoConfiguration : IEntityTypeConfiguration<PassportPhoto>
{
    public void Configure(EntityTypeBuilder<PassportPhoto> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FileName).HasMaxLength(260).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Content).HasColumnType("bytea").IsRequired();
        builder.HasIndex(x => x.FileName).IsUnique();
    }
}
