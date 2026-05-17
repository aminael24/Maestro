using ApiGateway.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using System.Net;
using Xunit;

namespace ApiGateway.UnitTests.Services;

/// <summary>
/// Tests unitaires pour OidcService.
///
/// OidcService construit des URLs et parle à Keycloak via HttpClient.
/// On mock HttpMessageHandler (protected) pour simuler les réponses.
/// </summary>
public class OidcServiceTests : IDisposable
{
    private readonly Dictionary<string, string?> _originalEnv = new();

    public OidcServiceTests()
    {
        // Snapshot des variables d'environnement avant test
        var keys = new[]
        {
            "KEYCLOAK_REALM_URL",
            "KEYCLOAK_TOKEN_ENDPOINT",
            "KEYCLOAK_CLIENT_ID",
            "KEYCLOAK_CLIENT_SECRET",
            "GATEWAY_PUBLIC_URL",
            "KEYCLOAK_PUBLIC_URL",
        };
        foreach (var k in keys)
            _originalEnv[k] = Environment.GetEnvironmentVariable(k);

        // Set des valeurs prévisibles pour les tests
        Environment.SetEnvironmentVariable("KEYCLOAK_REALM_URL",
            "http://keycloak:8080/realms/maestro");
        Environment.SetEnvironmentVariable("KEYCLOAK_TOKEN_ENDPOINT",
            "http://keycloak:8080/realms/maestro/protocol/openid-connect/token");
        Environment.SetEnvironmentVariable("KEYCLOAK_CLIENT_ID",
            "maestro-api-gateway");
        Environment.SetEnvironmentVariable("KEYCLOAK_CLIENT_SECRET",
            "super-secret");
        Environment.SetEnvironmentVariable("GATEWAY_PUBLIC_URL",
            "http://localhost:5000");
        Environment.SetEnvironmentVariable("KEYCLOAK_PUBLIC_URL",
            "http://localhost:8080");
    }

    public void Dispose()
    {
        foreach (var (k, v) in _originalEnv)
            Environment.SetEnvironmentVariable(k, v);
    }

    // ── Helper : crée un IHttpClientFactory qui renvoie un HttpClient
    //    avec un handler stubbé sur une seule réponse ──
    private static (Mock<IHttpClientFactory> factory, Mock<HttpMessageHandler> handler)
        MakeFactoryWithResponse(HttpResponseMessage response)
    {
        var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(response);

        var client = new HttpClient(handlerMock.Object);
        var factoryMock = new Mock<IHttpClientFactory>();
        factoryMock.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);

