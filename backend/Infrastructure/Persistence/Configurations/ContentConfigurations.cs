using AeroTravel.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AeroTravel.Infrastructure.Persistence.Configurations;

public class TestimonialConfiguration : IEntityTypeConfiguration<Testimonial>
{
    public void Configure(EntityTypeBuilder<Testimonial> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasMany(x => x.Translations).WithOne().HasForeignKey(x => x.TestimonialId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class TestimonialTranslationConfiguration : IEntityTypeConfiguration<TestimonialTranslation>
{
    public void Configure(EntityTypeBuilder<TestimonialTranslation> builder)
    {
        builder.HasKey(x => new { x.TestimonialId, x.Locale });
        builder.Property(x => x.Quote).HasMaxLength(1000).IsRequired();
    }
}

public class FaqItemConfiguration : IEntityTypeConfiguration<FaqItem>
{
    public void Configure(EntityTypeBuilder<FaqItem> builder)
    {
        builder.HasKey(x => x.Id);
        // ListAdminFaqQuery filters by exact Category match when one is supplied.
        builder.HasIndex(x => x.Category);
        builder.HasMany(x => x.Translations).WithOne().HasForeignKey(x => x.FaqItemId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class FaqItemTranslationConfiguration : IEntityTypeConfiguration<FaqItemTranslation>
{
    public void Configure(EntityTypeBuilder<FaqItemTranslation> builder)
    {
        builder.HasKey(x => new { x.FaqItemId, x.Locale });
        builder.Property(x => x.Question).HasMaxLength(300).IsRequired();
    }
}

public class SiteContentConfiguration : IEntityTypeConfiguration<SiteContent>
{
    public void Configure(EntityTypeBuilder<SiteContent> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Key).HasMaxLength(100).IsRequired();
        builder.HasIndex(x => x.Key).IsUnique();
        builder.HasMany(x => x.Translations).WithOne().HasForeignKey(x => x.SiteContentId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class SiteContentTranslationConfiguration : IEntityTypeConfiguration<SiteContentTranslation>
{
    public void Configure(EntityTypeBuilder<SiteContentTranslation> builder)
    {
        builder.HasKey(x => new { x.SiteContentId, x.Locale });
    }
}
