using GitHubService.Domain.Providers;

namespace GitHubService.Domain.Services;

public interface IProviderFacade
{
    Task<IReadOnlyList<string>> GetAvailableProvidersAsync();
    Task<Uri> GetAuthorizationUrlAsync(string provider, string redirectUri, string state);
    Task<GitProviderToken> ExchangeCodeAsync(string provider, string code, string redirectUri);
    Task<ProviderRepositoryMetadata> CreateRepositoryAsync(string provider, Guid projectId, string accessToken, string name, string description, bool isPrivate);
    Task<ProviderRepositoryMetadata> GetRepositoryMetadataAsync(string provider, string accessToken, string owner, string repoName);
}