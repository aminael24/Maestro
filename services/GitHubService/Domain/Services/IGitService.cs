using GitHubService.Domain.Models;

namespace GitHubService.Domain.Services;

public interface IGitService
{
    Task<GitCommandResult> InitRepoAsync(string localPath);
    Task<GitCommandResult> CreateBranchAsync(string localPath, string branchName);
    Task<GitCommandResult> CommitAsync(string localPath, string message);
    Task<GitCommandResult> PushAsync(string localPath, string branchName);
    Task<GitCommandResult> PushAndPublishAsync(string localPath, string branchName, string projectId, string remoteUrl);
    Task<GitCommandResult> FetchAsync(string localPath);
    Task<GitStatusResult> StatusAsync(string localPath);
    Task<GitCommandResult> AddRemoteAsync(string localPath, string remoteName, string remoteUrl);
    Task<GitCommandResult> RunConfigAsync(string localPath, string key, string value);
}