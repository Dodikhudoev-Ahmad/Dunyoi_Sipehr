using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Finance.Dtos;
using AeroTravel.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Application.Features.Finance.Commands;

public record CreatePaymentCommand(UpsertPaymentInput Input, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class CreatePaymentCommandValidator : AbstractValidator<CreatePaymentCommand>
{
    public CreatePaymentCommandValidator()
    {
        RuleFor(x => x.Input.Amount).GreaterThan(0);
        RuleFor(x => x.Input.ClientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Input.Method).IsInEnum();
        RuleFor(x => x.Input.Comment).MaximumLength(500);
    }
}

public class CreatePaymentCommandHandler(IApplicationDbContext db, IDateTimeProvider clock) : IRequestHandler<CreatePaymentCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreatePaymentCommand request, CancellationToken cancellationToken)
    {
        var input = request.Input;

        if (input.TravelRequestId is { } trId && !await db.TravelRequests.AnyAsync(t => t.Id == trId, cancellationToken))
            return Result.Failure<Guid>(Error.NotFound("NOT_FOUND", "Travel request not found."));
        if (input.FlightId is { } flId && !await db.Flights.AnyAsync(f => f.Id == flId, cancellationToken))
            return Result.Failure<Guid>(Error.NotFound("NOT_FOUND", "Flight not found."));

        // Always today's server date — never client-supplied (see UpsertPaymentInput doc comment).
        var paidOnUtc = DateOnly.FromDateTime(clock.UtcNow);
        var payment = new Payment(input.Amount, paidOnUtc, input.ClientName, input.TravelRequestId, input.FlightId, input.Method, input.Comment, request.AdminUserId);

        db.Payments.Add(payment);
        db.AuditLogs.Add(new AuditLog(nameof(Payment), payment.Id, "Create", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(payment.Id);
    }
}

public record DeletePaymentCommand(Guid Id, Guid? AdminUserId) : IRequest<Result>;

public class DeletePaymentCommandHandler(IApplicationDbContext db) : IRequestHandler<DeletePaymentCommand, Result>
{
    public async Task<Result> Handle(DeletePaymentCommand request, CancellationToken cancellationToken)
    {
        var payment = await db.Payments.FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        if (payment is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Payment not found."));

        db.Payments.Remove(payment);
        db.AuditLogs.Add(new AuditLog(nameof(Payment), payment.Id, "Delete", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record CreateExpenseCommand(UpsertExpenseInput Input, Guid? AdminUserId) : IRequest<Result<Guid>>;

public class CreateExpenseCommandValidator : AbstractValidator<CreateExpenseCommand>
{
    public CreateExpenseCommandValidator()
    {
        RuleFor(x => x.Input.Amount).GreaterThan(0);
        RuleFor(x => x.Input.Category).IsInEnum();
        RuleFor(x => x.Input.Comment).MaximumLength(500);
    }
}

public class CreateExpenseCommandHandler(IApplicationDbContext db, IDateTimeProvider clock) : IRequestHandler<CreateExpenseCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateExpenseCommand request, CancellationToken cancellationToken)
    {
        var input = request.Input;
        // Always today's server date — never client-supplied (see UpsertExpenseInput doc comment).
        var spentOnUtc = DateOnly.FromDateTime(clock.UtcNow);
        var expense = new Expense(input.Amount, spentOnUtc, input.Category, input.Comment, request.AdminUserId);

        db.Expenses.Add(expense);
        db.AuditLogs.Add(new AuditLog(nameof(Expense), expense.Id, "Create", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(expense.Id);
    }
}

public record DeleteExpenseCommand(Guid Id, Guid? AdminUserId) : IRequest<Result>;

public class DeleteExpenseCommandHandler(IApplicationDbContext db) : IRequestHandler<DeleteExpenseCommand, Result>
{
    public async Task<Result> Handle(DeleteExpenseCommand request, CancellationToken cancellationToken)
    {
        var expense = await db.Expenses.FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);
        if (expense is null)
            return Result.Failure(Error.NotFound("NOT_FOUND", "Expense not found."));

        db.Expenses.Remove(expense);
        db.AuditLogs.Add(new AuditLog(nameof(Expense), expense.Id, "Delete", request.AdminUserId));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
