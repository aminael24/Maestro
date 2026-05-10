using GitHubService.Domain.Entities;
using GitHubService.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace GitHubService.Infrastructure;

public class RepositoryStore : IRepositoryStore
{
    private readonly GitHubDbContext _dbContext;

    public RepositoryStore(GitHubDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Repository?> GetByProjectIdAsync(Guid projectId)
    {
        return await _dbContext.Repositories.FirstOrDefaultAsync(r => r.ProjectId == projectId);
    }

    public async Task<IReadOnlyList<Repository>> GetAllAsync()
    {
        return await _dbContext.Repositories.ToListAsync();
    }

    public async Task<Repository?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Repositories.FindAsync(id);
    }

    public async Task<Repository> CreateOrUpdateAsync(Repository repository)
    {
        var existing = await _dbContext.Repositories.FirstOrDefaultAsync(r => r.ProjectId == repository.ProjectId);
        if (existing is null)
        {
            _dbContext.Repositories.Add(repository);
        }
        else
        {
            existing.LocalPath = repository.LocalPath;
            existing.DefaultBranch = repository.DefaultBranch;
            existing.Provider = repository.Provider;
            existing.RemoteUrl = repository.RemoteUrl;
            existing.IsInitialized = repository.IsInitialized;
            _dbContext.Repositories.Update(existing);
            repository = existing;
        }

        await _dbContext.SaveChangesAsync();
        return repository;
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
