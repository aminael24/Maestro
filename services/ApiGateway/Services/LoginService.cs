using System.Text.Json;
using ApiGateway.Models;

namespace ApiGateway.Services;

public class LoginService
{
    private readonly IHttpClientFactory _httpClientFactory;

    public LoginService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public virtual async Task<OidcTokenSet> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var tokenEndpoint = Environment.GetEnvironmentVariable("KEYCLOAK_TOKEN_ENDPOINT")
            ?? throw new InvalidOperationException("KEYCLOAK_TOKEN_ENDPOINT manquant.");
        var clientId = Environment.GetEnvironmentVariable("KEYCLOAK_CLIENT_ID")
            ?? throw new InvalidOperationException("KEYCLOAK_CLIENT_ID manquant.");
        var clientSecret = Environment.GetEnvironmentVariable("KEYCLOAK_CLIENT_SECRET")
            ?? throw new InvalidOperationException("KEYCLOAK_CLIENT_SECRET manquant.");

        var client = _httpClientFactory.CreateClient();
        var response = await client.PostAsync(
            tokenEndpoint,
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"]    = "password",
                ["client_id"]     = clientId,
                ["client_secret"] = clientSecret,
                ["username"]      = request.Username,
                ["password"]      = request.Password,
                ["scope"]         = "openid"
            }),
            cancellationToken);

        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Erreur login Keycloak: {content}");

        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        return new OidcTokenSet
        {
            AccessToken  = root.GetProperty("access_token").GetString() ?? string.Empty,
            RefreshToken = root.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null,
            IdToken      = root.TryGetProperty("id_token", out var idt) ? idt.GetString() : null,
            ExpiresIn    = root.TryGetProperty("expires_in", out var ex) ? ex.GetInt32() : 0,
        };
    }
}