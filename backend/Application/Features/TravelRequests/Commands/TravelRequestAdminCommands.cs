using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.TravelRequests.Commands;

public record UpdateTravelRequestStatusCommand(Guid Id, TravelRequestStatus Status, Guid? AdminUserId) : IRequest<Result>;

public class UpdateTravelRequestStatusCommandValidator : AbstractValidator<UpdateTravelRequestStatusCommand>
{
    public UpdateTravelRequestStatusCommandValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}

public class UpdateTravelRequestStatusCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateTravelRequestStatusCommand, Result>
{
    public async Task<Result> Handle(UpdateTravelRequestStatusCommand request, CancellationToken cancellationToken)
    {
        var travelRequest = await db.TravelRequests.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (travelRequest is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Travel request not found."));

        if (!travelRequest.CanTransitionTo(request.Status))
            return Result.Failure(Error.Conflict("INVALID_TRANSITION", $"Cannot transition from {travelRequest.Status} to {request.Status}."));

        var fromStatus = travelRequest.Status;
        travelRequest.TransitionTo(request.Status);

        db.AuditLogs.Add(new AuditLog(nameof(TravelRequest), travelRequest.Id, "StatusChange", request.AdminUserId,
            $"{{\"from\":\"{fromStatus}\",\"to\":\"{request.Status}\"}}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record AssignTravelRequestCommand(Guid Id, Guid? AssignedAdminUserId, Guid? AdminUserId) : IRequest<Result>;

public class AssignTravelRequestCommandHandler(IApplicationDbContext db) : IRequestHandler<AssignTravelRequestCommand, Result>
{
    public async Task<Result> Handle(AssignTravelRequestCommand request, CancellationToken cancellationToken)
    {
        var travelRequest = await db.TravelRequests.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (travelRequest is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Travel request not found."));

        if (request.AssignedAdminUserId is { } adminId)
        {
            var exists = await db.AdminUsers.AnyAsync(a => a.Id == adminId, cancellationToken);
            if (!exists)
                return Result.Failure(Error.Validation("VALIDATION_FAILED", "Assigned admin user does not exist."));
        }

        travelRequest.AssignTo(request.AssignedAdminUserId);

        db.AuditLogs.Add(new AuditLog(nameof(TravelRequest), travelRequest.Id, "Assign", request.AdminUserId,
            $"{{\"assignedTo\":\"{request.AssignedAdminUserId}\"}}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record UpdateTravelRequestDealValueCommand(Guid Id, decimal Value, Currency Currency, Guid? AdminUserId) : IRequest<Result>;

public class UpdateTravelRequestDealValueCommandValidator : AbstractValidator<UpdateTravelRequestDealValueCommand>
{
    public UpdateTravelRequestDealValueCommandValidator()
    {
        RuleFor(x => x.Value).GreaterThan(0);
        RuleFor(x => x.Currency).IsInEnum();
    }
}

public class UpdateTravelRequestDealValueCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateTravelRequestDealValueCommand, Result>
{
    public async Task<Result> Handle(UpdateTravelRequestDealValueCommand request, CancellationToken cancellationToken)
    {
        var travelRequest = await db.TravelRequests.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (travelRequest is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Travel request not found."));

        travelRequest.SetDealValue(request.Value, request.Currency);

        db.AuditLogs.Add(new AuditLog(nameof(TravelRequest), travelRequest.Id, "SetDealValue", request.AdminUserId,
            $"{{\"value\":{request.Value},\"currency\":\"{request.Currency}\"}}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record UpdateNextFollowUpCommand(Guid Id, DateTime? Date, Guid? AdminUserId) : IRequest<Result>;

public class UpdateNextFollowUpCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateNextFollowUpCommand, Result>
{
    public async Task<Result> Handle(UpdateNextFollowUpCommand request, CancellationToken cancellationToken)
    {
        var travelRequest = await db.TravelRequests.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (travelRequest is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Travel request not found."));

        travelRequest.SetNextFollowUp(request.Date);

        db.AuditLogs.Add(new AuditLog(nameof(TravelRequest), travelRequest.Id, "SetFollowUp", request.AdminUserId,
            $"{{\"date\":\"{request.Date:o}\"}}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
