namespace GitHubService.Domain.Entities;

public class SyncOperation
{
    public Guid Id { get; set; }
    public Guid RepositoryId { get; set; }
    public string BranchName { get; set; } = null!;
    public string? CommitSha { get; set; }
    public string Status { get; set; } = null!;
    public string? Logs { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public Repository? Repository { get; set; }
}
