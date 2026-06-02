using GitHubService.Application.Requests;
using GitHubService.Domain.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace GitHubService.Controllers;

[ApiController]
[Route("api/repositories")]
public class RepositoryController : ControllerBase
{
    private readonly IRepositoryStore _repositoryStore;

    public RepositoryController(IRepositoryStore repositoryStore)
    {
        _repositoryStore = repositoryStore;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllRepositories()
    {
        var repositories = await _repositoryStore.GetAllAsync();
        return Ok(repositories);
    }

    [HttpGet("{projectId:guid}")]
    public async Task<IActionResult> GetRepository(Guid projectId)
    {
        var repository = await _repositoryStore.GetByProjectIdAsync(projectId);
        return repository is null ? NotFound() : Ok(repository);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRepository([FromBody] CreateRepositoryRequest request)
    {
        var repository = new Domain.Entities.Repository
        {
            Id = Guid.NewGuid(),
            ProjectId = request.ProjectId,
            Provider = request.Provider,
            RemoteUrl = request.RemoteUrl,
            LocalPath = request.LocalPath,
            DefaultBranch = string.IsNullOrWhiteSpace(request.DefaultBranch) ? "main" : request.DefaultBranch,
            IsInitialized = false,
            CreatedAt = DateTime.UtcNow,
        };

        var saved = await _repositoryStore.CreateOrUpdateAsync(repository);
        return CreatedAtAction(nameof(GetRepository), new { projectId = saved.ProjectId }, saved);
    }
}
