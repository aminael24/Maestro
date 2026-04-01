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

    public async Task<object> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
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
                ["password"]      = request.Password
            }),
            cancellationToken);

        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Erreur login Keycloak: {content}");

        using var doc = JsonDocument.Parse(content);
        return new
        {
            access_token       = doc.RootElement.GetProperty("access_token").GetString(),
            refresh_token      = doc.RootElement.GetProperty("refresh_token").GetString(),
            expires_in         = doc.RootElement.GetProperty("expires_in").GetInt32(),
            refresh_expires_in = doc.RootElement.GetProperty("refresh_expires_in").GetInt32(),
            token_type         = doc.RootElement.GetProperty("token_type").GetString()
        };
    }
}
