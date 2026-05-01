namespace Maestro.WorkspaceService.Domain.Entities;

public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public ProjectType Type { get; set; }
    public string FrontendFramework { get; set; } = string.Empty;
    public string BackendFramework { get; set; } = string.Empty;
    public string Database { get; set; } = string.Empty;
    public bool IsDockerEnabled { get; set; }
    public string Status { get; set; } = "pending";

    public string KeycloakId { get; set; } = string.Empty;
}

public enum ProjectType
{
    Fullstack,
    Frontend,
    Backend
}