namespace GitHubService.Domain.Providers;

public record ProviderRepositoryMetadata(
    string RepositoryId,
    string Name,
    string Description,
    string CloneUrl,
    string HtmlUrl,
    string Provider
);
