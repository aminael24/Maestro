using GitHubService.Application.Requests;
using GitHubService.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace GitHubService.Controllers;

[ApiController]
[Route("api/providers")]
public class ProviderController : ControllerBase
{
    private readonly IProviderFacade _providerFacade;

    public ProviderController(IProviderFacade providerFacade)
    {
        _providerFacade = providerFacade;
    }

    [HttpGet]
    public async Task<IActionResult> GetAvailableProviders()
    {
        var providers = await _providerFacade.GetAvailableProvidersAsync();
        return Ok(providers);
    }

    [HttpGet("{provider}/auth-url")]
    public async Task<IActionResult> GetAuthorizationUrl(string provider, [FromQuery] string redirectUri, [FromQuery] string state)
    {
        var url = await _providerFacade.GetAuthorizationUrlAsync(provider, redirectUri, state);
        return Ok(new { authUrl = url.ToString() });
    }

    [HttpPost("{provider}/token")]
    public async Task<IActionResult> ExchangeCode(string provider, [FromBody] OAuthCodeRequest request)
    {
        var token = await _providerFacade.ExchangeCodeAsync(provider, request.Code, request.RedirectUri);
        return Ok(token);
    }

    [HttpPost("{provider}/repositories")]
    public async Task<IActionResult> CreateRepository(string provider, [FromBody] CreateProviderRepositoryRequest request)
    {
        var metadata = await _providerFacade.CreateRepositoryAsync(provider, request.ProjectId, request.AccessToken, request.Name, request.Description, request.IsPrivate);
        return Created($"api/providers/{provider}/repositories/{metadata.Name}", metadata);
    }

    [HttpGet("{provider}/repositories/{owner}/{repoName}")]
    public async Task<IActionResult> GetRepositoryMetadata(string provider, string owner, string repoName, [FromQuery] string accessToken)
    {
        var metadata = await _providerFacade.GetRepositoryMetadataAsync(provider, accessToken, owner, repoName);
        return Ok(metadata);
    }
}

public record OAuthCodeRequest(string Code, string RedirectUri);
public record CreateProviderRepositoryRequest(Guid ProjectId, string AccessToken, string Name, string Description, bool IsPrivate);