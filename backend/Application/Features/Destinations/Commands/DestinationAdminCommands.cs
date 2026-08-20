using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Destinations.Dtos;
using AeroTravel.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Destinations.Commands;

public record CreateDestinationCommand(UpsertDestinationInput Input, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class CreateDestinationCommandValidator : AbstractValidator<CreateDestinationCommand>
{
    public CreateDestinationCommandValidator()
    {
        RuleFor(x => x.Input.Slug).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Input.CityId).NotEmpty();
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class CreateDestinationCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateDestinationCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateDestinationCommand request, CancellationToken cancellationToken)
    {
        var input = request.Input;
        var slugTaken = await db.Destinations.AnyAsync(d => d.Slug == input.Slug, cancellationToken);
        if (slugTaken)
            return Result.Failure<Guid>(Error.Conflict("CONFLICT_DUPLICATE", "A destination with this slug already exists."));

        var destination = new Destination(input.CityId, input.Slug);
        destination.SetImages(input.HeroImageUrl, input.GalleryUrls);
        destination.SetPublishState(input.IsPublished, input.IsFeatured);
        destination.SetSortOrder(input.SortOrder);
        foreach (var t in input.Translations)
            destination.SetTranslation(t.Locale, t.Title, t.Summary, t.Description, t.Highlights, t.MetaTitle, t.MetaDescription);

        db.Destinations.Add(destination);
        db.AuditLogs.Add(new AuditLog(nameof(Destination), destination.Id, "Create", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(destination.Id);
    }
}

public record UpdateDestinationCommand(Guid Id, UpsertDestinationInput Input, Guid? AdminUserId) : IRequest<Result>;

public class UpdateDestinationCommandValidator : AbstractValidator<UpdateDestinationCommand>
{
    public UpdateDestinationCommandValidator()
    {
        RuleFor(x => x.Input.Slug).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Input.CityId).NotEmpty();
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class UpdateDestinationCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateDestinationCommand, Result>
{
    public async Task<Result> Handle(UpdateDestinationCommand request, CancellationToken cancellationToken)
    {
        // Translations must be loaded before SetTranslation mutates them — otherwise it never
        // finds the already-persisted rows to update and re-Adds them, causing a duplicate-PK
        // constraint violation on save (reproduced live; see docs/PROGRESS.md).
        var destination = await db.Destinations.Include(d => d.Translations)
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);
        if (destination is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Destination not found."));

        var slugTaken = await db.Destinations.AnyAsync(d => d.Slug == request.Input.Slug && d.Id != request.Id, cancellationToken);
        if (slugTaken)
            return Result.Failure(Error.Conflict("CONFLICT_DUPLICATE", "A destination with this slug already exists."));

        var input = request.Input;
        destination.SetCity(input.CityId);
        destination.SetSlug(input.Slug);
        destination.SetImages(input.HeroImageUrl, input.GalleryUrls);
        destination.SetPublishState(input.IsPublished, input.IsFeatured);
        destination.SetSortOrder(input.SortOrder);
        foreach (var t in input.Translations)
            destination.SetTranslation(t.Locale, t.Title, t.Summary, t.Description, t.Highlights, t.MetaTitle, t.MetaDescription);

        db.AuditLogs.Add(new AuditLog(nameof(Destination), destination.Id, "Update", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record DeleteDestinationCommand(Guid Id, Guid? AdminUserId) : IRequest<Result>;

public class DeleteDestinationCommandHandler(IApplicationDbContext db) : IRequestHandler<DeleteDestinationCommand, Result>
{
    public async Task<Result> Handle(DeleteDestinationCommand request, CancellationToken cancellationToken)
    {
        var destination = await db.Destinations.FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);
        if (destination is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Destination not found."));

        db.Destinations.Remove(destination);
        db.AuditLogs.Add(new AuditLog(nameof(Destination), destination.Id, "Delete", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
