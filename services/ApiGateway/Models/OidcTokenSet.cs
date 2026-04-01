namespace ApiGateway.Models;

/// <summary>
/// Jeu complet de tokens retourné par Keycloak.
/// Usage interne uniquement — le contrôleur filtre avant d'envoyer au frontend.
/// </summary>
public class OidcTokenSet
{
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public string? IdToken { get; set; }
    public int ExpiresIn { get; set; }
}
