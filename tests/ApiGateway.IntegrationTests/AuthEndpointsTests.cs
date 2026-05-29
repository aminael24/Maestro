using FluentAssertions;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace ApiGateway.IntegrationTests;

/// <summary>
/// Tests d'intégration HTTP pour le module Auth de l'ApiGateway, basés sur
/// WebApplicationFactory<Program>.
///
/// Ce qu'on couvre :
///   - GET  /auth/login                 → 302 vers Keycloak + cookie state posé
///   - GET  /auth/login/google          → 302 avec kc_idp_hint=google
///   - GET  /auth/login/github          → 302 avec kc_idp_hint=github
///   - POST /auth/refresh sans cookie   → 401
///   - GET  /auth/me sans cookie        → 401
///   - POST /auth/register sans corps   → 400
///   - POST /auth/register payload partiel → 400
///   - POST /auth/forgot-password sans email → 400
///   - POST /auth/forgot-password avec email valide → 200 (anti-énumération)
///
/// Note : on N'appelle PAS Keycloak réel — on stoppe au moment de la
/// redirection. Pour /auth/forgot-password, l'appel admin Keycloak va échouer
/// car keycloak n'est pas joignable, mais l'endpoint renvoie quand même 200
/// (anti-énumération).
/// </summary>
public class AuthEndpointsTests : IClassFixture<MaestroApiGatewayFactory>
{
    private readonly MaestroApiGatewayFactory _factory;
    private readonly HttpClient _client;

    public AuthEndpointsTests(MaestroApiGatewayFactory factory)
    {
        _factory = factory;
        // AllowAutoRedirect = false → on inspecte les 302
        _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    // ─── /auth/login redirections ──────────────────────────────────────

    [Fact]
    public async Task GET_auth_login_renvoie_302_vers_Keycloak_et_pose_cookie_state()
    {
        var response = await _client.GetAsync("/auth/login");

        response.StatusCode.Should().Be(HttpStatusCode.Redirect);
        response.Headers.Location.Should().NotBeNull();
        response.Headers.Location!.ToString().Should().Contain("/protocol/openid-connect/auth");
        response.Headers.Location!.ToString().Should().Contain("response_type=code");
        response.Headers.Location!.ToString().Should().Contain("client_id=");

        // Cookie maestro_oauth_state posé
        response.Headers.TryGetValues("Set-Cookie", out var cookies).Should().BeTrue();
        string.Join(";", cookies!).Should().Contain("maestro_oauth_state");
    }

    [Fact]
    public async Task GET_auth_login_google_ajoute_kc_idp_hint_google()
    {
        var response = await _client.GetAsync("/auth/login/google");

        response.StatusCode.Should().Be(HttpStatusCode.Redirect);
        response.Headers.Location!.ToString().Should().Contain("kc_idp_hint=google");
    }

    [Fact]
    public async Task GET_auth_login_github_ajoute_kc_idp_hint_github()
    {
        var response = await _client.GetAsync("/auth/login/github");

        response.StatusCode.Should().Be(HttpStatusCode.Redirect);
        response.Headers.Location!.ToString().Should().Contain("kc_idp_hint=github");
    }

    // ─── /auth/callback erreurs ────────────────────────────────────────

    [Fact]
    public async Task GET_auth_callback_sans_code_redirige_vers_login_avec_erreur()
    {
        var response = await _client.GetAsync("/auth/callback");

        response.StatusCode.Should().Be(HttpStatusCode.Redirect);
        response.Headers.Location!.ToString().Should().Contain("/auth/login");
        response.Headers.Location!.ToString().Should().Contain("error=");
    }

    [Fact]
    public async Task GET_auth_callback_avec_state_mismatch_redirige_vers_login()
    {
        // Pas de cookie posé → state expected vide → mismatch
        var response = await _client.GetAsync(
            "/auth/callback?code=fake&state=does-not-match");

        response.StatusCode.Should().Be(HttpStatusCode.Redirect);
        response.Headers.Location!.ToString().Should().Contain("/auth/login");
    }

    // ─── Endpoints protégés ────────────────────────────────────────────

    [Fact]
    public async Task POST_auth_refresh_sans_cookie_retourne_401()
    {
        var response = await _client.PostAsync("/auth/refresh", null);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GET_auth_me_sans_cookie_retourne_401()
    {
        var response = await _client.GetAsync("/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GET_auth_me_avec_token_random_retourne_401()
    {
        // Bearer factice → JwtBearer rejette (pas de clé pour valider)
        var req = new HttpRequestMessage(HttpMethod.Get, "/auth/me");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "not-a-real-jwt");

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── /auth/register ────────────────────────────────────────────────

    [Fact]
    public async Task POST_auth_register_avec_payload_vide_retourne_400()
    {
        // RegisterRequest est [FromForm], on envoie un multipart vide
        var content = new MultipartFormDataContent();

        var response = await _client.PostAsync("/auth/register", content);

        // Le contrôleur valide les champs → 400 BadRequest
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task POST_auth_register_avec_payload_partiel_retourne_400()
    {
        var content = new MultipartFormDataContent
        {
            { new StringContent("ahmedf"), "username" },
            { new StringContent("ahmed@maestro.dev"), "email" },
            // password, firstName, lastName manquent
        };

        var response = await _client.PostAsync("/auth/register", content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("obligatoires");
    }

    [Fact]
    public async Task POST_auth_register_payload_complet_essaye_Keycloak_et_retourne_400_si_unreachable()
    {
        // Keycloak n'est pas joignable en test → RegisterService throw → 400.
        // C'est OK : ce test vérifie le wiring complet (validation passe,
        // RegisterService est bien appelé, l'erreur est convertie en 400).
        var content = new MultipartFormDataContent
        {
            { new StringContent("ahmedf"),             "username"  },
            { new StringContent("ahmed@maestro.dev"),  "email"     },
            { new StringContent("S3cret123!"),         "password"  },
            { new StringContent("Ahmed"),              "firstName" },
            { new StringContent("El Fassi"),           "lastName"  },
        };

        var response = await _client.PostAsync("/auth/register", content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Echec création compte");
    }

    // ─── /auth/forgot-password ─────────────────────────────────────────

    [Fact]
    public async Task POST_auth_forgot_password_sans_email_retourne_400()
    {
        var response = await _client.PostAsJsonAsync("/auth/forgot-password",
            new { email = "" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task POST_auth_forgot_password_avec_email_retourne_200_anti_enumeration()
    {
        // Même si Keycloak est down, on doit ressortir 200 (anti-énumération).
        var response = await _client.PostAsJsonAsync("/auth/forgot-password",
            new { email = "user@maestro.dev" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Si l'email existe");
    }
}
