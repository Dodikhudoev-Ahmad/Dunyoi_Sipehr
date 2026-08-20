using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.TravelRequests.Commands;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using AeroTravel.Tests.Common;

namespace AeroTravel.Tests.Features.TravelRequests;

public class TravelRequestStateMachineTests
{
    private static TravelRequest MakeRequest() => new(
        "Jane Doe", "jane@example.com", "+992000000", Locale.Ru,
        2, 0, [], null,
        DateOnly.FromDateTime(DateTime.UtcNow), null,
        null, null, null, null,
        ["photo1.jpg"],
        null, null, Locale.Ru);

    [Theory]
    [InlineData(TravelRequestStatus.New, TravelRequestStatus.Contacted, true)]
    [InlineData(TravelRequestStatus.New, TravelRequestStatus.Lost, true)]
    [InlineData(TravelRequestStatus.New, TravelRequestStatus.Qualified, false)]
    [InlineData(TravelRequestStatus.New, TravelRequestStatus.Won, false)]
    [InlineData(TravelRequestStatus.Contacted, TravelRequestStatus.Qualified, true)]
    [InlineData(TravelRequestStatus.Contacted, TravelRequestStatus.Lost, true)]
    [InlineData(TravelRequestStatus.Qualified, TravelRequestStatus.Won, true)]
    [InlineData(TravelRequestStatus.Qualified, TravelRequestStatus.Lost, true)]
    [InlineData(TravelRequestStatus.Won, TravelRequestStatus.Lost, false)]
    [InlineData(TravelRequestStatus.Lost, TravelRequestStatus.New, false)]
    public void CanTransitionTo_MatchesAllowedStateMachine(TravelRequestStatus from, TravelRequestStatus to, bool expected)
    {
        var request = MakeRequest();
        if (from != TravelRequestStatus.New)
        {
            // Walk to the "from" state via valid transitions.
            foreach (var step in PathTo(from))
                request.TransitionTo(step);
        }

        Assert.Equal(expected, request.CanTransitionTo(to));
    }

    private static IEnumerable<TravelRequestStatus> PathTo(TravelRequestStatus target) => target switch
    {
        TravelRequestStatus.Contacted => [TravelRequestStatus.Contacted],
        TravelRequestStatus.Qualified => [TravelRequestStatus.Contacted, TravelRequestStatus.Qualified],
        TravelRequestStatus.Won => [TravelRequestStatus.Contacted, TravelRequestStatus.Qualified, TravelRequestStatus.Won],
        TravelRequestStatus.Lost => [TravelRequestStatus.Lost],
        _ => [],
    };

    [Fact]
    public void TransitionTo_InvalidTransition_Throws()
    {
        var request = MakeRequest();
        Assert.Throws<InvalidOperationException>(() => request.TransitionTo(TravelRequestStatus.Won));
    }

    [Fact]
    public async Task Handler_ValidTransition_UpdatesStatus_AndWritesAudit()
    {
        using var db = TestDb.Create();
        var request = MakeRequest();
        db.TravelRequests.Add(request);
        await db.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdateTravelRequestStatusCommandHandler(db);
        var adminId = Guid.NewGuid();
        var result = await handler.Handle(new UpdateTravelRequestStatusCommand(request.Id, TravelRequestStatus.Contacted, adminId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(TravelRequestStatus.Contacted, request.Status);
        Assert.Contains(db.AuditLogs, a => a.Action == "StatusChange" && a.AdminUserId == adminId);
    }

    [Fact]
    public async Task Handler_InvalidTransition_ReturnsConflict()
    {
        using var db = TestDb.Create();
        var request = MakeRequest();
        db.TravelRequests.Add(request);
        await db.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdateTravelRequestStatusCommandHandler(db);
        var result = await handler.Handle(new UpdateTravelRequestStatusCommand(request.Id, TravelRequestStatus.Won, null), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Conflict, result.Error!.Type);
        Assert.Equal("INVALID_TRANSITION", result.Error.Code);
    }

    [Fact]
    public async Task Handler_UnknownId_ReturnsNotFound()
    {
        using var db = TestDb.Create();
        var handler = new UpdateTravelRequestStatusCommandHandler(db);

        var result = await handler.Handle(new UpdateTravelRequestStatusCommand(Guid.NewGuid(), TravelRequestStatus.Contacted, null), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.NotFound, result.Error!.Type);
    }
}
