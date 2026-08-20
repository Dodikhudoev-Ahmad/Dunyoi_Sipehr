namespace AeroTravel.Application.Common.Interfaces;

/// Abstraction over "where uploaded files live" so Application code never depends on the local
/// filesystem (or any other concrete storage) directly — Clean Architecture: Infrastructure
/// implements this. Filenames are always server-generated (see SaveAsync) so callers never pass
/// a caller-controlled path, which rules out path traversal by construction. See DEC-012 for the
/// current dev-only local-disk implementation and the production storage gap it leaves open.
public interface IFileStorageService
{
    /// Saves the content under a new, server-generated safe filename (using the given extension,
    /// e.g. ".jpg") and returns that filename. The caller never chooses the stored name.
    Task<string> SaveAsync(Stream content, string extension, CancellationToken cancellationToken);

    Task<bool> ExistsAsync(string fileName, CancellationToken cancellationToken);

    /// Null if the file doesn't exist. Caller owns disposing the returned stream.
    Task<Stream?> OpenReadAsync(string fileName, CancellationToken cancellationToken);
}
