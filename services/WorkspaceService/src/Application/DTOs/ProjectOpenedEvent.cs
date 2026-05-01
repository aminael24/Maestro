namespace Maestro.WorkspaceService.Application.DTOs;

public record ProjectOpenedEvent(
    int ProjectId,
    string Name,
    string KeycloakId,
    string ProjectType,
    string FrontendFramework,
    string BackendFramework,
    string Database,
    bool IsDockerEnabled,
    DateTime Timestamp
);