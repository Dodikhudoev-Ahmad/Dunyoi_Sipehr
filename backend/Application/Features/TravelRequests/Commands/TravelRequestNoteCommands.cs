using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.TravelRequests.Dtos;
using AeroTravel.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.TravelRequests.Commands;

/// AuthorAdminUserId always comes from the authenticated caller (controller passes
/// CurrentAdminUserId), never from the request body — authorship can't be forged.
public record CreateTravelRequestNoteCommand(Guid TravelRequestId, string Text, Guid AuthorAdminUserId) : IRequest<Result<TravelRequestNoteDto>>;

public class CreateTravelRequestNoteCommandValidator : AbstractValidator<CreateTravelRequestNoteCommand>
{
    public CreateTravelRequestNoteCommandValidator()
    {
        RuleFor(x => x.Text).NotEmpty().MaximumLength(2000);
    }
}

public class CreateTravelRequestNoteCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateTravelRequestNoteCommand, Result<TravelRequestNoteDto>>
{
    public async Task<Result<TravelRequestNoteDto>> Handle(CreateTravelRequestNoteCommand request, CancellationToken cancellationToken)
    {
        var exists = await db.TravelRequests.AnyAsync(t => t.Id == request.TravelRequestId, cancellationToken);
        if (!exists)
            return Result.Failure<TravelRequestNoteDto>(Error.NotFound("NOT_FOUND", "Travel request not found."));

        var author = await db.AdminUsers.FirstOrDefaultAsync(a => a.Id == request.AuthorAdminUserId, cancellationToken);
        if (author is null)
            return Result.Failure<TravelRequestNoteDto>(Error.Unauthorized("UNAUTHORIZED", "Author not found."));

        var note = new TravelRequestNote(request.TravelRequestId, request.AuthorAdminUserId, request.Text.Trim());
        db.TravelRequestNotes.Add(note);
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(new TravelRequestNoteDto(note.Id, note.TravelRequestId, note.Text, note.CreatedAtUtc, author.Id, author.DisplayName));
    }
}
