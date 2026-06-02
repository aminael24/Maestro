namespace GitHubService.Domain.Entities;

public class GitHubConnection
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public long GitHubUserId { get; set; }
    public string? GitHubUsername { get; set; }
    public string EncryptedAccessToken { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
