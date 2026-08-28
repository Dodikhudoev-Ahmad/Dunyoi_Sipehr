using AeroTravel.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AeroTravel.Infrastructure.Persistence.Configurations;

public class AdminUserConfiguration : IEntityTypeConfiguration<AdminUser>
{
    public void Configure(EntityTypeBuilder<AdminUser> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.HasIndex(x => x.Email).IsUnique();
        builder.HasMany(x => x.RefreshTokens).WithOne().HasForeignKey(x => x.AdminUserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TokenHash).HasMaxLength(500).IsRequired();
        builder.HasIndex(x => x.TokenHash);
        builder.HasIndex(x => x.AdminUserId);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Action).HasMaxLength(50).IsRequired();
        builder.HasIndex(x => new { x.EntityType, x.EntityId });
        builder.HasIndex(x => x.TimestampUtc);
    }
}

public class TravelRequestConfiguration : IEntityTypeConfiguration<TravelRequest>
{
    public void Configure(EntityTypeBuilder<TravelRequest> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.LastName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.FirstName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.MiddleName).HasMaxLength(200);
        builder.Property(x => x.Phone).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Message).HasMaxLength(500);
        builder.Property(x => x.ChildrenAges).HasColumnType("jsonb");
        builder.Property(x => x.PassportPhotoPaths).HasColumnType("jsonb");
        builder.Property(x => x.DealValue).HasPrecision(12, 2);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.CreatedAtUtc);
        builder.HasIndex(x => x.NextFollowUpAtUtc);
        builder.HasOne<Destination>().WithMany().HasForeignKey(x => x.DestinationId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne<Offer>().WithMany().HasForeignKey(x => x.OfferId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne<AdminUser>().WithMany().HasForeignKey(x => x.AssignedAdminUserId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class TravelRequestNoteConfiguration : IEntityTypeConfiguration<TravelRequestNote>
{
    public void Configure(EntityTypeBuilder<TravelRequestNote> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Text).HasMaxLength(2000).IsRequired();
        builder.HasIndex(x => x.TravelRequestId);
        builder.HasOne<TravelRequest>().WithMany().HasForeignKey(x => x.TravelRequestId).OnDelete(DeleteBehavior.Cascade);
        // Notes are a communication record tied to a specific author — deleting the author's
        // account (soft-deactivate in practice, see AdminUser.Deactivate) must never cascade into
        // silently destroying that history, so this stays Restrict rather than SetNull/Cascade.
        builder.HasOne<AdminUser>().WithMany().HasForeignKey(x => x.AuthorAdminUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
