using Maestro.WorkspaceService.Application.DTOs;
using Maestro.WorkspaceService.Domain.Entities;
using Maestro.WorkspaceService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Maestro.WorkspaceService.Application.Services;

public interface IProjectService
{
    Task<IEnumerable<ProjectDto>> GetAllProjectsAsync();
    Task<ProjectDto?> GetProjectByIdAsync(int id);
    Task<ProjectDto> CreateProjectAsync(CreateProjectRequest request);
    Task<bool> DeleteProjectAsync(int id);
}

public class ProjectService(WorkspaceDbContext db) : IProjectService
{
    public async Task<IEnumerable<ProjectDto>> GetAllProjectsAsync()
    {
        var projects = await db.Projects.ToListAsync();
        return projects.Select(MapToDto);
    }

    public async Task<ProjectDto?> GetProjectByIdAsync(int id)
    {
        var project = await db.Projects.FindAsync(id);
        return project != null ? MapToDto(project) : null;
    }

    public async Task<ProjectDto> CreateProjectAsync(CreateProjectRequest request)
    {
        var project = new Project
        {
            Name = request.Name,
            Description = request.Description,
            DueDate = request.DueDate,
            Type = request.Type,
            FrontendFramework = request.FrontendFramework,
            BackendFramework = request.BackendFramework,
            Database = request.Database,
            IsDockerEnabled = request.IsDockerEnabled,
            Status = "pending"
        };

        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return MapToDto(project);
    }

    public async Task<bool> DeleteProjectAsync(int id)
    {
        var project = await db.Projects.FindAsync(id);
        if (project == null) return false;

        db.Projects.Remove(project);
        await db.SaveChangesAsync();
        return true;
    }

    private static ProjectDto MapToDto(Project p) => new(
        p.Id, p.Name, p.Description, p.DueDate, p.Status, 
        p.Type, p.FrontendFramework, p.BackendFramework, 
        p.Database, p.IsDockerEnabled
    );
}
