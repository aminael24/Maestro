namespace GitHubService.Application.Requests;

public record CreateRepositoryRequest(
    Guid ProjectId,
    string LocalPath,
    string DefaultBranch,
    string Provider,
    string RemoteUrl
);

public record GitBranchRequest(string BranchName);
public record GitCommitRequest(string Message);
public record GitPushRequest(string BranchName);
