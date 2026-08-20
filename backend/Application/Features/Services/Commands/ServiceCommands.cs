using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Services.Dtos;
using AeroTravel.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Services.Commands;

public record CreateServiceCommand(UpsertServiceInput Input, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class CreateServiceCommandValidator : AbstractValidator<CreateServiceCommand>
{
    public CreateServiceCommandValidator()
    {
        RuleFor(x => x.Input.Icon).NotEmpty();
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class CreateServiceCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateServiceCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateServiceCommand request, CancellationToken cancellationToken)
    {
        var input = request.Input;
        var service = new Service(input.Icon);
        service.SetPublishState(input.IsPublished);
        service.SetSortOrder(input.SortOrder);
        foreach (var t in input.Translations)
            service.SetTranslation(t.Locale, t.Name, t.Description);

        db.Services.Add(service);
        db.AuditLogs.Add(new AuditLog(nameof(Service), service.Id, "Create", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(service.Id);
    }
}

public record UpdateServiceCommand(Guid Id, UpsertServiceInput Input, Guid? AdminUserId) : IRequest<Result>;

public class UpdateServiceCommandValidator : AbstractValidator<UpdateServiceCommand>
{
    public UpdateServiceCommandValidator()
    {
        RuleFor(x => x.Input.Icon).NotEmpty();
        RuleFor(x => x.Input.Translations).NotEmpty();
    }
}

public class UpdateServiceCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateServiceCommand, Result>
{
    public async Task<Result> Handle(UpdateServiceCommand request, CancellationToken cancellationToken)
    {
        // Translations must be loaded before SetTranslation mutates them — otherwise it never
        // finds the already-persisted rows to update and re-Adds them, causing a duplicate-PK
        // constraint violation on save (reproduced live; see docs/PROGRESS.md).
        var service = await db.Services.Include(s => s.Translations)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (service is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Service not found."));

        service.SetIcon(request.Input.Icon);
        service.SetPublishState(request.Input.IsPublished);
        service.SetSortOrder(request.Input.SortOrder);
        foreach (var t in request.Input.Translations)
            service.SetTranslation(t.Locale, t.Name, t.Description);

        db.AuditLogs.Add(new AuditLog(nameof(Service), service.Id, "Update", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record DeleteServiceCommand(Guid Id, Guid? AdminUserId) : IRequest<Result>;

public class DeleteServiceCommandHandler(IApplicationDbContext db) : IRequestHandler<DeleteServiceCommand, Result>
{
    public async Task<Result> Handle(DeleteServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await db.Services.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (service is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Service not found."));

        db.Services.Remove(service);
        db.AuditLogs.Add(new AuditLog(nameof(Service), service.Id, "Delete", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
