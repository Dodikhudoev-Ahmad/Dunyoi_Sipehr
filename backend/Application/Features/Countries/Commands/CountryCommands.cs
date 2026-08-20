using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Countries.Dtos;
using AeroTravel.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Countries.Commands;

public record CreateCountryCommand(UpsertCountryInput Input, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class CreateCountryCommandValidator : AbstractValidator<CreateCountryCommand>
{
    public CreateCountryCommandValidator()
    {
        RuleFor(x => x.Input.IsoCode).NotEmpty().Length(2);
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class CreateCountryCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateCountryCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateCountryCommand request, CancellationToken cancellationToken)
    {
        var input = request.Input;
        var iso = input.IsoCode.ToUpperInvariant();
        var exists = await db.Countries.AnyAsync(c => c.IsoCode == iso, cancellationToken);
        if (exists)
            return Result.Failure<Guid>(Error.Conflict("CONFLICT_DUPLICATE", "Country with this ISO code already exists."));

        var country = new Country(input.IsoCode, input.SortOrder);
        foreach (var t in input.Translations)
            country.SetTranslation(t.Locale, t.Name);

        db.Countries.Add(country);
        db.AuditLogs.Add(new AuditLog(nameof(Country), country.Id, "Create", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(country.Id);
    }
}

public record UpdateCountryCommand(Guid Id, UpsertCountryInput Input, Guid? AdminUserId) : IRequest<Result>;

public class UpdateCountryCommandValidator : AbstractValidator<UpdateCountryCommand>
{
    public UpdateCountryCommandValidator()
    {
        RuleFor(x => x.Input.IsoCode).NotEmpty().Length(2);
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class UpdateCountryCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateCountryCommand, Result>
{
    public async Task<Result> Handle(UpdateCountryCommand request, CancellationToken cancellationToken)
    {
        // Translations must be loaded before SetTranslation mutates them — otherwise it never
        // finds the already-persisted rows to update and re-Adds them, causing a duplicate-PK
        // constraint violation on save (reproduced live; see docs/PROGRESS.md).
        var country = await db.Countries.Include(c => c.Translations)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (country is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Country not found."));

        var iso = request.Input.IsoCode.ToUpperInvariant();
        var duplicate = await db.Countries.AnyAsync(c => c.IsoCode == iso && c.Id != request.Id, cancellationToken);
        if (duplicate)
            return Result.Failure(Error.Conflict("CONFLICT_DUPLICATE", "Country with this ISO code already exists."));

        country.Update(request.Input.IsoCode, request.Input.SortOrder);
        foreach (var t in request.Input.Translations)
            country.SetTranslation(t.Locale, t.Name);

        db.AuditLogs.Add(new AuditLog(nameof(Country), country.Id, "Update", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record DeleteCountryCommand(Guid Id, Guid? AdminUserId) : IRequest<Result>;

public class DeleteCountryCommandHandler(IApplicationDbContext db) : IRequestHandler<DeleteCountryCommand, Result>
{
    public async Task<Result> Handle(DeleteCountryCommand request, CancellationToken cancellationToken)
    {
        var country = await db.Countries.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (country is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Country not found."));

        var hasCities = await db.Cities.AnyAsync(c => c.CountryId == request.Id, cancellationToken);
        if (hasCities)
            return Result.Failure(Error.Conflict("CONFLICT_HAS_CHILDREN", "Country still has cities; delete them first."));

        db.Countries.Remove(country);
        db.AuditLogs.Add(new AuditLog(nameof(Country), country.Id, "Delete", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
