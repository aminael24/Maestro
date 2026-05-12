using System.Text.Json;
using ApiGateway.Models;

namespace ApiGateway.Services;

/// <summary>
/// OIDC client pour l'ApiGateway, parle à Keycloak en client *confidentiel*.
///
/// besoin de PKCE — le navigateur suit juste les redirections.
///
/// Lit ces variables d'environnement :
///   KEYCLOAK_REALM_URL        – ex: http://keycloak:8080/realms/maestro
///   KEYCLOAK_TOKEN_ENDPOINT   – /protocol/openid-connect/token
///   KEYCLOAK_CLIENT_ID        – id du client confidentiel (maestro-api-gateway)
///   KEYCLOAK_CLIENT_SECRET    – secret du client confidentiel
///   GATEWAY_PUBLIC_URL        – ex: http://localhost:5000  (pour redirect_uri)
///   KEYCLOAK_PUBLIC_URL       – ex: http://localhost:8080  (URL côté navigateur)
/// </summary>
public class OidcService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<OidcService> _logger;

    public OidcService(IHttpClientFactory httpClientFactory, ILogger<OidcService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// Construit l'URL vers laquelle le navigateur est redirigé à /auth/login.
    /// </summary>
    /// <param name="state">Anti-CSRF, à recroiser au callback.</param>
    /// <param name="idpHint">
    /// Optionnel : alias d'un Identity Provider configuré dans Keycloak
    /// (ex: "google", "github"). Si fourni, Keycloak shunte sa page de
    /// login standard et envoie l'utilisateur directement chez le
    /// provider externe.
    /// </param>
    public string BuildAuthorizationUrl(string state, string? idpHint = null)
    {
        var realmUrl    = RequireEnv("KEYCLOAK_REALM_URL");
        var clientId    = RequireEnv("KEYCLOAK_CLIENT_ID");
        var redirectUri = GetGatewayCallbackUri();

        var authEndpoint = ToBrowserFacingUrl(realmUrl) + "/protocol/openid-connect/auth";

        var qs = new Dictionary<string, string?>
        {
            ["client_id"]     = clientId,
            ["redirect_uri"]  = redirectUri,
            ["response_type"] = "code",
            ["scope"]         = "openid profile email",
            ["state"]         = state,
            // Force la locale Keycloak sur le français pour que les
            // messages des templates (.ftl) et les surcharges
            // messages_fr.properties soient bien utilisés, peu importe
            // l'Accept-Language du navigateur.
            ["kc_locale"]     = "fr",
        };

        if (!string.IsNullOrWhiteSpace(idpHint))
        {
            // kc_idp_hint = alias EXACT d'un Identity Provider configuré
            // dans la console Keycloak (Identity Providers → Add provider).
            // Si l'alias n'existe pas, Keycloak ignore le paramètre.
            qs["kc_idp_hint"] = idpHint;
        }

        var query = string.Join("&",
            qs.Where(kv => !string.IsNullOrEmpty(kv.Value))
              .Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value!)}"));

        return $"{authEndpoint}?{query}";
    }

    /// <summary>
    /// Échange un code d'autorisation contre des tokens.
    /// Client confidentiel → pas de PKCE.
    /// </summary>
    public async Task<OidcTokenSet> ExchangeCodeAsync(
        string code,
        CancellationToken cancellationToken = default)
    {
        var tokenEndpoint = RequireEnv("KEYCLOAK_TOKEN_ENDPOINT");
        var clientId      = RequireEnv("KEYCLOAK_CLIENT_ID");
        var clientSecret  = RequireEnv("KEYCLOAK_CLIENT_SECRET");
        var redirectUri   = GetGatewayCallbackUri();

        var form = new Dictionary<string, string>
        {
            ["grant_type"]    = "authorization_code",
            ["client_id"]     = clientId,
            ["client_secret"] = clientSecret,
            ["code"]          = code,
            ["redirect_uri"]  = redirectUri,
        };

        var client = _httpClientFactory.CreateClient();
        var response = await client.PostAsync(
            tokenEndpoint,
            new FormUrlEncodedContent(form),
            cancellationToken);

        var content = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("[OIDC] Code exchange failed: {Status} {Body}",
                response.StatusCode, content);
            throw new InvalidOperationException($"Erreur échange code OIDC: {content}");
        }

        return ParseTokenResponse(content);
    }

    /// <summary>
    /// Utilise un refresh_token pour obtenir un nouveau set de tokens.
    /// </summary>
    public async Task<OidcTokenSet> RefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        var tokenEndpoint = RequireEnv("KEYCLOAK_TOKEN_ENDPOINT");
        var clientId      = RequireEnv("KEYCLOAK_CLIENT_ID");
        var clientSecret  = RequireEnv("KEYCLOAK_CLIENT_SECRET");

        var form = new Dictionary<string, string>
        {
            ["grant_type"]    = "refresh_token",
            ["client_id"]     = clientId,
            ["client_secret"] = clientSecret,
            ["refresh_token"] = refreshToken,
        };

        var client = _httpClientFactory.CreateClient();
        var response = await client.PostAsync(
            tokenEndpoint,
            new FormUrlEncodedContent(form),
            cancellationToken);

        var content = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Erreur refresh token: {content}");

        return ParseTokenResponse(content);
    }

    /// <summary>
    /// Révoque la session Keycloak en back-channel (sans rediriger le
    /// navigateur). C'est ce qui kill VRAIMENT la session côté serveur :
    /// même si l'utilisateur garde un cookie de session SSO, il ne peut
    /// pas s'en servir ailleurs.
    ///
    /// À appeler avant de clear les cookies maestro_*.
    /// </summary>
    public async Task RevokeRefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        var realmUrl     = RequireEnv("KEYCLOAK_REALM_URL");
        var clientId     = RequireEnv("KEYCLOAK_CLIENT_ID");
        var clientSecret = RequireEnv("KEYCLOAK_CLIENT_SECRET");

        // Logout endpoint accepte aussi un POST avec refresh_token =
        // back-channel logout, sans redirect navigateur.
        var logoutEndpoint = $"{realmUrl}/protocol/openid-connect/logout";

        var form = new Dictionary<string, string>
        {
            ["client_id"]     = clientId,
            ["client_secret"] = clientSecret,
            ["refresh_token"] = refreshToken,
        };

        try
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsync(
                logoutEndpoint,
                new FormUrlEncodedContent(form),
                cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("[OIDC] Backchannel logout OK (session Keycloak invalidée)");
            }
            else
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("[OIDC] Backchannel logout returned {Status}: {Body}",
                    response.StatusCode, body);
            }
        }
        catch (Exception ex)
        {
            // best effort : si Keycloak est down, on ne bloque pas
            // le logout local côté gateway/SPA.
            _logger.LogWarning(ex, "[OIDC] Backchannel logout failed (best effort)");
        }
    }

    /// <summary>
    /// Construit l'URL de fin de session (front-channel). Quand le
    /// navigateur la suit, Keycloak clear ses propres cookies de session
    /// SSO côté navigateur (AUTH_SESSION_ID, KEYCLOAK_IDENTITY).
    /// </summary>
    public string BuildEndSessionUrl(string? idToken, string postLogoutRedirectUri)
    {
        var realmUrl   = RequireEnv("KEYCLOAK_REALM_URL");
        var endSession = ToBrowserFacingUrl(realmUrl) + "/protocol/openid-connect/logout";

        var qs = new Dictionary<string, string?>
        {
            ["post_logout_redirect_uri"] = postLogoutRedirectUri,
            ["client_id"]                = Environment.GetEnvironmentVariable("KEYCLOAK_CLIENT_ID"),
            ["id_token_hint"]            = idToken,
        };

        var query = string.Join("&",
            qs.Where(kv => !string.IsNullOrEmpty(kv.Value))
              .Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value!)}"));

        return $"{endSession}?{query}";
    }

    // ── Helpers ──────────────────────────────────────────────────

    private static OidcTokenSet ParseTokenResponse(string json)
    {
        using var doc = JsonDocument.Parse(json);
        return new OidcTokenSet
        {
            AccessToken  = doc.RootElement.GetProperty("access_token").GetString() ?? string.Empty,
            RefreshToken = doc.RootElement.TryGetProperty("refresh_token", out var refresh)
                ? refresh.GetString() : null,
            IdToken      = doc.RootElement.TryGetProperty("id_token", out var idToken)
                ? idToken.GetString() : null,
            ExpiresIn    = doc.RootElement.TryGetProperty("expires_in", out var expires)
                ? expires.GetInt32() : 0,
        };
    }

    private static string RequireEnv(string name) =>
        Environment.GetEnvironmentVariable(name)
        ?? throw new InvalidOperationException($"{name} manquant.");

    private static string GetGatewayCallbackUri()
    {
        var publicUrl = Environment.GetEnvironmentVariable("GATEWAY_PUBLIC_URL")
                        ?? "http://localhost:5000";
        return publicUrl.TrimEnd('/') + "/auth/callback";
    }

    /// <summary>
    /// Keycloak inside docker is reached at http://keycloak:8080/... but
    /// the *browser* must reach it at http://localhost:8080/... — the
    /// authorization endpoint URL given to the user must use the
    /// browser-visible host. KEYCLOAK_PUBLIC_URL overrides the host used
    /// for browser-facing URLs.
    /// </summary>
    private static string ToBrowserFacingUrl(string realmUrl)
    {
        var publicBase = Environment.GetEnvironmentVariable("KEYCLOAK_PUBLIC_URL");
        if (string.IsNullOrEmpty(publicBase))
        {
            return realmUrl.Replace("//keycloak:", "//localhost:");
        }

        var parsed = new Uri(realmUrl);
        return publicBase.TrimEnd('/') + parsed.AbsolutePath;
    }
}
