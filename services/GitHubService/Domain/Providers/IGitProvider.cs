namespace GitHubService.Domain.Providers;

public interface IGitProvider
{
    string ProviderName { get; }
    bool SupportsOAuth { get; }

    Task<Uri> GetAuthorizationUrlAsync(string redirectUri, string state);
    Task<GitProviderToken> ExchangeCodeAsync(string code, string redirectUri);
    Task<ProviderRepositoryMetadata> CreateRepositoryAsync(string accessToken, string name, string description, bool isPrivate);
    Task<ProviderRepositoryMetadata> GetRepositoryMetadataAsync(string accessToken, string owner, string repoName);
}
