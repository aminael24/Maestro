using ApiGateway.Controllers;
using ApiGateway.Data;
using ApiGateway.Models;
using ApiGateway.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ApiGateway.UnitTests.Controllers;

/// <summary>
/// Tests unitaires xUnit + Moq + FluentAssertions pour AuthController.
///
/// On mock toutes les dépendances injectées dans le ctor :
///   - RegisterService, LocalUserService, OidcService, PasswordResetService
///     (méthodes rendues virtual dans la source pour permettre le mock)
///   - IWebHostEnvironment, ILogger
///
/// HttpContext factice fourni via ControllerContext pour pouvoir poser
/// des cookies et lire des cookies de requête.
/// </summary>
public class AuthControllerTests
{
    private readonly Mock<RegisterService> _registerServiceMock;
    private readonly Mock<LocalUserService> _localUserServiceMock;
    private readonly Mock<OidcService> _oidcServiceMock;
   private readonly Mock<PasswordResetService> _passwordResetServiceMock;
    private readonly Mock<LoginService> _loginServiceMock;
    private readonly Mock<IWebHostEnvironment> _envMock;    private readonly Mock<ILogger<AuthController>> _loggerMock;
    private readonly AppDbContext _dbContext;

    public AuthControllerTests()
    {
        var httpClientFactoryMock = new Mock<IHttpClientFactory>();
        var oidcLoggerMock = new Mock<ILogger<OidcService>>();
        var profileImageEnvMock = new Mock<IWebHostEnvironment>();
        profileImageEnvMock.Setup(e => e.WebRootPath).Returns(Path.GetTempPath());

        var keycloakServiceMock = new Mock<KeycloakService>(httpClientFactoryMock.Object);
        var profileImageServiceMock = new Mock<ProfileImageService>(
            profileImageEnvMock.Object);

        _dbContext = NewInMemoryDb();
        _localUserServiceMock = new Mock<LocalUserService>(_dbContext);

   var kafkaLoggerMock = new Mock<ILogger<KafkaProducer>>();
var kafkaProducerMock = new Mock<KafkaProducer>(kafkaLoggerMock.Object);

_registerServiceMock = new Mock<RegisterService>(
    keycloakServiceMock.Object,
    _localUserServiceMock.Object,
    profileImageServiceMock.Object,
    kafkaProducerMock.Object);

        _oidcServiceMock = new Mock<OidcService>(
            httpClientFactoryMock.Object,
            oidcLoggerMock.Object);

        var passwordResetLoggerMock = new Mock<ILogger<PasswordResetService>>();
    _passwordResetServiceMock = new Mock<PasswordResetService>(
            keycloakServiceMock.Object,
            httpClientFactoryMock.Object,
            passwordResetLoggerMock.Object);

        // Mock du LoginService utilisé par /auth/register pour auto-login.
        // Par défaut on simule un échec silencieux (Direct Grants indisponibles
        // en test) — le compte est créé mais aucun cookie n'est posé,
        // exactement comme avant le refacto. Les tests existants ne vérifient
        // pas la pose de cookies donc ils restent valides.
        _loginServiceMock = new Mock<LoginService>(httpClientFactoryMock.Object);
        _loginServiceMock
            .Setup(s => s.LoginAsync(
                It.IsAny<LoginRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("auto-login indisponible en test"));

        _envMock = new Mock<IWebHostEnvironment>();
        _envMock.Setup(e => e.EnvironmentName).Returns("Development");

        _loggerMock = new Mock<ILogger<AuthController>>();
    }

    private static AppDbContext NewInMemoryDb()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(opts);
    }

   private AuthController NewController()
    {
        var controller = new AuthController(
            _registerServiceMock.Object,
            _localUserServiceMock.Object,
            _oidcServiceMock.Object,
            _passwordResetServiceMock.Object,
            _loginServiceMock.Object,
            _envMock.Object,
            _loggerMock.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext(),
        };
        return controller;
    }

