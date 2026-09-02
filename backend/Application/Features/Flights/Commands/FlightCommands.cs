using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Flights.Dtos;
using AeroTravel.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Flights.Commands;

public record CreateFlightCommand(UpsertFlightInput Input, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class CreateFlightCommandValidator : AbstractValidator<CreateFlightCommand>
{
    public CreateFlightCommandValidator()
    {
        RuleFor(x => x.Input.FlightNumber).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Input.OriginCityId).NotEmpty();
        RuleFor(x => x.Input.DestinationCityId).NotEmpty();
        RuleFor(x => x.Input.DestinationCityId).NotEqual(x => x.Input.OriginCityId)
            .WithMessage("Origin and destination city must be different.");
        RuleFor(x => x.Input.Status).IsInEnum();
    }
}

public class CreateFlightCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateFlightCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateFlightCommand request, CancellationToken cancellationToken)
    {
        var input = request.Input;

        var numberTaken = await db.Flights.AnyAsync(f => f.FlightNumber == input.FlightNumber, cancellationToken);
        if (numberTaken)
            return Result.Failure<Guid>(Error.Conflict("CONFLICT_DUPLICATE", "A flight with this number already exists."));

        var cityIds = await db.Cities
            .Where(c => c.Id == input.OriginCityId || c.Id == input.DestinationCityId)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);
        if (!cityIds.Contains(input.OriginCityId) || !cityIds.Contains(input.DestinationCityId))
            return Result.Failure<Guid>(Error.NotFound("NOT_FOUND", "Origin or destination city not found."));

        var flight = new Flight(input.FlightNumber, input.OriginCityId, input.DestinationCityId, input.DepartureAtUtc, request.AdminUserId);

        db.Flights.Add(flight);
        db.AuditLogs.Add(new AuditLog(nameof(Flight), flight.Id, "Create", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(flight.Id);
    }
}

public record UpdateFlightCommand(Guid Id, UpsertFlightInput Input, Guid? AdminUserId) : IRequest<Result>;

public class UpdateFlightCommandValidator : AbstractValidator<UpdateFlightCommand>
{
    public UpdateFlightCommandValidator()
    {
        RuleFor(x => x.Input.FlightNumber).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Input.OriginCityId).NotEmpty();
        RuleFor(x => x.Input.DestinationCityId).NotEmpty();
        RuleFor(x => x.Input.DestinationCityId).NotEqual(x => x.Input.OriginCityId)
            .WithMessage("Origin and destination city must be different.");
        RuleFor(x => x.Input.Status).IsInEnum();
    }
}

public class UpdateFlightCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateFlightCommand, Result>
{
    public async Task<Result> Handle(UpdateFlightCommand request, CancellationToken cancellationToken)
    {
        var flight = await db.Flights.FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken);
        if (flight is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Flight not found."));

        var input = request.Input;

        var numberTaken = await db.Flights.AnyAsync(f => f.FlightNumber == input.FlightNumber && f.Id != request.Id, cancellationToken);
        if (numberTaken)
            return Result.Failure(Error.Conflict("CONFLICT_DUPLICATE", "A flight with this number already exists."));

        var cityIds = await db.Cities
            .Where(c => c.Id == input.OriginCityId || c.Id == input.DestinationCityId)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);
        if (!cityIds.Contains(input.OriginCityId) || !cityIds.Contains(input.DestinationCityId))
            return Result.Failure(Error.NotFound("NOT_FOUND", "Origin or destination city not found."));

        flight.Update(input.FlightNumber, input.OriginCityId, input.DestinationCityId, input.DepartureAtUtc, input.Status);

        db.AuditLogs.Add(new AuditLog(nameof(Flight), flight.Id, "Update", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record DeleteFlightCommand(Guid Id, Guid? AdminUserId) : IRequest<Result>;

public class DeleteFlightCommandHandler(IApplicationDbContext db) : IRequestHandler<DeleteFlightCommand, Result>
{
    public async Task<Result> Handle(DeleteFlightCommand request, CancellationToken cancellationToken)
    {
        var flight = await db.Flights.FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken);
        if (flight is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Flight not found."));

        db.Flights.Remove(flight);
        db.AuditLogs.Add(new AuditLog(nameof(Flight), flight.Id, "Delete", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
