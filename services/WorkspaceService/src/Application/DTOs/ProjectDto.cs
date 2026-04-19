namespace Maestro.WorkspaceService.Application.DTOs;

public record ProjectDto(
    int Id,
    string Name,
    string Description,
    string DueDate,
    string Status,
    string Type,
    string FrontendFramework,
    string BackendFramework,
    string Database,
    bool IsDockerEnabled
);

public record CreateProjectRequest(
    string Name,
    string Description,
    string DueDate,
    string Type,
    string FrontendFramework,
    string BackendFramework,
    string Database,
    bool IsDockerEnabled
);
