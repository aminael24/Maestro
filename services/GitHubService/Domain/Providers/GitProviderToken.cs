namespace GitHubService.Domain.Providers;

public record GitProviderToken(
    string AccessToken,
    string TokenType,
    string? Scope,
    string? RefreshToken = null,
    int? ExpiresIn = null
);
