namespace ApiGateway.Models;
public class LocalUser
{
     public int Id { get; set; }
    public string KeycloakId { get; set; } = default!;
    public string? ProfileUrl { get; set; }
}
