namespace AeroTravel.Application.Common.Models;

/// Bound from config (Email:NotifyTo / App:AdminUrl) in Infrastructure DI — kept as a plain
/// Application-layer POCO (not IConfiguration directly) so handlers stay testable without an
/// ASP.NET Core configuration object.
public class NotificationSettings
{
    /// Staff mailbox that receives new-travel-request notifications.
    public string NotifyTo { get; set; } = "";

    /// Base URL of the public site/admin CRM, used to build a clickable link straight to the
    /// request in the admin dashboard (e.g. "{AdminUrl}/admin/travel-requests/{id}").
    public string AdminUrl { get; set; } = "";
}
