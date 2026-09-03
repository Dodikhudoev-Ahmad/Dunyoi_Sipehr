namespace AeroTravel.Application.Common.Interfaces;

/// Abstraction over "how a transactional email actually gets sent" — same seam pattern as
/// IFileStorageService: Application/handlers depend only on this, Infrastructure supplies the
/// concrete SMTP/provider implementation. Callers that treat a failed send as non-fatal (e.g. a
/// staff notification that must never block the operation it's notifying about) should catch
/// around the call themselves — this interface doesn't swallow exceptions itself.
public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken);
}
