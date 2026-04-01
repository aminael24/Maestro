using System.Text.Json;
using ApiGateway.Models;

namespace ApiGateway.Services;

/// <summary>
/// Échange un code OIDC Authorization Code (+PKCE) contre des tokens.
/// Le refresh_token n'est JAMAIS renvoyé au frontend — il est stocké
/// dans un cookie HttpOnly côté backend.
/// </summary>
public class OidcService
{
    private readonly IHttpClientFactory _httpClientFactory;

    public OidcService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Échange le code d'autorisation OIDC + PKCE code_verifier
    /// contre les tokens Keycloak. Retourne TOUS les tokens bruts
    /// (le contrôleur décide ce qu'il expose au frontend).
    /// </summary>
    public async Task<OidcTokenSet> ExchangeCodeAsync(
        string code,
        string? codeVerifier,
        CancellationToken cancellationToken = default)
    {
        var tokenEndpoint = Environment.GetEnvironmentVariable("KEYCLOAK_TOKEN_ENDPOINT")
            ?? throw new InvalidOperationException("KEYCLOAK_TOKEN_ENDPOINT manquant.");

        var clientId = Environment.GetEnvironmentVariable("KEYCLOAK_FRONTEND_CLIENT_ID")
            ?? throw new InvalidOperationException("KEYCLOAK_FRONTEND_CLIENT_ID manquant.");

        var redirectUri = Environment.GetEnvironmentVariable("KEYCLOAK_FRONTEND_REDIRECT_URI")
            ?? throw new InvalidOperationException("KEYCLOAK_FRONTEND_REDIRECT_URI manquant.");

        var client = _httpClientFactory.CreateClient();

        var form = new Dictionary<string, string>
        {
            ["grant_type"]   = "authorization_code",
            ["client_id"]    = clientId,
            ["code"]         = code,
            ["redirect_uri"] = redirectUri
        };

        if (!string.IsNullOrWhiteSpace(codeVerifier))
        {
            form["code_verifier"] = codeVerifier;
        }

        var response = await client.PostAsync(
            tokenEndpoint,
            new FormUrlEncodedContent(form),
            cancellationToken);

        var content = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Erreur échange code OIDC: {content}");

        return ParseTokenResponse(content);
    }

    /// <summary>
    /// Utilise un refresh_token pour obtenir un nouveau jeu de tokens.
    /// </summary>
    public async Task<OidcTokenSet> RefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        var tokenEndpoint = Environment.GetEnvironmentVariable("KEYCLOAK_TOKEN_ENDPOINT")
            ?? throw new InvalidOperationException("KEYCLOAK_TOKEN_ENDPOINT manquant.");

        var clientId = Environment.GetEnvironmentVariable("KEYCLOAK_FRONTEND_CLIENT_ID")
            ?? throw new InvalidOperationException("KEYCLOAK_FRONTEND_CLIENT_ID manquant.");

        var client = _httpClientFactory.CreateClient();

        var form = new Dictionary<string, string>
        {
            ["grant_type"]    = "refresh_token",
            ["client_id"]     = clientId,
            ["refresh_token"] = refreshToken
        };

        var response = await client.PostAsync(
            tokenEndpoint,
            new FormUrlEncodedContent(form),
            cancellationToken);

        var content = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Erreur refresh token: {content}");

        return ParseTokenResponse(content);
    }

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
                ? expires.GetInt32() : 0
        };
    }
}
