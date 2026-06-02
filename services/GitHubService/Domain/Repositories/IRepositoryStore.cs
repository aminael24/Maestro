using GitHubService.Domain.Entities;

namespace GitHubService.Domain.Repositories;

public interface IRepositoryStore
{
    Task<IReadOnlyList<Repository>> GetAllAsync();
    Task<Repository?> GetByProjectIdAsync(Guid projectId);
    Task<Repository?> GetByIdAsync(Guid id);
    Task<Repository> CreateOrUpdateAsync(Repository repository);
    Task SaveChangesAsync();
}
