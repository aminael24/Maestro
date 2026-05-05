namespace ApiGateway.Models;

public class AuthCodeExchangeResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public string? IdToken { get; set; }
    public int ExpiresIn { get; set; }
}
