using GitHubService.Domain.Providers;
using GitHubService.Domain.Repositories;
using GitHubService.Domain.Services;

namespace GitHubService.Domain.Services;

public class ProviderFacade : IProviderFacade
{
    private readonly GitHubProvider _githubProvider;
    private readonly IRepositoryStore _repositoryStore;
    private readonly IGitService _gitService;

    public ProviderFacade(
        GitHubProvider githubProvider,
        IRepositoryStore repositoryStore,
        IGitService gitService)
    {
        _githubProvider = githubProvider;
        _repositoryStore = repositoryStore;
        _gitService = gitService;
    }

    public Task<IReadOnlyList<string>> GetAvailableProvidersAsync()
    {
        return Task.FromResult<IReadOnlyList<string>>(new[] { "github" });
    }

    public Task<Uri> GetAuthorizationUrlAsync(string provider, string redirectUri, string state)
    {
        var gitProvider = GetProvider(provider);
        return gitProvider.GetAuthorizationUrlAsync(redirectUri, state);
    }

    public Task<GitProviderToken> ExchangeCodeAsync(string provider, string code, string redirectUri)
    {
        var gitProvider = GetProvider(provider);
        return gitProvider.ExchangeCodeAsync(code, redirectUri);
    }

    public async Task<ProviderRepositoryMetadata> CreateRepositoryAsync(string provider, Guid projectId, string accessToken, string name, string description, bool isPrivate)
    {
        var gitProvider = GetProvider(provider);
        var metadata = await gitProvider.CreateRepositoryAsync(accessToken, name, description, isPrivate);

        var localPath = $"/app/projects/{projectId}";

        var repository = new Domain.Entities.Repository
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Provider = provider,
            RemoteUrl = metadata.CloneUrl,
            LocalPath = localPath,
            DefaultBranch = "main",
            IsInitialized = false,
            CreatedAt = DateTime.UtcNow,
        };

        await _repositoryStore.CreateOrUpdateAsync(repository);

        // Init git repo
        var initResult = await _gitService.InitRepoAsync(localPath);
        if (initResult.Success)
        {
            // Set git identity so commits work
            await _gitService.RunConfigAsync(localPath, "user.email", "maestro@app.local");
            await _gitService.RunConfigAsync(localPath, "user.name", "Maestro");

            // Add the remote using the token-authenticated URL
            // Format: https://<token>@github.com/user/repo.git
            var authenticatedUrl = metadata.CloneUrl.Replace(
                "https://",
                $"https://{accessToken}@"
            );
            await _gitService.AddRemoteAsync(localPath, "origin", authenticatedUrl);

            repository.IsInitialized = true;
            await _repositoryStore.SaveChangesAsync();
        }

        return metadata;
    }

    public Task<ProviderRepositoryMetadata> GetRepositoryMetadataAsync(string provider, string accessToken, string owner, string repoName)
    {
        var gitProvider = GetProvider(provider);
        return gitProvider.GetRepositoryMetadataAsync(accessToken, owner, repoName);
    }

    private IGitProvider GetProvider(string provider)
    {
        return provider.ToLowerInvariant() == "github" ? _githubProvider : _githubProvider;
    }
}