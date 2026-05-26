using ApiGateway.Data;
using ApiGateway.Models;
using ApiGateway.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ApiGateway.UnitTests.Services;

public class RegisterServiceTests
{
    private static AppDbContext NewInMemoryDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options);

    private static (RegisterService sut,
                    Mock<KeycloakService> kcMock,
                    Mock<LocalUserService> userMock,
                    Mock<ProfileImageService> photoMock)
        BuildSut()
    {
        var httpClientFactoryMock = new Mock<IHttpClientFactory>();
        var envMock = new Mock<IWebHostEnvironment>();
        envMock.Setup(e => e.WebRootPath).Returns(Path.GetTempPath());

        var kcMock    = new Mock<KeycloakService>(httpClientFactoryMock.Object);
        var photoMock = new Mock<ProfileImageService>(envMock.Object);
        var userMock  = new Mock<LocalUserService>(NewInMemoryDb());

        var kafkaLoggerMock = new Mock<ILogger<KafkaProducer>>();
        var kafkaMock = new Mock<KafkaProducer>(kafkaLoggerMock.Object);

        var sut = new RegisterService(
            kcMock.Object,
            userMock.Object,
            photoMock.Object,
            kafkaMock.Object);
        return (sut, kcMock, userMock, photoMock);
    }

    private static RegisterRequest ValidRequest() => new()
    {
        Username  = "ahmedf",
        Email     = "ahmed@maestro.dev",
        Password  = "S3cret123!",
        FirstName = "Ahmed",
        LastName  = "El Fassi",
    };

    [Fact]
    public async Task RegisterAsync_flow_heureux_appelle_les_3_services_dans_l_ordre()
    {
        var (sut, kcMock, userMock, photoMock) = BuildSut();

        kcMock.Setup(s => s.CreateUserAsync(It.IsAny<RegisterRequest>(), It.IsAny<CancellationToken>()))
              .ReturnsAsync("kc-uuid-123");
        photoMock.Setup(s => s.SaveProfilePhotoAsync(It.IsAny<Microsoft.AspNetCore.Http.IFormFile?>(),
                                                     It.IsAny<CancellationToken>()))
                 .ReturnsAsync("/uploads/profiles/abc.png");
        userMock.Setup(s => s.CreateAsync(
                    "kc-uuid-123",
                    It.IsAny<RegisterRequest>(),
                    "/uploads/profiles/abc.png",
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new LocalUser
                {
                    Id = 42,
                    KeycloakId = "kc-uuid-123",
                    ProfileUrl = "/uploads/profiles/abc.png",
                });

        var result = await sut.RegisterAsync(ValidRequest(), CancellationToken.None);

        result.Should().NotBeNull();
        var json = System.Text.Json.JsonSerializer.Serialize(result,
            new System.Text.Json.JsonSerializerOptions
            {
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
            });
        json.Should().Contain("kc-uuid-123");
        json.Should().Contain("/uploads/profiles/abc.png");
        json.Should().Contain("Compte créé avec succès");

        kcMock.Verify(s => s.CreateUserAsync(It.IsAny<RegisterRequest>(), It.IsAny<CancellationToken>()),
                       Times.Once);
        photoMock.Verify(s => s.SaveProfilePhotoAsync(It.IsAny<Microsoft.AspNetCore.Http.IFormFile?>(),
                                                      It.IsAny<CancellationToken>()),
                         Times.Once);
        userMock.Verify(s => s.CreateAsync(
                    "kc-uuid-123",
                    It.IsAny<RegisterRequest>(),
                    "/uploads/profiles/abc.png",
                    It.IsAny<CancellationToken>()),
                Times.Once);

        kcMock.Verify(s => s.DeleteUserAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
                      Times.Never,
                      "pas de rollback sur un flow heureux");
    }

    [Fact]
    public async Task RegisterAsync_si_Photo_fail_rollback_le_user_Keycloak()
    {
        var (sut, kcMock, userMock, photoMock) = BuildSut();

        kcMock.Setup(s => s.CreateUserAsync(It.IsAny<RegisterRequest>(), It.IsAny<CancellationToken>()))
              .ReturnsAsync("kc-uuid-bad-photo");
        photoMock.Setup(s => s.SaveProfilePhotoAsync(It.IsAny<Microsoft.AspNetCore.Http.IFormFile?>(),
                                                     It.IsAny<CancellationToken>()))
                 .ThrowsAsync(new InvalidOperationException("Format image non supporté"));

        var act = () => sut.RegisterAsync(ValidRequest(), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();

        kcMock.Verify(s => s.DeleteUserAsync("kc-uuid-bad-photo", It.IsAny<CancellationToken>()),
                      Times.Once,
                      "le user Keycloak doit être supprimé en rollback");
        userMock.Verify(s => s.CreateAsync(
                    It.IsAny<string>(),
                    It.IsAny<RegisterRequest>(),
                    It.IsAny<string?>(),
                    It.IsAny<CancellationToken>()),
                Times.Never);
    }

    [Fact]
    public async Task RegisterAsync_si_LocalUser_fail_rollback_le_user_Keycloak()
    {
        var (sut, kcMock, userMock, photoMock) = BuildSut();

        kcMock.Setup(s => s.CreateUserAsync(It.IsAny<RegisterRequest>(), It.IsAny<CancellationToken>()))
              .ReturnsAsync("kc-uuid-db-fail");
        photoMock.Setup(s => s.SaveProfilePhotoAsync(It.IsAny<Microsoft.AspNetCore.Http.IFormFile?>(),
                                                     It.IsAny<CancellationToken>()))
                 .ReturnsAsync((string?)null);
        userMock.Setup(s => s.CreateAsync(
                    It.IsAny<string>(),
                    It.IsAny<RegisterRequest>(),
                    It.IsAny<string?>(),
                    It.IsAny<CancellationToken>()))
                .ThrowsAsync(new DbUpdateException("Erreur insertion"));

        var act = () => sut.RegisterAsync(ValidRequest(), CancellationToken.None);

        await act.Should().ThrowAsync<DbUpdateException>();

        kcMock.Verify(s => s.DeleteUserAsync("kc-uuid-db-fail", It.IsAny<CancellationToken>()),
                      Times.Once,
                      "rollback obligatoire quand l'insert local échoue après création Keycloak");
    }

    [Fact]
    public async Task RegisterAsync_si_Keycloak_fail_AVANT_creation_aucun_rollback()
    {
        var (sut, kcMock, userMock, photoMock) = BuildSut();

        kcMock.Setup(s => s.CreateUserAsync(It.IsAny<RegisterRequest>(), It.IsAny<CancellationToken>()))
              .ThrowsAsync(new InvalidOperationException("Keycloak unreachable"));

        var act = () => sut.RegisterAsync(ValidRequest(), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Keycloak unreachable*");

        kcMock.Verify(s => s.DeleteUserAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
                      Times.Never);
        photoMock.Verify(s => s.SaveProfilePhotoAsync(It.IsAny<Microsoft.AspNetCore.Http.IFormFile?>(),
                                                      It.IsAny<CancellationToken>()),
                         Times.Never);
        userMock.Verify(s => s.CreateAsync(
                    It.IsAny<string>(),
                    It.IsAny<RegisterRequest>(),
                    It.IsAny<string?>(),
                    It.IsAny<CancellationToken>()),
                Times.Never);
    }

    [Fact]
    public async Task RegisterAsync_si_rollback_lui_meme_throw_l_exception_originale_est_propagee()
    {
        var (sut, kcMock, _, photoMock) = BuildSut();

        kcMock.Setup(s => s.CreateUserAsync(It.IsAny<RegisterRequest>(), It.IsAny<CancellationToken>()))
              .ReturnsAsync("kc-uuid");
        photoMock.Setup(s => s.SaveProfilePhotoAsync(It.IsAny<Microsoft.AspNetCore.Http.IFormFile?>(),
                                                     It.IsAny<CancellationToken>()))
                 .ThrowsAsync(new InvalidOperationException("photo invalide"));
        kcMock.Setup(s => s.DeleteUserAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
              .ThrowsAsync(new HttpRequestException("Keycloak down during rollback"));

        var act = () => sut.RegisterAsync(ValidRequest(), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*photo invalide*");
    }
}