using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AeroTravel.Infrastructure.Persistence;

/// Design-time factory so `dotnet ef migrations add` can construct the DbContext without
/// running the full Api DI graph (JWT config, health checks, etc). Uses the same env-var /
/// fallback connection string resolution as DependencyInjection.AddInfrastructure.
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? "Host=localhost;Port=5432;Database=aerotravel;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new AppDbContext(optionsBuilder.Options);
    }
}
