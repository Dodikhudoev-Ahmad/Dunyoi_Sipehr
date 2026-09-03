using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.TravelRequests.Commands;
using AeroTravel.Application.Features.TravelRequests.Dtos;
using AeroTravel.Domain.Enums;
using AeroTravel.Infrastructure.Persistence;
using AeroTravel.Tests.Common;
using Microsoft.Extensions.Options;

namespace AeroTravel.Tests.Features.TravelRequests;

public class CreateTravelRequestCommandTests
{
    private static readonly DateOnly Tomorrow = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));

    private static CreateTravelRequestInput ValidInput(string? website = null, IReadOnlyList<string>? passportPhotoPaths = null) => new(
        "Doe", "Jane", null, "+992123456789", Locale.Ru,
        2, 0, [], null,
        Tomorrow, null,
        null, null, passportPhotoPaths ?? ["passport1.jpg"], PassportDataConsentAccepted: true,
        null, Locale.Ru, ConsentAccepted: true, Website: website);

    private static FakeFileStorageService StorageWith(params string[] fileNames)
    {
        var storage = new FakeFileStorageService();
        foreach (var name in fileNames) storage.KnownFileNames.Add(name);
        return storage;
    }

    private static CreateTravelRequestCommandHandler Handler(AppDbContext db, FakeEmailService? emailService = null) =>
        new(db, emailService ?? new FakeEmailService(),
            Options.Create(new NotificationSettings { NotifyTo = "staff@example.com", AdminUrl = "https://example.com" }),
            NullLoggers.For<CreateTravelRequestCommandHandler>());

    [Fact]
    public async Task Handle_ValidRequest_CreatesEntity()
    {
        using var db = TestDb.Create();
        var handler = Handler(db);

        var result = await handler.Handle(new CreateTravelRequestCommand(ValidInput(), "1.2.3.4"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(db.TravelRequests);
    }

    [Fact]
    public async Task Handle_ValidRequest_SendsNotificationEmail()
    {
        using var db = TestDb.Create();
        var emailService = new FakeEmailService();
        var handler = Handler(db, emailService);

        var result = await handler.Handle(new CreateTravelRequestCommand(ValidInput(), "1.2.3.4"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        var sent = Assert.Single(emailService.SentEmails);
        Assert.Equal("staff@example.com", sent.To);
    }

    [Fact]
    public async Task Handle_HoneypotFilled_RejectsSilently_WithoutPersisting()
    {
        using var db = TestDb.Create();
        var handler = Handler(db);

        var result = await handler.Handle(new CreateTravelRequestCommand(ValidInput(website: "http://spam.example"), "1.2.3.4"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Validation, result.Error!.Type);
        Assert.Empty(db.TravelRequests);
    }

    [Theory]
    [InlineData("", "Jane", "+992123456789", true)] // missing last name
    [InlineData("Doe", "", "+992123456789", true)] // missing first name
    [InlineData("Doe", "Jane", "", true)] // missing phone
    [InlineData("Doe", "Jane", "+992123456789", false)] // consent not accepted
    [InlineData("Doe", "Jane", "12345", true)] // missing +992 prefix
    [InlineData("Doe", "Jane", "+99212345", true)] // too few digits after +992
    public async Task Validator_RejectsInvalidInput(string lastName, string firstName, string phone, bool consent)
    {
        var validator = new CreateTravelRequestCommandValidator(StorageWith("passport1.jpg"));
        var input = new CreateTravelRequestInput(
            lastName, firstName, null, phone, Locale.Ru, 1, 0, [], null,
            Tomorrow, null, null, null, ["passport1.jpg"], true, null, Locale.Ru, consent, null);

        var result = await validator.ValidateAsync(new CreateTravelRequestCommand(input, null));

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task Validator_AcceptsValidInput()
    {
        var validator = new CreateTravelRequestCommandValidator(StorageWith("passport1.jpg"));

        var result = await validator.ValidateAsync(new CreateTravelRequestCommand(ValidInput(), null));

        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task Validator_RejectsPastDepartureDate()
    {
        var validator = new CreateTravelRequestCommandValidator(StorageWith("passport1.jpg"));
        var input = ValidInput() with { DepartureDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)) };

        var result = await validator.ValidateAsync(new CreateTravelRequestCommand(input, null));

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task Validator_RejectsReturnDateBeforeDepartureDate()
    {
        var validator = new CreateTravelRequestCommandValidator(StorageWith("passport1.jpg"));
        var input = ValidInput() with { ReturnDate = Tomorrow.AddDays(-1) };

        var result = await validator.ValidateAsync(new CreateTravelRequestCommand(input, null));

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task Validator_RejectsMismatchedChildrenAgesCount()
    {
        var validator = new CreateTravelRequestCommandValidator(StorageWith("passport1.jpg"));
        var input = ValidInput() with { PassengersChildren = 2, ChildrenAges = [5] };

        var result = await validator.ValidateAsync(new CreateTravelRequestCommand(input, null));

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task Validator_RejectsChildAgeAbove17()
    {
        var validator = new CreateTravelRequestCommandValidator(StorageWith("passport1.jpg"));
        var input = ValidInput() with { PassengersChildren = 1, ChildrenAges = [18] };

        var result = await validator.ValidateAsync(new CreateTravelRequestCommand(input, null));

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(10)]
    public async Task Validator_RejectsPassengerCountOutsideRange(int adults)
    {
        var validator = new CreateTravelRequestCommandValidator(StorageWith("passport1.jpg"));
        var input = ValidInput() with { PassengersAdults = adults };

        var result = await validator.ValidateAsync(new CreateTravelRequestCommand(input, null));

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task Validator_RejectsMissingPassportPhoto()
    {
        var validator = new CreateTravelRequestCommandValidator(StorageWith("passport1.jpg"));
        var input = ValidInput() with { PassportPhotoPaths = [] };

        var result = await validator.ValidateAsync(new CreateTravelRequestCommand(input, null));

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task Validator_RejectsPassportPhotoThatWasNeverUploaded()
    {
        var validator = new CreateTravelRequestCommandValidator(StorageWith("some-other-file.jpg"));
        var input = ValidInput(passportPhotoPaths: ["never-uploaded.jpg"]);

        var result = await validator.ValidateAsync(new CreateTravelRequestCommand(input, null));

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task Validator_RejectsMissingPassportConsent()
    {
        var validator = new CreateTravelRequestCommandValidator(StorageWith("passport1.jpg"));
        var input = ValidInput() with { PassportDataConsentAccepted = false };

        var result = await validator.ValidateAsync(new CreateTravelRequestCommand(input, null));

        Assert.False(result.IsValid);
    }
}
