using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Content.Dtos;
using AeroTravel.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Content.Commands;

public record CreateFaqItemCommand(UpsertFaqItemInput Input, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class CreateFaqItemCommandValidator : AbstractValidator<CreateFaqItemCommand>
{
    public CreateFaqItemCommandValidator()
    {
        RuleFor(x => x.Input.Category).NotEmpty();
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class CreateFaqItemCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateFaqItemCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateFaqItemCommand request, CancellationToken cancellationToken)
    {
        var input = request.Input;
        var faq = new FaqItem(input.Category);
        faq.SetPublishState(input.IsPublished);
        faq.SetSortOrder(input.SortOrder);
        foreach (var t in input.Translations)
            faq.SetTranslation(t.Locale, t.Question, t.Answer);

        db.FaqItems.Add(faq);
        db.AuditLogs.Add(new AuditLog(nameof(FaqItem), faq.Id, "Create", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(faq.Id);
    }
}

public record UpdateFaqItemCommand(Guid Id, UpsertFaqItemInput Input, Guid? AdminUserId) : IRequest<Result>;

public class UpdateFaqItemCommandValidator : AbstractValidator<UpdateFaqItemCommand>
{
    public UpdateFaqItemCommandValidator()
    {
        RuleFor(x => x.Input.Category).NotEmpty();
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class UpdateFaqItemCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateFaqItemCommand, Result>
{
    public async Task<Result> Handle(UpdateFaqItemCommand request, CancellationToken cancellationToken)
    {
        // Translations must be loaded before SetTranslation mutates them — otherwise it never
        // finds the already-persisted rows to update and re-Adds them, causing a duplicate-PK
        // constraint violation on save (reproduced live; see docs/PROGRESS.md).
        var faq = await db.FaqItems.Include(f => f.Translations)
            .FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken);
        if (faq is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "FAQ item not found."));

        var input = request.Input;
        faq.SetCategory(input.Category);
        faq.SetPublishState(input.IsPublished);
        faq.SetSortOrder(input.SortOrder);
        foreach (var t in input.Translations)
            faq.SetTranslation(t.Locale, t.Question, t.Answer);

        db.AuditLogs.Add(new AuditLog(nameof(FaqItem), faq.Id, "Update", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record DeleteFaqItemCommand(Guid Id, Guid? AdminUserId) : IRequest<Result>;

public class DeleteFaqItemCommandHandler(IApplicationDbContext db) : IRequestHandler<DeleteFaqItemCommand, Result>
{
    public async Task<Result> Handle(DeleteFaqItemCommand request, CancellationToken cancellationToken)
    {
        var faq = await db.FaqItems.FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken);
        if (faq is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "FAQ item not found."));

        db.FaqItems.Remove(faq);
        db.AuditLogs.Add(new AuditLog(nameof(FaqItem), faq.Id, "Delete", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
