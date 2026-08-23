using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Infrastructure.Auth;
using AeroTravel.Infrastructure.Files;
using AeroTravel.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace AeroTravel.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration, IHostEnvironment env)
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

        // R2 (Cloudflare's S3-compatible object storage) is production storage for passport
        // photos — see DEC-012. LocalFileStorageService stays available, unmodified, for local
        // `dotnet run` without AWS-shaped credentials on hand: only switch to it when no R2
        // credentials are configured AND we're in Development, so a production/staging
        // environment that's missing R2 credentials fails loudly (via R2FileStorageService
        // throwing on first use) instead of silently falling back to ephemeral local disk.
        var r2Section = configuration.GetSection("Storage:R2");
        services.Configure<LocalFileStorageOptions>(configuration.GetSection("Storage"));
        services.Configure<R2FileStorageOptions>(r2Section);

        var hasR2Credentials = !string.IsNullOrWhiteSpace(r2Section["AccessKey"]) && !string.IsNullOrWhiteSpace(r2Section["SecretKey"]);
        if (env.IsDevelopment() && !hasR2Credentials)
            services.AddSingleton<IFileStorageService, LocalFileStorageService>();
        else
            services.AddSingleton<IFileStorageService, R2FileStorageService>();

        return services;
    }
}

public class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}
