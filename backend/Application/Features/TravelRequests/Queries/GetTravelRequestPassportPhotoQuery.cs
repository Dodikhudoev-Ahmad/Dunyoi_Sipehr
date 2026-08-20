using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.TravelRequests.Queries;

public record TravelRequestPassportPhotoDto(Stream Content, string ContentType);

/// Streams a single passport photo back to an authenticated admin. Deliberately scoped by
/// TravelRequestId + FileName together (not just FileName) — the filename alone is an
/// unguessable GUID, but this extra check means even a leaked/guessed filename that happens to
/// belong to a *different* request's photo won't resolve, and it keeps the authorization check
/// (an admin can only fetch photos attached to a real request) enforced in one place rather than
/// relying solely on filename secrecy.
public record GetTravelRequestPassportPhotoQuery(Guid TravelRequestId, string FileName) : IRequest<Result<TravelRequestPassportPhotoDto>>;

public class GetTravelRequestPassportPhotoQueryHandler(IReadDbContext db, IFileStorageService fileStorage)
    : IRequestHandler<GetTravelRequestPassportPhotoQuery, Result<TravelRequestPassportPhotoDto>>
{
    private static readonly Dictionary<string, string> ContentTypesByExtension = new()
    {
        [".jpg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
        [".gif"] = "image/gif",
    };

    public async Task<Result<TravelRequestPassportPhotoDto>> Handle(GetTravelRequestPassportPhotoQuery request, CancellationToken cancellationToken)
    {
        var paths = await db.TravelRequests
            .Where(t => t.Id == request.TravelRequestId)
            .Select(t => t.PassportPhotoPaths)
            .FirstOrDefaultAsync(cancellationToken);

        if (paths is null || !paths.Contains(request.FileName))
            return Result.Failure<TravelRequestPassportPhotoDto>(Error.NotFound("NOT_FOUND", "Passport photo not found."));

        var stream = await fileStorage.OpenReadAsync(request.FileName, cancellationToken);
        if (stream is null)
            return Result.Failure<TravelRequestPassportPhotoDto>(Error.NotFound("NOT_FOUND", "Passport photo not found."));

        var extension = Path.GetExtension(request.FileName);
        var contentType = ContentTypesByExtension.GetValueOrDefault(extension, "application/octet-stream");
        return Result.Success(new TravelRequestPassportPhotoDto(stream, contentType));
    }
}
