using AeroTravel.Application.Common.Models;
using AeroTravel.Application.Features.Destinations.Commands;
using AeroTravel.Application.Features.Destinations.Dtos;
using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using AeroTravel.Tests.Common;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Tests.Features.Destinations;

public class DestinationCrudTests
{
    private static UpsertDestinationInput ValidInput(Guid cityId, string slug = "test-slug") => new(
        cityId, slug, null, [], true, false, 0,
        [new DestinationTranslationInput(Locale.Ru, "Title", "Summary", "Description", ["h1"], null, null)]);

    [Fact]
    public async Task Create_Succeeds_AndPersists()
    {
        using var db = TestDb.Create();
        var country = new Country("TJ");
        var city = new City(country.Id);
        db.Countries.Add(country);
        db.Cities.Add(city);
        await db.SaveChangesAsync(CancellationToken.None);

        var handler = new CreateDestinationCommandHandler(db);
        var result = await handler.Handle(new CreateDestinationCommand(ValidInput(city.Id), null), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(db.Destinations);
        Assert.Single(db.AuditLogs);
    }

    [Fact]
    public async Task Create_DuplicateSlug_ReturnsConflict()
    {
        using var db = TestDb.Create();
        var country = new Country("TJ");
        var city = new City(country.Id);
        db.Countries.Add(country);
        db.Cities.Add(city);
        var existing = new Destination(city.Id, "test-slug");
        db.Destinations.Add(existing);
        await db.SaveChangesAsync(CancellationToken.None);

        var handler = new CreateDestinationCommandHandler(db);
        var result = await handler.Handle(new CreateDestinationCommand(ValidInput(city.Id), null), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Conflict, result.Error!.Type);
        Assert.Equal("CONFLICT_DUPLICATE", result.Error.Code);
    }

    [Fact]
    public async Task Update_NonExistent_ReturnsNotFound()
    {
        using var db = TestDb.Create();
        var handler = new UpdateDestinationCommandHandler(db);

        var result = await handler.Handle(new UpdateDestinationCommand(Guid.NewGuid(), ValidInput(Guid.NewGuid()), null), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.NotFound, result.Error!.Type);
    }

    [Fact]
    public async Task Update_ExistingTranslations_UpdatesInPlace_DoesNotThrowOnDuplicateLocale()
    {
        // Regression test: UpdateDestinationCommandHandler used to fetch the Destination without
        // `.Include(d => d.Translations)`. With Translations unloaded, `SetTranslation` could never
        // find the already-persisted row for a locale and always `Add`-ed a new one instead of
        // updating in place — a second `Add` for the same (DestinationId, Locale) collides with the
        // composite primary key on save. Reproduced live against a real Postgres instance (PUT
        // /admin/destinations/{id} 500'd with "duplicate key value violates unique constraint
        // PK_DestinationTranslation") — see docs/PROGRESS.md. A single shared `TestDb.Create()`
        // instance across create+update would keep Translations tracked in memory and mask this,
        // so this test deliberately reloads the entity through a second, separate DbContext
        // instance against the same in-memory database, simulating a fresh request.
        var dbName = Guid.NewGuid().ToString();
        Guid destinationId;
        Guid cityId;
        await using (var db1 = TestDb.CreateNamed(dbName))
        {
            var country = new Country("TJ");
            var city = new City(country.Id);
            db1.Countries.Add(country);
            db1.Cities.Add(city);
            await db1.SaveChangesAsync(CancellationToken.None);
            cityId = city.Id;

            var createHandler = new CreateDestinationCommandHandler(db1);
            var createResult = await createHandler.Handle(new CreateDestinationCommand(ValidInput(city.Id), null), CancellationToken.None);
            Assert.True(createResult.IsSuccess);
            destinationId = createResult.Value;
        }

        await using var db2 = TestDb.CreateNamed(dbName);
        var updateHandler = new UpdateDestinationCommandHandler(db2);
        var updatedInput = new UpsertDestinationInput(
            cityId, "test-slug", null, [], true, false, 0,
            [new DestinationTranslationInput(Locale.Ru, "Updated Title", "Updated Summary", "Updated Description", ["h1", "h2"], null, null)]);

        var updateResult = await updateHandler.Handle(new UpdateDestinationCommand(destinationId, updatedInput, null), CancellationToken.None);

        Assert.True(updateResult.IsSuccess);
        var persisted = await db2.Destinations.Include(d => d.Translations).SingleAsync(d => d.Id == destinationId);
        var ruTranslation = Assert.Single(persisted.Translations, t => t.Locale == Locale.Ru);
        Assert.Equal("Updated Title", ruTranslation.Title);
    }

    [Fact]
    public async Task Delete_Existing_RemovesEntity_AndWritesAudit()
    {
        using var db = TestDb.Create();
        var country = new Country("TJ");
        var city = new City(country.Id);
        var destination = new Destination(city.Id, "to-delete");
        db.Countries.Add(country);
        db.Cities.Add(city);
        db.Destinations.Add(destination);
        await db.SaveChangesAsync(CancellationToken.None);

        var handler = new DeleteDestinationCommandHandler(db);
        var adminId = Guid.NewGuid();
        var result = await handler.Handle(new DeleteDestinationCommand(destination.Id, adminId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Empty(db.Destinations);
        Assert.Contains(db.AuditLogs, a => a.Action == "Delete" && a.AdminUserId == adminId);
    }
}
