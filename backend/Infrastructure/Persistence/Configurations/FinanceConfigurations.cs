using AeroTravel.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AeroTravel.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Amount).HasPrecision(14, 2);
        builder.Property(x => x.ClientName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Comment).HasMaxLength(500);
        builder.HasIndex(x => x.PaidOnUtc);
        builder.HasIndex(x => x.TravelRequestId);
        builder.HasIndex(x => x.FlightId);
        builder.HasOne<TravelRequest>().WithMany().HasForeignKey(x => x.TravelRequestId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne<Flight>().WithMany().HasForeignKey(x => x.FlightId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne<AdminUser>().WithMany().HasForeignKey(x => x.CreatedByAdminUserId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Amount).HasPrecision(14, 2);
        builder.Property(x => x.Comment).HasMaxLength(500);
        builder.HasIndex(x => x.SpentOnUtc);
        builder.HasIndex(x => x.Category);
        builder.HasOne<AdminUser>().WithMany().HasForeignKey(x => x.CreatedByAdminUserId).OnDelete(DeleteBehavior.SetNull);
    }
}
