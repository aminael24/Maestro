using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ApiGateway.Models;

namespace ApiGateway.Services;

public class KeycloakService
{
    private readonly IHttpClientFactory _httpClientFactory;

    public KeycloakService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Variante publique pour les autres services (PasswordResetService).
    /// </summary>
    public virtual Task<string> GetAdminTokenPublicAsync(CancellationToken cancellationToken = default)
        => GetAdminTokenAsync(cancellationToken);

  //obtenir un token d'administrateur Keycloak pour pouvoir créer/supprimer des utilisateurs.
    private async Task<string> GetAdminTokenAsync(CancellationToken cancellationToken = default)
    {
        var tokenEndpoint = Environment.GetEnvironmentVariable("KEYCLOAK_ADMIN_TOKEN_ENDPOINT")
            ?? throw new InvalidOperationException("KEYCLOAK_ADMIN_TOKEN_ENDPOINT manquant.");
        var adminUsername = Environment.GetEnvironmentVariable("KEYCLOAK_ADMIN_USERNAME")
            ?? throw new InvalidOperationException("KEYCLOAK_ADMIN_USERNAME manquant.");
        var adminPassword = Environment.GetEnvironmentVariable("KEYCLOAK_ADMIN_PASSWORD")
            ?? throw new InvalidOperationException("KEYCLOAK_ADMIN_PASSWORD manquant.");
        var adminClientId = Environment.GetEnvironmentVariable("KEYCLOAK_ADMIN_CLIENT_ID") ?? "admin-cli";

        var client = _httpClientFactory.CreateClient();

        var response = await client.PostAsync(
            tokenEndpoint,
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "password",
                ["client_id"]  = adminClientId,
                ["username"]   = adminUsername,
                ["password"]   = adminPassword
            }),
            cancellationToken);

        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Erreur token admin Keycloak: {content}");

        using var doc = JsonDocument.Parse(content);
        if (!doc.RootElement.TryGetProperty("access_token", out var tokenElement))
            throw new InvalidOperationException("access_token absent dans la réponse Keycloak.");

        return tokenElement.GetString()
            ?? throw new InvalidOperationException("Token admin vide.");
    }

    public virtual async Task<string> CreateUserAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var adminApiBaseUrl = Environment.GetEnvironmentVariable("KEYCLOAK_ADMIN_API_BASE_URL")
            ?? throw new InvalidOperationException("KEYCLOAK_ADMIN_API_BASE_URL manquant.");

        var adminToken = await GetAdminTokenAsync(cancellationToken);

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var payload = new
        {
            username      = request.Username,
            email         = request.Email,
            enabled       = true,
            firstName     = request.FirstName,
            lastName      = request.LastName,
            emailVerified = true
        };

        var createResponse = await client.PostAsync(
            $"{adminApiBaseUrl}/users",
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"),
            cancellationToken);

        var createContent = await createResponse.Content.ReadAsStringAsync(cancellationToken);
        if (!createResponse.IsSuccessStatusCode)
            throw new InvalidOperationException($"Erreur création user Keycloak: {createContent}");

        var location = createResponse.Headers.Location?.ToString();
        var keycloakUserId = location?.Split('/').Last();
        if (string.IsNullOrWhiteSpace(keycloakUserId))
            throw new InvalidOperationException("Impossible de récupérer l'id utilisateur Keycloak.");

        // Set password
        var passwordPayload = new { type = "password", value = request.Password, temporary = false };
        var passwordResponse = await client.PutAsync(
            $"{adminApiBaseUrl}/users/{keycloakUserId}/reset-password",
            new StringContent(JsonSerializer.Serialize(passwordPayload), Encoding.UTF8, "application/json"),
            cancellationToken);

        if (!passwordResponse.IsSuccessStatusCode)
        {
            var passwordContent = await passwordResponse.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Erreur définition mot de passe Keycloak: {passwordContent}");
        }

        return keycloakUserId;
    }

    public virtual async Task DeleteUserAsync(string keycloakUserId, CancellationToken cancellationToken = default)
    {
        var adminApiBaseUrl = Environment.GetEnvironmentVariable("KEYCLOAK_ADMIN_API_BASE_URL")
            ?? throw new InvalidOperationException("KEYCLOAK_ADMIN_API_BASE_URL manquant.");

        var adminToken = await GetAdminTokenAsync(cancellationToken);

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var response = await client.DeleteAsync($"{adminApiBaseUrl}/users/{keycloakUserId}", cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Erreur suppression user Keycloak: {content}");
        }
    }
}