        return (factoryMock, handlerMock);
    }

    private static OidcService NewService(Mock<IHttpClientFactory> factory)
    {
        var logger = new Mock<ILogger<OidcService>>().Object;
        return new OidcService(factory.Object, logger);
    }

    // ───────────────────────────────────────────────────────────────────────
    // BuildAuthorizationUrl
    // ───────────────────────────────────────────────────────────────────────

    [Fact]
    public void BuildAuthorizationUrl_contient_tous_les_params_OIDC_de_base()
    {
        var (factory, _) = MakeFactoryWithResponse(new HttpResponseMessage(HttpStatusCode.OK));
        var sut = NewService(factory);

        var url = sut.BuildAuthorizationUrl("state-abc123", idpHint: null);

        url.Should().StartWith("http://localhost:8080/realms/maestro/protocol/openid-connect/auth?");
        url.Should().Contain("client_id=maestro-api-gateway");
        url.Should().Contain("response_type=code");
        url.Should().Contain("scope=openid%20profile%20email");
        url.Should().Contain("state=state-abc123");
        url.Should().Contain("kc_locale=fr");
        url.Should().Contain("redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fauth%2Fcallback");
    }

    [Fact]
    public void BuildAuthorizationUrl_avec_idpHint_ajoute_kc_idp_hint()
    {
        var (factory, _) = MakeFactoryWithResponse(new HttpResponseMessage(HttpStatusCode.OK));
        var sut = NewService(factory);

        var url = sut.BuildAuthorizationUrl("s", idpHint: "google");

        url.Should().Contain("kc_idp_hint=google");
    }

    [Fact]
    public void BuildAuthorizationUrl_sans_idpHint_n_ajoute_pas_kc_idp_hint()
    {
        var (factory, _) = MakeFactoryWithResponse(new HttpResponseMessage(HttpStatusCode.OK));
        var sut = NewService(factory);

        var url = sut.BuildAuthorizationUrl("s", idpHint: null);

        url.Should().NotContain("kc_idp_hint");
    }

    [Fact]
    public void BuildAuthorizationUrl_utilise_KEYCLOAK_PUBLIC_URL_pour_la_redirection_navigateur()
    {
        // Important : le navigateur doit voir localhost:8080, pas keycloak:8080
        var (factory, _) = MakeFactoryWithResponse(new HttpResponseMessage(HttpStatusCode.OK));
        var sut = NewService(factory);

        var url = sut.BuildAuthorizationUrl("s");

        url.Should().NotContain("keycloak:8080");
        url.Should().Contain("localhost:8080");
    }

    // ───────────────────────────────────────────────────────────────────────
    // BuildEndSessionUrl
    // ───────────────────────────────────────────────────────────────────────

    [Fact]
    public void BuildEndSessionUrl_inclut_post_logout_redirect_et_id_token_hint()
    {
        var (factory, _) = MakeFactoryWithResponse(new HttpResponseMessage(HttpStatusCode.OK));
        var sut = NewService(factory);

        var url = sut.BuildEndSessionUrl(
            idToken: "id-jwt-token",
            postLogoutRedirectUri: "http://localhost:5173/");

        url.Should().Contain("/protocol/openid-connect/logout");
        url.Should().Contain("id_token_hint=id-jwt-token");
        url.Should().Contain("post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A5173%2F");
        url.Should().Contain("client_id=maestro-api-gateway");
    }

    [Fact]
    public void BuildEndSessionUrl_sans_idToken_omet_id_token_hint()
    {
        var (factory, _) = MakeFactoryWithResponse(new HttpResponseMessage(HttpStatusCode.OK));
        var sut = NewService(factory);

        var url = sut.BuildEndSessionUrl(idToken: null,
            postLogoutRedirectUri: "http://localhost:5173/");

        url.Should().NotContain("id_token_hint");
    }

    // ───────────────────────────────────────────────────────────────────────
    // ExchangeCodeAsync
    // ───────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExchangeCodeAsync_succes_parse_les_tokens()
    {
        var responseJson = """
        {
          "access_token": "AT-xyz",
          "refresh_token": "RT-xyz",
          "id_token": "IT-xyz",
          "expires_in": 300
        }
        """;
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(responseJson),
        };
        var (factory, handler) = MakeFactoryWithResponse(response);
        var sut = NewService(factory);

        var tokens = await sut.ExchangeCodeAsync("the-code", CancellationToken.None);

        tokens.AccessToken.Should().Be("AT-xyz");
        tokens.RefreshToken.Should().Be("RT-xyz");
        tokens.IdToken.Should().Be("IT-xyz");
        tokens.ExpiresIn.Should().Be(300);

        // Vérifie que la requête HTTP a été faite
        handler.Protected().Verify(
            "SendAsync",
            Times.Once(),
            ItExpr.Is<HttpRequestMessage>(m => m.Method == HttpMethod.Post),
            ItExpr.IsAny<CancellationToken>());
    }

    [Fact]
    public async Task ExchangeCodeAsync_si_Keycloak_4xx_throw_avec_message()
    {
        var response = new HttpResponseMessage(HttpStatusCode.BadRequest)
        {
            Content = new StringContent("""{"error":"invalid_grant"}"""),
        };
        var (factory, _) = MakeFactoryWithResponse(response);
        var sut = NewService(factory);

        var act = () => sut.ExchangeCodeAsync("bad-code", CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*invalid_grant*");
    }

    // ───────────────────────────────────────────────────────────────────────
    // RefreshTokenAsync
    // ───────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RefreshTokenAsync_succes_retourne_nouveau_token_set()
    {
        var responseJson = """
        {"access_token":"AT2","refresh_token":"RT2","expires_in":600}
        """;
        var (factory, _) = MakeFactoryWithResponse(
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson),
            });
        var sut = NewService(factory);

        var tokens = await sut.RefreshTokenAsync("old-refresh", CancellationToken.None);

        tokens.AccessToken.Should().Be("AT2");
        tokens.RefreshToken.Should().Be("RT2");
        tokens.ExpiresIn.Should().Be(600);
    }

    [Fact]
    public async Task RefreshTokenAsync_si_4xx_throw()
    {
        var (factory, _) = MakeFactoryWithResponse(
            new HttpResponseMessage(HttpStatusCode.Unauthorized)
            {
                Content = new StringContent("""{"error":"invalid_token"}"""),
            });
        var sut = NewService(factory);

        var act = () => sut.RefreshTokenAsync("expired", CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    // ───────────────────────────────────────────────────────────────────────
    // RevokeRefreshTokenAsync — best effort, ne throw JAMAIS
    // ───────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RevokeRefreshTokenAsync_succes_ne_throw_pas()
    {
        var (factory, handler) = MakeFactoryWithResponse(
            new HttpResponseMessage(HttpStatusCode.OK));
        var sut = NewService(factory);

        var act = () => sut.RevokeRefreshTokenAsync("rt", CancellationToken.None);

        await act.Should().NotThrowAsync();
        handler.Protected().Verify(
            "SendAsync",
            Times.Once(),
            ItExpr.IsAny<HttpRequestMessage>(),
            ItExpr.IsAny<CancellationToken>());
    }

    [Fact]
    public async Task RevokeRefreshTokenAsync_si_Keycloak_down_ne_throw_pas()
    {
        // Handler qui throw → simule Keycloak unreachable
        var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("connection refused"));

        var client = new HttpClient(handlerMock.Object);
        var factoryMock = new Mock<IHttpClientFactory>();
        factoryMock.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);

        var sut = NewService(factoryMock);

        var act = () => sut.RevokeRefreshTokenAsync("rt", CancellationToken.None);

        // Best effort : on ne doit JAMAIS faire échouer un logout local
        // parce que Keycloak est down.
        await act.Should().NotThrowAsync();
    }
}
