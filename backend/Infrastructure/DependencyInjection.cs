using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Infrastructure.Auth;
using AeroTravel.Infrastructure.Files;
using AeroTravel.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AeroTravel.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration["ConnectionStrings:Default"]
            ?? Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? "Host=localhost;Port=5432;Database=aerotravel;Username=postgres;Password=postgres";

        // EnableRetryOnFailure: transparently retries a handful of transient network/timeout
        // failures against Postgres (relevant on Railway per DEC-006/BLK-001, a shared/managed
        // instance more prone to brief blips than a local dev DB) instead of surfacing a 500 on
        // the first hiccup. No manual BeginTransaction/IDbContextTransaction usage exists anywhere
        // in the codebase (grepped Application/Infrastructure/Api) that would need to be wrapped
        // in an execution strategy, so this is a safe, additive change.
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql => npgsql.EnableRetryOnFailure()));

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<IReadDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.Configure<LocalFileStorageOptions>(configuration.GetSection("Storage"));
        services.AddSingleton<IFileStorageService, LocalFileStorageService>();

        return services;
    }
}

public class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}
