using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Infrastructure.Files;

/// TEMPORARY passport-photo storage backed by a Postgres bytea column — see docs/BLOCKERS.md
/// BLK-008. Selected automatically outside Development whenever R2 credentials aren't configured
/// (see DependencyInjection.AddInfrastructure), so the public travel-request form keeps working
/// without a Cloudflare account/billing card. Registered Scoped, not Singleton like Local/R2 —
/// it needs a DbContext, which isn't safe to hold for the app's whole lifetime.
public class DbFileStorageService(IApplicationDbContext db) : IFileStorageService
{
    private static readonly Dictionary<string, string> ContentTypesByExtension = new()
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
        [".gif"] = "image/gif",
    };

    public async Task<string> SaveAsync(Stream content, string extension, CancellationToken cancellationToken)
    {
        var fileName = $"{Guid.NewGuid():n}{extension}";
        var contentType = ContentTypesByExtension.GetValueOrDefault(extension, "application/octet-stream");

        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);

        db.PassportPhotos.Add(new PassportPhoto(fileName, buffer.ToArray(), contentType));
        await db.SaveChangesAsync(cancellationToken);

        return fileName;
    }

    public Task<bool> ExistsAsync(string fileName, CancellationToken cancellationToken)
        => db.PassportPhotos.AnyAsync(p => p.FileName == fileName, cancellationToken);

    public async Task<Stream?> OpenReadAsync(string fileName, CancellationToken cancellationToken)
    {
        var photo = await db.PassportPhotos.AsNoTracking().FirstOrDefaultAsync(p => p.FileName == fileName, cancellationToken);
        return photo is null ? null : new MemoryStream(photo.Content);
    }
}
