using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Content.Dtos;
using AeroTravel.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Content.Commands;

public record CreateTestimonialCommand(UpsertTestimonialInput Input, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class CreateTestimonialCommandValidator : AbstractValidator<CreateTestimonialCommand>
{
    public CreateTestimonialCommandValidator()
    {
        RuleFor(x => x.Input.AuthorName).NotEmpty();
        RuleFor(x => x.Input.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class CreateTestimonialCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateTestimonialCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateTestimonialCommand request, CancellationToken cancellationToken)
    {
        var input = request.Input;
        var testimonial = new Testimonial(input.AuthorName, input.AuthorCountry, input.Rating);
        testimonial.SetAvatar(input.AvatarUrl);
        testimonial.SetPublishState(input.IsPublished);
        testimonial.SetSortOrder(input.SortOrder);
        foreach (var t in input.Translations)
            testimonial.SetTranslation(t.Locale, t.Quote);

        db.Testimonials.Add(testimonial);
        db.AuditLogs.Add(new AuditLog(nameof(Testimonial), testimonial.Id, "Create", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(testimonial.Id);
    }
}

public record UpdateTestimonialCommand(Guid Id, UpsertTestimonialInput Input, Guid? AdminUserId) : IRequest<Result>;

public class UpdateTestimonialCommandValidator : AbstractValidator<UpdateTestimonialCommand>
{
    public UpdateTestimonialCommandValidator()
    {
        RuleFor(x => x.Input.AuthorName).NotEmpty();
        RuleFor(x => x.Input.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class UpdateTestimonialCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateTestimonialCommand, Result>
{
    public async Task<Result> Handle(UpdateTestimonialCommand request, CancellationToken cancellationToken)
    {
        // Translations must be loaded before SetTranslation mutates them — otherwise it never
        // finds the already-persisted rows to update and re-Adds them, causing a duplicate-PK
        // constraint violation on save (reproduced live; see docs/PROGRESS.md).
        var testimonial = await db.Testimonials.Include(t => t.Translations)
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (testimonial is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Testimonial not found."));

        var input = request.Input;
        testimonial.UpdateAuthor(input.AuthorName, input.AuthorCountry, input.Rating);
        testimonial.SetAvatar(input.AvatarUrl);
        testimonial.SetPublishState(input.IsPublished);
        testimonial.SetSortOrder(input.SortOrder);
        foreach (var t in input.Translations)
            testimonial.SetTranslation(t.Locale, t.Quote);

        db.AuditLogs.Add(new AuditLog(nameof(Testimonial), testimonial.Id, "Update", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record DeleteTestimonialCommand(Guid Id, Guid? AdminUserId) : IRequest<Result>;

public class DeleteTestimonialCommandHandler(IApplicationDbContext db) : IRequestHandler<DeleteTestimonialCommand, Result>
{
    public async Task<Result> Handle(DeleteTestimonialCommand request, CancellationToken cancellationToken)
    {
        var testimonial = await db.Testimonials.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (testimonial is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Testimonial not found."));

        db.Testimonials.Remove(testimonial);
        db.AuditLogs.Add(new AuditLog(nameof(Testimonial), testimonial.Id, "Delete", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
