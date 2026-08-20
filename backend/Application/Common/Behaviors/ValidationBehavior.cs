using AeroTravel.Application.Common.Models;
using FluentValidation;
using MediatR;

namespace AeroTravel.Application.Common.Behaviors;

public class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
    where TResponse : Result
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (!validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);
        var failures = (await Task.WhenAll(validators.Select(v => v.ValidateAsync(context, cancellationToken))))
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Count == 0)
            return await next();

        var message = string.Join("; ", failures.Select(f => f.ErrorMessage));
        var error = Error.Validation("VALIDATION_FAILED", message);

        var resultType = typeof(TResponse);
        if (resultType == typeof(Result))
            return (TResponse)(object)Result.Failure(error);

        var valueType = resultType.GetGenericArguments()[0];
        var failureMethod = typeof(Result).GetMethod(nameof(Result.Failure), 1, [typeof(Error)])!
            .MakeGenericMethod(valueType);
        return (TResponse)failureMethod.Invoke(null, [error])!;
    }
}
