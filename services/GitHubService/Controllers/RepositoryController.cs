using GitHubService.Application.Requests;
using GitHubService.Domain.Repositories;
using GitHubService.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace GitHubService.Controllers;

[ApiController]
[Route("api/repositories")]
public class RepositoryController : ControllerBase
{
    private readonly IRepositoryStore _repositoryStore;
    private readonly IGitService _gitService;

    public RepositoryController(IRepositoryStore repositoryStore, IGitService gitService)
    {
        _repositoryStore = repositoryStore;
        _gitService = gitService;
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

    [HttpPost("{projectId:guid}/commit")]
    public async Task<IActionResult> Commit(Guid projectId, [FromBody] CommitRequest request)
    {
        var repository = await _repositoryStore.GetByProjectIdAsync(projectId);
        if (repository is null) return NotFound("Repository not found for this project.");

        var result = await _gitService.CommitAsync(repository.LocalPath, request.Message);
        if (!result.Success)
            return BadRequest(new { error = result.Error, exitCode = result.ExitCode });

        return Ok(new { message = "Committed successfully", output = result.Output });
    }

    [HttpPost("{projectId:guid}/push")]
    public async Task<IActionResult> Push(Guid projectId)
    {
        var repository = await _repositoryStore.GetByProjectIdAsync(projectId);
        if (repository is null) return NotFound("Repository not found for this project.");

        // PushAndPublishAsync does the git push AND fires the Kafka github.push event
        var result = await _gitService.PushAndPublishAsync(
            repository.LocalPath,
            repository.DefaultBranch,
            projectId.ToString(),
            repository.RemoteUrl
        );

        if (!result.Success)
            return BadRequest(new { error = result.Error, exitCode = result.ExitCode });

        return Ok(new { message = "Pushed successfully", output = result.Output });
    }
}

public record CommitRequest(string Message);