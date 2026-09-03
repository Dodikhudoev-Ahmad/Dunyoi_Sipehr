using AeroTravel.Application.Common;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using FluentValidation;
using MediatR;

namespace AeroTravel.Application.Features.TravelRequests.Commands;

/// A single passport/ID photo upload, called once per file from the Travel Request form before
/// the form itself is submitted (see CreateTravelRequestCommand.PassportPhotoPaths). Returns the
/// server-generated filename the client then references on submit — the client never controls
/// the stored name, which rules out path traversal at the storage layer entirely.
public record UploadPassportPhotoCommand(Stream Content, long LengthBytes) : IRequest<Result<string>>;

public class UploadPassportPhotoCommandValidator : AbstractValidator<UploadPassportPhotoCommand>
{
    public const long MaxSizeBytes = 4 * 1024 * 1024; // 4 MB, per the ask

    public UploadPassportPhotoCommandValidator()
    {
        RuleFor(x => x.LengthBytes).InclusiveBetween(1, MaxSizeBytes)
            .WithMessage("Image must be no larger than 4 MB.");
    }
}

public class UploadPassportPhotoCommandHandler(IFileStorageService fileStorage) : IRequestHandler<UploadPassportPhotoCommand, Result<string>>
{
    public async Task<Result<string>> Handle(UploadPassportPhotoCommand request, CancellationToken cancellationToken)
    {
        // Sniff the real file type from content, not the client-supplied Content-Type/extension
        // (trivially spoofable) — read just enough header bytes to identify the format, then
        // rewind before handing the full stream to storage.
        var header = new byte[16];
        var read = await request.Content.ReadAsync(header.AsMemory(0, header.Length), cancellationToken);
        request.Content.Position = 0;

        var extension = ImageSignature.DetectExtension(header.AsSpan(0, read));
        if (extension is null)
            return Result.Failure<string>(Error.Validation("VALIDATION_FAILED", "File is not a recognized image format (JPEG, PNG, WEBP, GIF)."));

        var fileName = await fileStorage.SaveAsync(request.Content, extension, cancellationToken);
        return Result.Success(fileName);
    }
}
