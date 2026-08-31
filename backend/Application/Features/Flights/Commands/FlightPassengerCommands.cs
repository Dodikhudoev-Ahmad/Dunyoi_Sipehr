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
