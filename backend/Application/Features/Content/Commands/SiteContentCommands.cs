using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Content.Dtos;
using AeroTravel.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Content.Commands;

public record CreateSiteContentCommand(UpsertSiteContentInput Input, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class CreateSiteContentCommandValidator : AbstractValidator<CreateSiteContentCommand>
{
    public CreateSiteContentCommandValidator()
    {
        RuleFor(x => x.Input.Key).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class CreateSiteContentCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateSiteContentCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateSiteContentCommand request, CancellationToken cancellationToken)
    {
        var input = request.Input;
        var keyTaken = await db.SiteContents.AnyAsync(s => s.Key == input.Key, cancellationToken);
        if (keyTaken)
            return Result.Failure<Guid>(Error.Conflict("CONFLICT_DUPLICATE", "Site content with this key already exists."));

        var content = new SiteContent(input.Key);
        foreach (var t in input.Translations)
            content.SetTranslation(t.Locale, t.Title, t.Body, t.ExtraJson);

        db.SiteContents.Add(content);
        db.AuditLogs.Add(new AuditLog(nameof(SiteContent), content.Id, "Create", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(content.Id);
    }
}

public record UpdateSiteContentCommand(Guid Id, UpsertSiteContentInput Input, Guid? AdminUserId) : IRequest<Result>;

public class UpdateSiteContentCommandValidator : AbstractValidator<UpdateSiteContentCommand>
{
    public UpdateSiteContentCommandValidator()
    {
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class UpdateSiteContentCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateSiteContentCommand, Result>
{
    public async Task<Result> Handle(UpdateSiteContentCommand request, CancellationToken cancellationToken)
    {
        // Translations must be loaded before SetTranslation mutates them — otherwise it never
        // finds the already-persisted rows to update and re-Adds them, causing a duplicate-PK
        // constraint violation on save (reproduced live; see docs/PROGRESS.md).
        var content = await db.SiteContents.Include(s => s.Translations)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (content is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Site content not found."));

        foreach (var t in request.Input.Translations)
            content.SetTranslation(t.Locale, t.Title, t.Body, t.ExtraJson);

        db.AuditLogs.Add(new AuditLog(nameof(SiteContent), content.Id, "Update", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record DeleteSiteContentCommand(Guid Id, Guid? AdminUserId) : IRequest<Result>;

public class DeleteSiteContentCommandHandler(IApplicationDbContext db) : IRequestHandler<DeleteSiteContentCommand, Result>
{
    public async Task<Result> Handle(DeleteSiteContentCommand request, CancellationToken cancellationToken)
    {
        var content = await db.SiteContents.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (content is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Site content not found."));

        db.SiteContents.Remove(content);
        db.AuditLogs.Add(new AuditLog(nameof(SiteContent), content.Id, "Delete", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
