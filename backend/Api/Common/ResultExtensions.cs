using AeroTravel.Application.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Common;

/// Maps Application-layer Result/Result&lt;T&gt; failures to RFC7807 ProblemDetails with an
/// `errorCode` extension, per API_CONTRACT.md and DEC-005 (Result pattern over exceptions
/// for expected failures).
public static class ResultExtensions
{
    public static ActionResult ToActionResult(this Result result)
    {
        if (result.IsSuccess)
            return new NoContentResult();

        return ToProblem(result.Error!);
    }

    public static ActionResult<T> ToActionResult<T>(this Result<T> result)
    {
        if (result.IsSuccess)
            return new OkObjectResult(result.Value);

        return ToProblem(result.Error!);
    }

    public static ActionResult ToCreatedActionResult<T>(this Result<T> result, string actionName, object? routeValues = null)
    {
        if (result.IsSuccess)
            return new CreatedAtActionResult(actionName, null, routeValues, result.Value);

        return ToProblem(result.Error!);
    }

    private static ObjectResult ToProblem(Error error)
    {
        var status = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.RateLimited => StatusCodes.Status429TooManyRequests,
            _ => StatusCodes.Status500InternalServerError,
        };

        var problemDetails = new ProblemDetails
        {
            Status = status,
            Title = error.Type.ToString(),
            Detail = error.Message,
        };
        problemDetails.Extensions["errorCode"] = error.Code;

        return new ObjectResult(problemDetails) { StatusCode = status };
    }
}
