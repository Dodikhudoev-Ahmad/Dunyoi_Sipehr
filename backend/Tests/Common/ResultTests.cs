using AeroTravel.Application.Common.Models;

namespace AeroTravel.Tests.Common;

public class ResultTests
{
    [Fact]
    public void Success_HasNoError_AndIsSuccess()
    {
        var result = Result.Success();

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Null(result.Error);
    }

    [Fact]
    public void Failure_CarriesError_AndIsFailure()
    {
        var error = Error.NotFound("NOT_FOUND", "missing");
        var result = Result.Failure(error);

        Assert.False(result.IsSuccess);
        Assert.True(result.IsFailure);
        Assert.Equal(error, result.Error);
    }

    [Fact]
    public void GenericSuccess_ExposesValue()
    {
        var result = Result.Success(42);

        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Value);
    }

    [Fact]
    public void GenericFailure_ThrowsOnValueAccess()
    {
        var result = Result.Failure<int>(Error.Validation("VALIDATION_FAILED", "bad"));

        Assert.Throws<InvalidOperationException>(() => result.Value);
    }

    [Fact]
    public void ImplicitConversion_FromValue_ProducesSuccess()
    {
        Result<string> result = "hello";

        Assert.True(result.IsSuccess);
        Assert.Equal("hello", result.Value);
    }

    [Theory]
    [InlineData(ErrorType.Validation)]
    [InlineData(ErrorType.NotFound)]
    [InlineData(ErrorType.Conflict)]
    [InlineData(ErrorType.Unauthorized)]
    [InlineData(ErrorType.Forbidden)]
    [InlineData(ErrorType.RateLimited)]
    public void ErrorFactories_ProduceMatchingType(ErrorType expected)
    {
        var error = expected switch
        {
            ErrorType.Validation => Error.Validation("C", "m"),
            ErrorType.NotFound => Error.NotFound("C", "m"),
            ErrorType.Conflict => Error.Conflict("C", "m"),
            ErrorType.Unauthorized => Error.Unauthorized("C", "m"),
            ErrorType.Forbidden => Error.Forbidden("C", "m"),
            ErrorType.RateLimited => Error.RateLimited("C", "m"),
            _ => throw new ArgumentOutOfRangeException(nameof(expected)),
        };

        Assert.Equal(expected, error.Type);
    }
}
