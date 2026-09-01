using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Flights.Commands;

public record AddManualFlightPassengerCommand(Guid FlightId, string FullName, string Phone, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class AddManualFlightPassengerCommandValidator : AbstractValidator<AddManualFlightPassengerCommand>
{
    public AddManualFlightPassengerCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(50);
    }
}

public class AddManualFlightPassengerCommandHandler(IApplicationDbContext db) : IRequestHandler<AddManualFlightPassengerCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddManualFlightPassengerCommand request, CancellationToken cancellationToken)
    {
        var flightExists = await db.Flights.AnyAsync(f => f.Id == request.FlightId, cancellationToken);
        if (!flightExists)
            return Result.Failure<Guid>(Error.NotFound("NOT_FOUND", "Flight not found."));

        var passenger = new FlightPassenger(request.FlightId, FlightPassengerSource.Manual, null, request.FullName, request.Phone, request.AdminUserId);

        db.FlightPassengers.Add(passenger);
        db.AuditLogs.Add(new AuditLog(nameof(FlightPassenger), passenger.Id, "Add", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(passenger.Id);
    }
}

public record AddFlightPassengerFromRequestCommand(Guid FlightId, Guid TravelRequestId, string FullName, string Phone, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class AddFlightPassengerFromRequestCommandValidator : AbstractValidator<AddFlightPassengerFromRequestCommand>
{
    public AddFlightPassengerFromRequestCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(50);
    }
}

public class AddFlightPassengerFromRequestCommandHandler(IApplicationDbContext db) : IRequestHandler<AddFlightPassengerFromRequestCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddFlightPassengerFromRequestCommand request, CancellationToken cancellationToken)
    {
        var flightExists = await db.Flights.AnyAsync(f => f.Id == request.FlightId, cancellationToken);
        if (!flightExists)
            return Result.Failure<Guid>(Error.NotFound("NOT_FOUND", "Flight not found."));

        var travelRequestExists = await db.TravelRequests.AnyAsync(t => t.Id == request.TravelRequestId, cancellationToken);
        if (!travelRequestExists)
            return Result.Failure<Guid>(Error.NotFound("NOT_FOUND", "Travel request not found."));

        var alreadyOnFlight = await db.FlightPassengers.AnyAsync(
            p => p.FlightId == request.FlightId && p.TravelRequestId == request.TravelRequestId, cancellationToken);
        if (alreadyOnFlight)
            return Result.Failure<Guid>(Error.Conflict("CONFLICT_DUPLICATE", "This client is already on the flight's manifest."));

        var passenger = new FlightPassenger(
            request.FlightId, FlightPassengerSource.Crm, request.TravelRequestId, request.FullName, request.Phone, request.AdminUserId);

        db.FlightPassengers.Add(passenger);
        db.AuditLogs.Add(new AuditLog(nameof(FlightPassenger), passenger.Id, "Add", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(passenger.Id);
    }
}

/// SuperAdmin-only (enforced by [Authorize(Roles = ...)] on the controller action, not just this
/// handler) — moves a passenger from whichever flight they're currently on to a different one.
/// Validation order matches the product spec exactly: passenger exists, target flight exists,
/// target isn't the passenger's current flight, then — for a CRM-sourced passenger — the target
/// flight doesn't already have that same TravelRequest on its manifest (the DB has a unique
/// index on (FlightId, TravelRequestId) for exactly this; checked here first so a real conflict
/// comes back as a clear 409, not a raw SQL exception from SaveChangesAsync).
public record TransferFlightPassengerCommand(Guid PassengerId, Guid TargetFlightId, Guid? AdminUserId) : IRequest<Result>;

public class TransferFlightPassengerCommandHandler(IApplicationDbContext db) : IRequestHandler<TransferFlightPassengerCommand, Result>
{
    public async Task<Result> Handle(TransferFlightPassengerCommand request, CancellationToken cancellationToken)
    {
        var passenger = await db.FlightPassengers.FirstOrDefaultAsync(p => p.Id == request.PassengerId, cancellationToken);
        if (passenger is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Passenger not found."));

        var targetFlightExists = await db.Flights.AnyAsync(f => f.Id == request.TargetFlightId, cancellationToken);
        if (!targetFlightExists)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Target flight not found."));

        if (request.TargetFlightId == passenger.FlightId)
            return Result.Failure(Error.Validation("VALIDATION_FAILED", "Passenger is already on this flight."));

        if (passenger.TravelRequestId is { } travelRequestId)
        {
            var alreadyOnTargetFlight = await db.FlightPassengers.AnyAsync(
                p => p.FlightId == request.TargetFlightId && p.TravelRequestId == travelRequestId, cancellationToken);
            if (alreadyOnTargetFlight)
                return Result.Failure(Error.Conflict("CONFLICT_DUPLICATE", "This client is already on the selected flight."));
        }

        var fromFlightId = passenger.FlightId;
        passenger.TransferToFlight(request.TargetFlightId);

        db.AuditLogs.Add(new AuditLog(nameof(FlightPassenger), passenger.Id, "Transfer", request.AdminUserId,
            $"{{\"fromFlightId\":\"{fromFlightId}\",\"toFlightId\":\"{request.TargetFlightId}\"}}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record DeleteFlightPassengerCommand(Guid FlightId, Guid PassengerId, Guid? AdminUserId) : IRequest<Result>;

public class DeleteFlightPassengerCommandHandler(IApplicationDbContext db) : IRequestHandler<DeleteFlightPassengerCommand, Result>
{
    public async Task<Result> Handle(DeleteFlightPassengerCommand request, CancellationToken cancellationToken)
    {
        var passenger = await db.FlightPassengers.FirstOrDefaultAsync(
            p => p.Id == request.PassengerId && p.FlightId == request.FlightId, cancellationToken);
        if (passenger is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Passenger not found."));

        db.FlightPassengers.Remove(passenger);
        db.AuditLogs.Add(new AuditLog(nameof(FlightPassenger), passenger.Id, "Delete", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
