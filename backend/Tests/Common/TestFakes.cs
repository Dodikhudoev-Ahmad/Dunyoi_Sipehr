using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using AeroTravel.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Tests.Common;

public static class TestDb
{
    public static AppDbContext Create() => CreateNamed(Guid.NewGuid().ToString());

    /// <summary>
    /// A second `AppDbContext` created with the same `name` reads/writes the same EF InMemory
    /// database but starts with an empty change tracker — unlike reusing one context instance,
    /// this actually exercises whether a handler's query eagerly loads what it's about to mutate
    /// (e.g. `.Include(x => x.Translations)`), instead of relying on entities still being tracked
    /// in memory from an earlier operation in the same test.
    /// </summary>
    public static AppDbContext CreateNamed(string name)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        return new AppDbContext(options);
    }
}

public class FakePasswordHasher : IPasswordHasher
{
    public string Hash(string password) => $"hashed:{password}";
    public bool Verify(string password, string hash) => hash == $"hashed:{password}";
}

public class FakeJwtTokenGenerator : IJwtTokenGenerator
{
    public (string token, DateTime expiresAtUtc) GenerateAccessToken(AdminUser user) => ("fake-access-token", DateTime.UtcNow.AddMinutes(15));
    public string GenerateRefreshTokenValue() => Guid.NewGuid().ToString("n");
    public string HashRefreshTokenValue(string rawValue) => $"hash:{rawValue}";
}

public class FakeCurrentUserService(Guid? adminUserId = null, AdminRole? role = null) : ICurrentUserService
{
    public Guid? AdminUserId { get; } = adminUserId;
    public AdminRole? Role { get; } = role;
    public string? IpAddress => "127.0.0.1";
}

/// In-memory stand-in for IFileStorageService — lets validators/handlers that check
/// "does this uploaded file exist" be tested without touching the real filesystem. Seed
/// `KnownFileNames` with whatever names a test wants ExistsAsync to report as present.
public class FakeFileStorageService : IFileStorageService
{
    public HashSet<string> KnownFileNames { get; } = [];

    public Task<string> SaveAsync(Stream content, string extension, CancellationToken cancellationToken)
    {
        var fileName = $"{Guid.NewGuid():n}{extension}";
        KnownFileNames.Add(fileName);
        return Task.FromResult(fileName);
    }

    public Task<bool> ExistsAsync(string fileName, CancellationToken cancellationToken) => Task.FromResult(KnownFileNames.Contains(fileName));

    public Task<Stream?> OpenReadAsync(string fileName, CancellationToken cancellationToken) =>
        Task.FromResult<Stream?>(KnownFileNames.Contains(fileName) ? new MemoryStream() : null);
}
