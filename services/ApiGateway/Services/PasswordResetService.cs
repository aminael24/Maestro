using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ApiGateway.Services;

/// <summary>
/// Service qui déclenche un email de reset de mot de passe via l'API
/// Admin Keycloak.
///
/// Flow :
///   1. User envoie son email → POST /auth/forgot-password
///   2. Le gateway récupère un admin token Keycloak
///   3. Cherche le user par email
///   4. Si trouvé → demande à Keycloak d'envoyer un mail
///      "execute-actions-email" avec l'action UPDATE_PASSWORD
///   5. Keycloak envoie l'email avec un lien magique (expire en 12h)
///   6. L'utilisateur clique → page Keycloak pour saisir un nouveau MdP
///   7. Après validation → redirect vers /auth/callback (notre frontend)
///
/// IMPORTANT côté Keycloak :
///   - SMTP configuré au niveau du realm (Realm settings → Email)
///   - Service account du client maestro-api-gateway DOIT avoir les
///     rôles realm-management : manage-users, query-users, view-users
///   - Anti-énumération : on ne dit JAMAIS au frontend si l'email
///     existe ou non (réponse toujours 200)
/// </summary>
public class PasswordResetService
{
    private readonly KeycloakService _keycloakService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<PasswordResetService> _logger;

    public PasswordResetService(
        KeycloakService keycloakService,
        IHttpClientFactory httpClientFactory,
        ILogger<PasswordResetService> logger)
    {
        _keycloakService    = keycloakService;
        _httpClientFactory  = httpClientFactory;
        _logger             = logger;
    }

    /// <summary>
    /// Déclenche un email de reset si l'utilisateur existe.
    /// Retourne TOUJOURS true (anti-énumération).
    /// </summary>
    public async Task<bool> SendResetEmailAsync(
        string email,
        string? clientId = null,
        string? redirectUri = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email)) return true;

        var adminApiBaseUrl = Environment.GetEnvironmentVariable("KEYCLOAK_ADMIN_API_BASE_URL")
            ?? throw new InvalidOperationException("KEYCLOAK_ADMIN_API_BASE_URL manquant.");

        try
        {
            var adminToken = await _keycloakService.GetAdminTokenPublicAsync(cancellationToken);

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", adminToken);

            // 1. Chercher le user par email (exact match)
            var searchUrl =
                $"{adminApiBaseUrl}/users?email={Uri.EscapeDataString(email)}&exact=true";
            var searchResponse = await client.GetAsync(searchUrl, cancellationToken);

            if (!searchResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("[Reset] Échec recherche user: {Status}",
                    searchResponse.StatusCode);
                return true; // anti-énumération
            }

            var body = await searchResponse.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(body);

            if (doc.RootElement.GetArrayLength() == 0)
            {
                _logger.LogInformation("[Reset] Pas de user pour email '{Email}' (silencieux)",
                    email);
                return true;
            }

            var user = doc.RootElement[0];
            if (!user.TryGetProperty("id", out var idEl))
                return true;

            var userId = idEl.GetString();
            if (string.IsNullOrWhiteSpace(userId)) return true;

            // 2. Demander à Keycloak d'envoyer le mail UPDATE_PASSWORD
            //
            // PUT /admin/realms/{realm}/users/{id}/execute-actions-email
            //   ?lifespan=43200&client_id=...&redirect_uri=...
            //   body : ["UPDATE_PASSWORD"]
            var qs = new List<string>
            {
                "lifespan=43200" // 12h
            };
            if (!string.IsNullOrWhiteSpace(clientId))
                qs.Add($"client_id={Uri.EscapeDataString(clientId)}");
            if (!string.IsNullOrWhiteSpace(redirectUri))
                qs.Add($"redirect_uri={Uri.EscapeDataString(redirectUri)}");

            var actionsUrl =
                $"{adminApiBaseUrl}/users/{userId}/execute-actions-email?{string.Join("&", qs)}";

            var actionsPayload = JsonSerializer.Serialize(new[] { "UPDATE_PASSWORD" });
            var actionsResponse = await client.PutAsync(
                actionsUrl,
                new StringContent(actionsPayload, Encoding.UTF8, "application/json"),
                cancellationToken);

            if (!actionsResponse.IsSuccessStatusCode)
            {
                var errBody = await actionsResponse.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "[Reset] Échec envoi mail Keycloak: {Status} {Body}",
                    actionsResponse.StatusCode, errBody);
                return true; // anti-énumération
            }

            _logger.LogInformation("[Reset] Email reset déclenché pour {Email}", email);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Reset] Erreur inattendue (best effort)");
            return true;
        }
    }
}
