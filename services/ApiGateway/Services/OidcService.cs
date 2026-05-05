using System.Text.Json;
using ApiGateway.Models;

namespace ApiGateway.Services;

/// <summary>
/// OIDC client for the ApiGateway, talking to Keycloak as a *confidential*
/// client. The frontend is no longer involved in the code exchange and
/// no longer needs to do PKCE — the browser just follows redirects.
///
/// Reads from environment variables:
///   KEYCLOAK_REALM_URL        – e.g. http://keycloak:8080/realms/maestro
///   KEYCLOAK_TOKEN_ENDPOINT   – /protocol/openid-connect/token
///   KEYCLOAK_CLIENT_ID        – confidential client id (e.g. maestro-api-gateway)
///   KEYCLOAK_CLIENT_SECRET    – confidential client secret
///   GATEWAY_PUBLIC_URL        – e.g. http://localhost:5000  (used as redirect_uri)
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
    /// Builds the URL that the browser is redirected to at /auth/login.
    /// </summary>
    public string BuildAuthorizationUrl(string state)
    {
        var realmUrl = RequireEnv("KEYCLOAK_REALM_URL");
        var clientId = RequireEnv("KEYCLOAK_CLIENT_ID");
        var redirectUri = GetGatewayCallbackUri();

        // Keycloak's external (browser-facing) issuer URL is built from the
        // public base, *not* the docker-internal one. We swap the host part
        // because the browser needs to reach Keycloak on localhost:8080.
        var authEndpoint = ToBrowserFacingUrl(realmUrl) + "/protocol/openid-connect/auth";

        var qs = new Dictionary<string, string?>
        {
            ["client_id"]     = clientId,
            ["redirect_uri"]  = redirectUri,
            ["response_type"] = "code",
            ["scope"]         = "openid profile email",
            ["state"]         = state,
        };

        var query = string.Join("&",
            qs.Where(kv => !string.IsNullOrEmpty(kv.Value))
              .Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value!)}"));

        return $"{authEndpoint}?{query}";
    }

    /// <summary>
    /// Exchanges an authorization code for tokens. Uses client_secret
    /// (confidential client) — no PKCE needed.
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
    /// Uses a refresh_token to obtain a new token set. Confidential client.
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
    /// Returns the URL the browser should be sent to in order to log out
    /// of Keycloak. id_token is passed as id_token_hint when available.
    /// </summary>
    public string BuildEndSessionUrl(string? idToken, string postLogoutRedirectUri)
    {
        var realmUrl = RequireEnv("KEYCLOAK_REALM_URL");
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

    /// <summary>
    /// Returns the redirect_uri the gateway registers with Keycloak.
    /// Defaults to http://localhost:5000/auth/callback for local dev.
    /// </summary>
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
            // Fallback: replace docker hostname "keycloak" with localhost.
            return realmUrl.Replace("//keycloak:", "//localhost:");
        }

        // realmUrl looks like  http://keycloak:8080/realms/maestro
        // we want              {publicBase}/realms/maestro
        var parsed = new Uri(realmUrl);
        return publicBase.TrimEnd('/') + parsed.AbsolutePath;
    }
}
