using AeroTravel.Application.Common.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace AeroTravel.Infrastructure.Files;

public class LocalFileStorageOptions
{
    /// Relative (to the host's content root) or absolute path. Defaults to "uploads" so a plain
    /// `dotnet run --project Api` from `backend/` resolves to `backend/Api/uploads/` — see
    /// DEC-012 for why this is dev-only and what production needs instead.
    public string RootPath { get; set; } = "uploads";
}

/// Dev-only local-disk file storage — see DEC-012. Never referenced from a public/anonymous
/// route: files are written here by the passport-photo upload endpoint and only ever read back
/// through the authenticated admin download endpoint, never served as static files.
public class LocalFileStorageService : IFileStorageService
{
    private readonly string _root;

    public LocalFileStorageService(IHostEnvironment env, IOptions<LocalFileStorageOptions> options)
    {
        var configured = options.Value.RootPath;
        _root = Path.IsPathRooted(configured) ? configured : Path.Combine(env.ContentRootPath, configured);
        Directory.CreateDirectory(_root);
    }

    public async Task<string> SaveAsync(Stream content, string extension, CancellationToken cancellationToken)
    {
        var fileName = $"{Guid.NewGuid():n}{extension}";
        var path = Path.Combine(_root, fileName);

        await using var fileStream = new FileStream(path, FileMode.CreateNew, FileAccess.Write);
        await content.CopyToAsync(fileStream, cancellationToken);

        return fileName;
    }

    public Task<bool> ExistsAsync(string fileName, CancellationToken cancellationToken)
        => Task.FromResult(IsSafeFileName(fileName) && File.Exists(Path.Combine(_root, fileName)));

    public Task<Stream?> OpenReadAsync(string fileName, CancellationToken cancellationToken)
    {
        if (!IsSafeFileName(fileName))
            return Task.FromResult<Stream?>(null);

        var path = Path.Combine(_root, fileName);
        if (!File.Exists(path))
            return Task.FromResult<Stream?>(null);

        return Task.FromResult<Stream?>(new FileStream(path, FileMode.Open, FileAccess.Read));
    }

    /// Defense in depth: SaveAsync only ever generates GUID-plus-extension names, but this
    /// guards ExistsAsync/OpenReadAsync (fed by user-supplied filenames from the create-request
    /// payload) against path traversal regardless — no separators, no "..".
    private static bool IsSafeFileName(string fileName) =>
        !string.IsNullOrWhiteSpace(fileName)
        && fileName == Path.GetFileName(fileName)
        && !fileName.Contains("..", StringComparison.Ordinal);
}
