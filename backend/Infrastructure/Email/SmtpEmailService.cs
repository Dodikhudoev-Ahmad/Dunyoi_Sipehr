using System.Net;
using System.Net.Mail;
using AeroTravel.Application.Common.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace AeroTravel.Infrastructure.Email;

public class SmtpEmailOptions
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public string User { get; set; } = "";
    public string Password { get; set; } = "";
    /// Envelope "From" address — most providers (Gmail included) require this to match the
    /// authenticated account, so it defaults to User rather than needing its own env var.
    public string? From { get; set; }
    public bool EnableSsl { get; set; } = true;
}

/// Generic SMTP sender — works against Gmail (with an app password), or any other SMTP
/// provider, without pulling in a provider-specific SDK. Selected by DependencyInjection only
/// when Email:Smtp:Host/User/Password are all configured; see NullEmailService for the fallback
/// when they aren't.
public class SmtpEmailService(IOptions<SmtpEmailOptions> options, ILogger<SmtpEmailService> logger) : IEmailService
{
    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        var opts = options.Value;
        using var client = new SmtpClient(opts.Host, opts.Port)
        {
            EnableSsl = opts.EnableSsl,
            Credentials = new NetworkCredential(opts.User, opts.Password),
        };

        using var message = new MailMessage
        {
            From = new MailAddress(string.IsNullOrWhiteSpace(opts.From) ? opts.User : opts.From),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(to);

        await client.SendMailAsync(message, cancellationToken);
        logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
    }
}

/// Fallback IEmailService for whenever SMTP credentials aren't configured (mirrors the
/// R2/Local/Db fallback chain for IFileStorageService in DependencyInjection) — logs instead of
/// throwing, so a missing/misconfigured mail provider never turns into an unhandled exception at
/// a call site that's expected to keep working (e.g. travel-request creation) without email set up.
public class NullEmailService(ILogger<NullEmailService> logger) : IEmailService
{
    public Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        logger.LogWarning("Email not sent (no SMTP provider configured) — To: {To}, Subject: {Subject}", to, subject);
        return Task.CompletedTask;
    }
}
