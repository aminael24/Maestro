using GitHubService.Domain.Models;

namespace GitHubService.Domain.Services;

public interface IGitService
{
    Task<GitCommandResult> InitRepoAsync(string localPath);
    Task<GitCommandResult> CreateBranchAsync(string localPath, string branchName);
    Task<GitCommandResult> CommitAsync(string localPath, string message);
    Task<GitCommandResult> PushAsync(string localPath, string branchName);
    Task<GitCommandResult> FetchAsync(string localPath);
    Task<GitStatusResult> StatusAsync(string localPath);
}
