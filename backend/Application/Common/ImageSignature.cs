namespace AeroTravel.Application.Common;

/// Server-side file-type sniffing by magic bytes — the client-supplied Content-Type/extension is
/// just a label the client chose and is trivially spoofable, so passport-photo uploads (sensitive
/// PII) are verified against the actual file bytes, not just "looks like an image" metadata.
public static class ImageSignature
{
    /// Returns the real extension (with leading dot) for a recognized image format, or null if
    /// the header bytes don't match any of the accepted formats.
    public static string? DetectExtension(ReadOnlySpan<byte> header)
    {
        if (header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return ".jpg";

        if (header.Length >= 8 && header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
            && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A)
            return ".png";

        if (header.Length >= 12
            && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 // "RIFF"
            && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50) // "WEBP"
            return ".webp";

        if (header.Length >= 6
            && header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x38 // "GIF8"
            && (header[4] == 0x37 || header[4] == 0x39) && header[5] == 0x61)
            return ".gif";

        return null;
    }
}
