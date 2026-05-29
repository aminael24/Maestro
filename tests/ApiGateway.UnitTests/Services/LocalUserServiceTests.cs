using ApiGateway.Data;
using ApiGateway.Models;
using ApiGateway.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ApiGateway.UnitTests.Services;

/// <summary>
/// Tests unitaires pour LocalUserService, basés sur EF Core InMemory.
/// On n'a pas besoin de Moq ici : on teste la vraie classe contre une
/// DB en mémoire, ce qui valide aussi le mapping EF.
/// </summary>
public class LocalUserServiceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options);

    [Fact]
    public async Task CreateAsync_insere_un_LocalUser_avec_les_bons_champs()
    {
        using var db = NewDb();
        var sut = new LocalUserService(db);
        var request = new RegisterRequest
        {
            Username = "u", Email = "e@e.fr", Password = "p",
            FirstName = "f", LastName = "l",
        };

        var user = await sut.CreateAsync(
            "kc-abc",
            request,
            profileUrl: "/uploads/xx.png",
            CancellationToken.None);

        user.Should().NotBeNull();
        user.KeycloakId.Should().Be("kc-abc");
        user.ProfileUrl.Should().Be("/uploads/xx.png");
        user.Id.Should().BeGreaterThan(0);

        (await db.Users.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task CreateMinimalAsync_insere_un_user_avec_ProfileUrl_null()
    {
        using var db = NewDb();
        var sut = new LocalUserService(db);

        var user = await sut.CreateMinimalAsync("kc-google", profileUrl: null);

        user.KeycloakId.Should().Be("kc-google");
        user.ProfileUrl.Should().BeNull();
    }

    [Fact]
    public async Task GetByKeycloakIdAsync_retourne_le_user_si_il_existe()
    {
        using var db = NewDb();
        var sut = new LocalUserService(db);
        await sut.CreateMinimalAsync("kc-found");

        var u = await sut.GetByKeycloakIdAsync("kc-found");

        u.Should().NotBeNull();
        u!.KeycloakId.Should().Be("kc-found");
    }

    [Fact]
    public async Task GetByKeycloakIdAsync_retourne_null_si_inexistant()
    {
        using var db = NewDb();
        var sut = new LocalUserService(db);

        var u = await sut.GetByKeycloakIdAsync("does-not-exist");

        u.Should().BeNull();
    }
}
