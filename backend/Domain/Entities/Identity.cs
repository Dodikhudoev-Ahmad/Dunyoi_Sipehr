using AeroTravel.Domain.Common;
using AeroTravel.Domain.Enums;

namespace AeroTravel.Domain.Entities;

public class AdminUser : Entity
{
    public string Email { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public string DisplayName { get; private set; } = default!;
    public AdminRole Role { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public List<RefreshToken> RefreshTokens { get; private set; } = [];

    private AdminUser() { }

    public AdminUser(string email, string passwordHash, string displayName, AdminRole role)
    {
        Email = email.Trim().ToLowerInvariant();
        PasswordHash = passwordHash;
        DisplayName = displayName;
        Role = role;
    }

    public void SetPasswordHash(string passwordHash) => PasswordHash = passwordHash;
    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
    public void SetDisplayName(string displayName) => DisplayName = displayName;
    public void SetRole(AdminRole role) => Role = role;

    public RefreshToken IssueRefreshToken(string tokenHash, DateTime expiresAtUtc, string? createdByIp)
    {
        var token = new RefreshToken(Id, tokenHash, expiresAtUtc, createdByIp);
        RefreshTokens.Add(token);
        return token;
    }
}

public class RefreshToken : Entity
{
    public Guid AdminUserId { get; private set; }
    public string TokenHash { get; private set; } = default!;
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime? RevokedAtUtc { get; private set; }
    public Guid? ReplacedByTokenId { get; private set; }
    public string? CreatedByIp { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    public bool IsActive => RevokedAtUtc is null && DateTime.UtcNow < ExpiresAtUtc;

    private RefreshToken() { }

    public RefreshToken(Guid adminUserId, string tokenHash, DateTime expiresAtUtc, string? createdByIp)
    {
        AdminUserId = adminUserId;
        TokenHash = tokenHash;
        ExpiresAtUtc = expiresAtUtc;
        CreatedByIp = createdByIp;
    }

    public void Revoke(Guid? replacedByTokenId = null)
    {
        RevokedAtUtc = DateTime.UtcNow;
        ReplacedByTokenId = replacedByTokenId;
    }
}

public class AuditLog : Entity
{
    public string EntityType { get; private set; } = default!;
    public Guid EntityId { get; private set; }
    public string Action { get; private set; } = default!;
    public Guid? AdminUserId { get; private set; }
    public DateTime TimestampUtc { get; private set; } = DateTime.UtcNow;
    public string? DetailsJson { get; private set; }

    private AuditLog() { }

    public AuditLog(string entityType, Guid entityId, string action, Guid? adminUserId, string? detailsJson = null)
    {
        EntityType = entityType;
        EntityId = entityId;
        Action = action;
        AdminUserId = adminUserId;
        DetailsJson = detailsJson;
    }
}
