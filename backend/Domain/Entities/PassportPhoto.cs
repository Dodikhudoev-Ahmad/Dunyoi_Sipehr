using AeroTravel.Domain.Common;

namespace AeroTravel.Domain.Entities;

/// TEMPORARY passport-photo storage — see docs/BLOCKERS.md BLK-008. Cloudflare R2 credentials
/// aren't provisioned yet (no billing card attached), so passport photos go straight into
/// Postgres as bytea via DbFileStorageService (Infrastructure/Files) instead of an object store,
/// keeping the public /travel-request form working in the meantime. Migrate to R2 and retire this
/// table once real credentials exist — see the blocker entry for the full plan.
public class PassportPhoto : Entity
{
    /// Same "{guid}{extension}" key convention every IFileStorageService implementation already
    /// uses (Local/R2) — TravelRequest.PassportPhotoPaths stores this same string regardless of
    /// which implementation is active, so the existing admin passport-photo endpoint needs no
    /// changes to keep working.
    public string FileName { get; private set; } = default!;
    public byte[] Content { get; private set; } = default!;
    public string ContentType { get; private set; } = default!;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private PassportPhoto() { }

    public PassportPhoto(string fileName, byte[] content, string contentType)
    {
        FileName = fileName;
        Content = content;
        ContentType = contentType;
    }
}
