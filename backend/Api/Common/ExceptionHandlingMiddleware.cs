using System.ComponentModel;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Common;

/// Catches unhandled exceptions (truly unexpected failures — expected failures flow through
/// Result/ResultExtensions instead, per DEC-005) and maps them to an RFC7807 ProblemDetails
/// response with a stable `errorCode` extension, so clients get a consistent error shape.
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var correlationId = context.Items.TryGetValue("CorrelationId", out var id) ? id?.ToString() : null;
            logger.LogError(ex, "Unhandled exception. CorrelationId={CorrelationId}", correlationId);

            var problemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Unexpected",
                Detail = "An unexpected error occurred.",
            };
            problemDetails.Extensions["errorCode"] = "UNEXPECTED_ERROR";
            if (correlationId is not null)
                problemDetails.Extensions["correlationId"] = correlationId;

            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(problemDetails);
        }
    }
}

/// Stamps every request with a correlation ID (from the incoming header if present, else a new
/// GUID), echoes it back on the response, and enriches the Serilog log context so all log lines
/// for a request can be tied together.
public class CorrelationIdMiddleware(RequestDelegate next)
{
    private const string HeaderName = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers.TryGetValue(HeaderName, out var existing) && !string.IsNullOrWhiteSpace(existing)
            ? existing.ToString()
            : Guid.NewGuid().ToString("n");

        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
        {
            await next(context);
        }
    }
}
