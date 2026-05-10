using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GitHubService.Domain.Entities;

public class Repository
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Provider { get; set; } = null!;
    public string RemoteUrl { get; set; } = null!;
    public string LocalPath { get; set; } = null!;
    public string DefaultBranch { get; set; } = "main";
    public bool IsInitialized { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<SyncOperation> SyncOperations { get; set; } = new List<SyncOperation>();
}
