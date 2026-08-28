using AeroTravel.Domain.Common;

namespace AeroTravel.Domain.Entities;

/// One entry in a Travel Request's communication log — a CRM operator's record of a call/message
/// with the lead. Immutable by design (no Update/Delete anywhere in Application/Api): this is a
/// record of what was actually said and when, not a scratchpad that should be editable after the
/// fact, so both roles that can write one (SuperAdmin, Editor) can trust the log wasn't quietly
/// rewritten later.
public class TravelRequestNote : Entity
{
    public Guid TravelRequestId { get; private set; }
    public Guid AuthorAdminUserId { get; private set; }
    public string Text { get; private set; } = default!;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private TravelRequestNote() { }

    public TravelRequestNote(Guid travelRequestId, Guid authorAdminUserId, string text)
    {
        TravelRequestId = travelRequestId;
        AuthorAdminUserId = authorAdminUserId;
        Text = text;
    }
}
