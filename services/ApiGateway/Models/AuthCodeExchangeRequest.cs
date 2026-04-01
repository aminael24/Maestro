namespace ApiGateway.Models;

public class AuthCodeExchangeRequest
{
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// PKCE code_verifier – envoyé par le frontend pour compléter le flux.
    /// </summary>
    public string? CodeVerifier { get; set; }
}
