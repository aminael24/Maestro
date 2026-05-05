using Maestro.WorkspaceService.Domain.Entities;

namespace Maestro.WorkspaceService.Application.DTOs;

public record ProjectDto(
    int Id,
    string Name,
    string Description,
    string DueDate,
    string Status,
    ProjectType Type,
    string FrontendFramework,
    string BackendFramework,
    string Database,
    bool IsDockerEnabled,
    string KeycloakId
);

public record CreateProjectRequest(
    string Name,
    string? Description = "",
    string? DueDate = "",
    ProjectType Type = ProjectType.Fullstack,
    string? FrontendFramework = "React",
    string? BackendFramework = "Express",
    string? Database = "PostgreSQL",
    bool IsDockerEnabled = true,
    string KeycloakId = ""
);
