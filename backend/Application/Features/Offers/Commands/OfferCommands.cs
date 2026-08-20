using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Offers.Dtos;
using AeroTravel.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Offers.Commands;

public record CreateOfferCommand(UpsertOfferInput Input, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class CreateOfferCommandValidator : AbstractValidator<CreateOfferCommand>
{
    public CreateOfferCommandValidator()
    {
        RuleFor(x => x.Input.Slug).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Input.PriceFrom).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class CreateOfferCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateOfferCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateOfferCommand request, CancellationToken cancellationToken)
    {
        var input = request.Input;
        var slugTaken = await db.Offers.AnyAsync(o => o.Slug == input.Slug, cancellationToken);
        if (slugTaken)
            return Result.Failure<Guid>(Error.Conflict("CONFLICT_DUPLICATE", "An offer with this slug already exists."));

        var referenceError = await ValidateReferencesAsync(db, input.DestinationId, input.ServiceIds, cancellationToken);
        if (referenceError is not null)
            return Result.Failure<Guid>(referenceError);

        var offer = new Offer(input.Slug, input.PriceFrom, input.Currency, input.DestinationId);
        offer.SetPricing(input.PriceFrom, input.Currency, input.DurationDays, input.ValidUntilUtc);
        offer.SetImages(input.GalleryUrls);
        offer.SetPublishState(input.IsPublished, input.IsFeatured);
        offer.SetSortOrder(input.SortOrder);
        offer.SetServices(input.ServiceIds);
        foreach (var t in input.Translations)
            offer.SetTranslation(t.Locale, t.Title, t.Summary, t.Description, t.MetaTitle, t.MetaDescription);

        db.Offers.Add(offer);
        db.AuditLogs.Add(new AuditLog(nameof(Offer), offer.Id, "Create", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(offer.Id);
    }

    internal static async Task<Error?> ValidateReferencesAsync(
        IApplicationDbContext db, Guid? destinationId, IReadOnlyList<Guid> serviceIds, CancellationToken cancellationToken)
    {
        if (destinationId is { } destId && !await db.Destinations.AnyAsync(d => d.Id == destId, cancellationToken))
            return Error.Validation("VALIDATION_FAILED", "Destination does not exist.");

        if (serviceIds.Count > 0)
        {
            var distinctIds = serviceIds.Distinct().ToList();
            var existingCount = await db.Services.CountAsync(s => distinctIds.Contains(s.Id), cancellationToken);
            if (existingCount != distinctIds.Count)
                return Error.Validation("VALIDATION_FAILED", "One or more services do not exist.");
        }

        return null;
    }
}

public record UpdateOfferCommand(Guid Id, UpsertOfferInput Input, Guid? AdminUserId) : IRequest<Result>;

public class UpdateOfferCommandValidator : AbstractValidator<UpdateOfferCommand>
{
    public UpdateOfferCommandValidator()
    {
        RuleFor(x => x.Input.Slug).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Input.PriceFrom).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class UpdateOfferCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateOfferCommand, Result>
{
    public async Task<Result> Handle(UpdateOfferCommand request, CancellationToken cancellationToken)
    {
        // Translations/OfferServices must be loaded before SetTranslation/SetServices mutate them —
        // otherwise those domain methods see an empty in-memory collection, never find the
        // already-persisted rows to update, and re-`Add()` them, causing a duplicate-PK constraint
        // violation on save. Reproduced live: PUT against a real Postgres-backed run 500'd with
        // "duplicate key value violates unique constraint PK_OfferTranslation" (see docs/PROGRESS.md).
        var offer = await db.Offers.Include(o => o.Translations).Include(o => o.OfferServices)
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);
        if (offer is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Offer not found."));

        var slugTaken = await db.Offers.AnyAsync(o => o.Slug == request.Input.Slug && o.Id != request.Id, cancellationToken);
        if (slugTaken)
            return Result.Failure(Error.Conflict("CONFLICT_DUPLICATE", "An offer with this slug already exists."));

        var referenceError = await CreateOfferCommandHandler.ValidateReferencesAsync(db, request.Input.DestinationId, request.Input.ServiceIds, cancellationToken);
        if (referenceError is not null)
            return Result.Failure(referenceError);

        var input = request.Input;
        offer.SetSlug(input.Slug);
        offer.SetDestination(input.DestinationId);
        offer.SetPricing(input.PriceFrom, input.Currency, input.DurationDays, input.ValidUntilUtc);
        offer.SetImages(input.GalleryUrls);
        offer.SetPublishState(input.IsPublished, input.IsFeatured);
        offer.SetSortOrder(input.SortOrder);
        offer.SetServices(input.ServiceIds);
        foreach (var t in input.Translations)
            offer.SetTranslation(t.Locale, t.Title, t.Summary, t.Description, t.MetaTitle, t.MetaDescription);

        db.AuditLogs.Add(new AuditLog(nameof(Offer), offer.Id, "Update", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record DeleteOfferCommand(Guid Id, Guid? AdminUserId) : IRequest<Result>;

public class DeleteOfferCommandHandler(IApplicationDbContext db) : IRequestHandler<DeleteOfferCommand, Result>
{
    public async Task<Result> Handle(DeleteOfferCommand request, CancellationToken cancellationToken)
    {
        var offer = await db.Offers.FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);
        if (offer is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Offer not found."));

        db.Offers.Remove(offer);
        db.AuditLogs.Add(new AuditLog(nameof(Offer), offer.Id, "Delete", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