    // ───────────────────────────────────────────────────────────────────────
    // Register
    // ───────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_avec_payload_complet_retourne_Ok_et_appelle_le_service()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Username  = "ahmedf",
            Email     = "ahmed@maestro.dev",
            Password  = "S3cret123!",
            FirstName = "Ahmed",
            LastName  = "El Fassi",
        };
        _registerServiceMock
            .Setup(s => s.RegisterAsync(
                It.IsAny<RegisterRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new
            {
                message    = "ok",
                Id         = 1,
                KeycloakId = "kc-1",
                ProfileUrl = (string?)null,
            });

        var controller = NewController();

        // Act
        var result = await controller.Register(request, CancellationToken.None);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _registerServiceMock.Verify(
            s => s.RegisterAsync(
                It.Is<RegisterRequest>(r =>
                    r.Username == "ahmedf"
                    && r.Email == "ahmed@maestro.dev"
                    && r.FirstName == "Ahmed"
                    && r.LastName == "El Fassi"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Theory]
    [InlineData("",  "e@e.fr", "pw", "fn", "ln")] // username
    [InlineData("u", "",       "pw", "fn", "ln")] // email
    [InlineData("u", "e@e.fr", "",   "fn", "ln")] // password
    [InlineData("u", "e@e.fr", "pw", "",   "ln")] // firstName
    [InlineData("u", "e@e.fr", "pw", "fn", "")]   // lastName
    [InlineData("   ", "e@e.fr", "pw", "fn", "ln")] // whitespace
    public async Task Register_avec_un_champ_obligatoire_vide_retourne_BadRequest(
        string username, string email, string password, string firstName, string lastName)
    {
        var request = new RegisterRequest
        {
            Username  = username,
            Email     = email,
            Password  = password,
            FirstName = firstName,
            LastName  = lastName,
        };
        var controller = NewController();

        var result = await controller.Register(request, CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
        _registerServiceMock.Verify(
            s => s.RegisterAsync(
                It.IsAny<RegisterRequest>(),
                It.IsAny<CancellationToken>()),
            Times.Never,
            "le service ne doit jamais être appelé si la validation échoue");
    }

    [Fact]
    public async Task Register_si_RegisterService_throw_retourne_BadRequest_avec_message()
    {
        var request = new RegisterRequest
        {
            Username  = "u",
            Email     = "e@e.fr",
            Password  = "pw",
            FirstName = "fn",
            LastName  = "ln",
        };
        _registerServiceMock
            .Setup(s => s.RegisterAsync(
                It.IsAny<RegisterRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Email déjà utilisé"));

        var controller = NewController();

        var result = await controller.Register(request, CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
        var bad = (BadRequestObjectResult)result;
       var json = System.Text.Json.JsonSerializer.Serialize(bad.Value,
    new System.Text.Json.JsonSerializerOptions
    {
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    });
json.Should().Contain("Echec création compte");
json.Should().Contain("Email déjà utilisé");
    }

    // ───────────────────────────────────────────────────────────────────────
    // ForgotPassword
    // ───────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ForgotPassword_avec_email_vide_retourne_BadRequest()
    {
        var controller = NewController();

        var result = await controller.ForgotPassword(
            new ForgotPasswordRequest(""),
            CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ForgotPassword_avec_email_valide_retourne_Ok_anti_enumeration()
    {
        _passwordResetServiceMock
            .Setup(s => s.SendResetEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var controller = NewController();

        var result = await controller.ForgotPassword(
            new ForgotPasswordRequest("user@maestro.dev"),
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
       var ok = (OkObjectResult)result;
var json = System.Text.Json.JsonSerializer.Serialize(ok.Value,
    new System.Text.Json.JsonSerializerOptions
    {
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    });
json.Should().Contain("Si l'email existe");
    }

    // ───────────────────────────────────────────────────────────────────────
    // Login → redirect vers Keycloak + cookie state posé
    // ───────────────────────────────────────────────────────────────────────

    [Fact]
    public void Login_retourne_redirection_et_pose_le_cookie_state()
    {
        _oidcServiceMock
            .Setup(s => s.BuildAuthorizationUrl(It.IsAny<string>(), null))
            .Returns("http://keycloak.local/realms/maestro/protocol/openid-connect/auth?fake=1");

        var controller = NewController();

        var result = controller.Login();

        result.Should().BeOfType<RedirectResult>();
        ((RedirectResult)result).Url.Should().StartWith("http://keycloak.local/");
        controller.Response.Headers
            .Should().ContainKey("Set-Cookie",
                "le cookie OAuth state doit être posé sur la réponse");
    }

    [Fact]
    public void LoginGoogle_passe_kc_idp_hint_google_a_OidcService()
    {
        _oidcServiceMock
            .Setup(s => s.BuildAuthorizationUrl(It.IsAny<string>(), "google"))
            .Returns("http://kc/google");

        var controller = NewController();
        var result = controller.LoginGoogle();

        result.Should().BeOfType<RedirectResult>();
        _oidcServiceMock.Verify(
            s => s.BuildAuthorizationUrl(It.IsAny<string>(), "google"),
            Times.Once);
    }

    [Fact]
    public void LoginGitHub_passe_kc_idp_hint_github_a_OidcService()
    {
        _oidcServiceMock
            .Setup(s => s.BuildAuthorizationUrl(It.IsAny<string>(), "github"))
            .Returns("http://kc/github");

        var controller = NewController();
        var result = controller.LoginGitHub();

        result.Should().BeOfType<RedirectResult>();
        _oidcServiceMock.Verify(
            s => s.BuildAuthorizationUrl(It.IsAny<string>(), "github"),
            Times.Once);
    }

    // ───────────────────────────────────────────────────────────────────────
    // Refresh
    // ───────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Refresh_sans_cookie_retourne_Unauthorized()
    {
        var controller = NewController();
        // Aucun cookie maestro_refresh_token dans la requête.

        var result = await controller.Refresh(CancellationToken.None);

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }
}
