using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Auth.Commands;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using AeroTravel.Tests.Common;

namespace AeroTravel.Tests.Features.Auth;

public class LoginCommandTests
{
    [Fact]
    public async Task Handle_ValidCredentials_ReturnsSuccessWithTokens()
    {
        using var db = TestDb.Create();
        var hasher = new FakePasswordHasher();
        var admin = new AdminUser("admin@aerotravel.test", hasher.Hash("Sup3rSecret!"), "Admin", AdminRole.SuperAdmin);
        db.AdminUsers.Add(admin);
        await db.SaveChangesAsync(CancellationToken.None);

        var handler = new LoginCommandHandler(db, hasher, new FakeJwtTokenGenerator(), new FakeCurrentUserService());

        var result = await handler.Handle(new LoginCommand("admin@aerotravel.test", "Sup3rSecret!"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("fake-access-token", result.Value.AccessToken);
        Assert.NotEmpty(result.Value.RefreshToken);
    }

    [Fact]
    public async Task Handle_WrongPassword_ReturnsUnauthorized()
    {
        using var db = TestDb.Create();
        var hasher = new FakePasswordHasher();
        var admin = new AdminUser("admin@aerotravel.test", hasher.Hash("Sup3rSecret!"), "Admin", AdminRole.SuperAdmin);
        db.AdminUsers.Add(admin);
        await db.SaveChangesAsync(CancellationToken.None);

        var handler = new LoginCommandHandler(db, hasher, new FakeJwtTokenGenerator(), new FakeCurrentUserService());

        var result = await handler.Handle(new LoginCommand("admin@aerotravel.test", "wrong-password"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Unauthorized, result.Error!.Type);
        Assert.Equal("INVALID_CREDENTIALS", result.Error.Code);
    }

    [Fact]
    public async Task Handle_UnknownEmail_ReturnsUnauthorized()
    {
        using var db = TestDb.Create();
        var handler = new LoginCommandHandler(db, new FakePasswordHasher(), new FakeJwtTokenGenerator(), new FakeCurrentUserService());

        var result = await handler.Handle(new LoginCommand("nobody@aerotravel.test", "whatever"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Unauthorized, result.Error!.Type);
    }

    [Fact]
    public async Task Handle_InactiveAdmin_ReturnsUnauthorized()
    {
        using var db = TestDb.Create();
        var hasher = new FakePasswordHasher();
        var admin = new AdminUser("admin@aerotravel.test", hasher.Hash("Sup3rSecret!"), "Admin", AdminRole.SuperAdmin);
        admin.Deactivate();
        db.AdminUsers.Add(admin);
        await db.SaveChangesAsync(CancellationToken.None);

        var handler = new LoginCommandHandler(db, hasher, new FakeJwtTokenGenerator(), new FakeCurrentUserService());

        var result = await handler.Handle(new LoginCommand("admin@aerotravel.test", "Sup3rSecret!"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Unauthorized, result.Error!.Type);
    }

    [Theory]
    [InlineData("", "password")]
    [InlineData("not-an-email", "password")]
    [InlineData("valid@email.com", "")]
    public void Validator_RejectsInvalidInput(string email, string password)
    {
        var validator = new LoginCommandValidator();

        var result = validator.Validate(new LoginCommand(email, password));

        Assert.False(result.IsValid);
    }
}
