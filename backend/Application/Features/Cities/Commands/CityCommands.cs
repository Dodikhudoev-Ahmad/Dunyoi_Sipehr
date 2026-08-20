using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Cities.Dtos;
using AeroTravel.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Cities.Commands;

public record CreateCityCommand(UpsertCityInput Input, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class CreateCityCommandValidator : AbstractValidator<CreateCityCommand>
{
    public CreateCityCommandValidator()
    {
        RuleFor(x => x.Input.CountryId).NotEmpty();
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class CreateCityCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateCityCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateCityCommand request, CancellationToken cancellationToken)
    {
        var input = request.Input;
        var countryExists = await db.Countries.AnyAsync(c => c.Id == input.CountryId, cancellationToken);
        if (!countryExists)
            return Result.Failure<Guid>(Error.Validation("VALIDATION_FAILED", "Country does not exist."));

        var city = new City(input.CountryId, input.SortOrder);
        foreach (var t in input.Translations)
            city.SetTranslation(t.Locale, t.Name);

        db.Cities.Add(city);
        db.AuditLogs.Add(new AuditLog(nameof(City), city.Id, "Create", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(city.Id);
    }
}

public record UpdateCityCommand(Guid Id, UpsertCityInput Input, Guid? AdminUserId) : IRequest<Result>;

public class UpdateCityCommandValidator : AbstractValidator<UpdateCityCommand>
{
    public UpdateCityCommandValidator()
    {
        RuleFor(x => x.Input.CountryId).NotEmpty();
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class UpdateCityCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateCityCommand, Result>
{
    public async Task<Result> Handle(UpdateCityCommand request, CancellationToken cancellationToken)
    {
        // Translations must be loaded before SetTranslation mutates them — otherwise it never
        // finds the already-persisted rows to update and re-Adds them, causing a duplicate-PK
        // constraint violation on save (reproduced live; see docs/PROGRESS.md).
        var city = await db.Cities.Include(c => c.Translations)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (city is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "City not found."));

        var countryExists = await db.Countries.AnyAsync(c => c.Id == request.Input.CountryId, cancellationToken);
        if (!countryExists)
            return Result.Failure(Error.Validation("VALIDATION_FAILED", "Country does not exist."));

        city.Update(request.Input.CountryId, request.Input.SortOrder);
        foreach (var t in request.Input.Translations)
            city.SetTranslation(t.Locale, t.Name);

        db.AuditLogs.Add(new AuditLog(nameof(City), city.Id, "Update", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record DeleteCityCommand(Guid Id, Guid? AdminUserId) : IRequest<Result>;

public class DeleteCityCommandHandler(IApplicationDbContext db) : IRequestHandler<DeleteCityCommand, Result>
{
    public async Task<Result> Handle(DeleteCityCommand request, CancellationToken cancellationToken)
    {
        var city = await db.Cities.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (city is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "City not found."));

        var hasDestinations = await db.Destinations.AnyAsync(d => d.CityId == request.Id, cancellationToken);
        if (hasDestinations)
            return Result.Failure(Error.Conflict("CONFLICT_HAS_CHILDREN", "City still has destinations; delete them first."));

        db.Cities.Remove(city);
        db.AuditLogs.Add(new AuditLog(nameof(City), city.Id, "Delete", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
