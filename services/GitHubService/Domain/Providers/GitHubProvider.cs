using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GitHubService.Domain.Providers;

namespace GitHubService.Domain.Providers;

public class GitHubProvider : IGitProvider
{
    private const string AuthorizationEndpoint = "https://github.com/login/oauth/authorize";
    private const string TokenEndpoint = "https://github.com/login/oauth/access_token";
    private const string ApiBaseUrl = "https://api.github.com";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _clientId;
    private readonly string _clientSecret;

    public GitHubProvider(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
        _clientId = Environment.GetEnvironmentVariable("GITHUB_CLIENT_ID") ?? throw new InvalidOperationException("GITHUB_CLIENT_ID is required");
        _clientSecret = Environment.GetEnvironmentVariable("GITHUB_CLIENT_SECRET") ?? throw new InvalidOperationException("GITHUB_CLIENT_SECRET is required");
    }

    public string ProviderName => "github";
    public bool SupportsOAuth => true;

    public Task<Uri> GetAuthorizationUrlAsync(string redirectUri, string state)
    {
        var url = new UriBuilder(AuthorizationEndpoint);
        var query = new Dictionary<string, string?>
        {
            ["client_id"] = _clientId,
            ["redirect_uri"] = redirectUri,
            ["state"] = state,
            ["scope"] = "repo"
        };

        url.Query = string.Join('&', query.Select(kvp => $"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value ?? string.Empty)}"));
        return Task.FromResult(url.Uri);
    }

    public async Task<GitProviderToken> ExchangeCodeAsync(string code, string redirectUri)
    {
        using var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var request = new Dictionary<string, string>
        {
            ["client_id"] = _clientId,
            ["client_secret"] = _clientSecret,
            ["code"] = code,
            ["redirect_uri"] = redirectUri
        };

        using var response = await client.PostAsync(TokenEndpoint, new FormUrlEncodedContent(request));
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        var accessToken = payload.GetProperty("access_token").GetString() ?? string.Empty;
        var tokenType = payload.GetProperty("token_type").GetString() ?? "bearer";
        var scope = payload.TryGetProperty("scope", out var scopeValue) ? scopeValue.GetString() : null;

        return new GitProviderToken(accessToken, tokenType, scope);
    }

    public async Task<ProviderRepositoryMetadata> CreateRepositoryAsync(string accessToken, string name, string description, bool isPrivate)
    {
        using var client = CreateGitHubClient(accessToken);
        var requestBody = new
        {
            name,
            description,
            @private = isPrivate
        };

        using var response = await client.PostAsJsonAsync($"{ApiBaseUrl}/user/repos", requestBody);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        return MapMetadata(payload);
    }

    public async Task<ProviderRepositoryMetadata> GetRepositoryMetadataAsync(string accessToken, string owner, string repoName)
    {
        using var client = CreateGitHubClient(accessToken);
        using var response = await client.GetAsync($"{ApiBaseUrl}/repos/{Uri.EscapeDataString(owner)}/{Uri.EscapeDataString(repoName)}");
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        return MapMetadata(payload);
    }

    private HttpClient CreateGitHubClient(string accessToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.UserAgent.ParseAdd("Maestro-GitHubService");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        return client;
    }

    private static ProviderRepositoryMetadata MapMetadata(JsonElement payload)
    {
        var repositoryId = payload.TryGetProperty("node_id", out var nodeId) ? nodeId.GetString() ?? string.Empty : string.Empty;
        var name = payload.GetProperty("name").GetString() ?? string.Empty;
        var description = payload.TryGetProperty("description", out var desc) ? desc.GetString() ?? string.Empty : string.Empty;
        var cloneUrl = payload.TryGetProperty("clone_url", out var clone) ? clone.GetString() ?? string.Empty : string.Empty;
        var htmlUrl = payload.TryGetProperty("html_url", out var html) ? html.GetString() ?? string.Empty : string.Empty;

        return new ProviderRepositoryMetadata(repositoryId, name, description, cloneUrl, htmlUrl, "github");
    }
}
