using System.ComponentModel.DataAnnotations;

namespace Maestro.WorkspaceService.Domain.Entities;

public enum ProjectType
{
    Frontend,
    Backend,
    Fullstack
}

public class Project
{
    public int Id { get; set; }
    [Required] 
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public ProjectType Type { get; set; } = ProjectType.Fullstack;
    public string FrontendFramework { get; set; } = "React";
    public string BackendFramework { get; set; } = "Express";
    public string Database { get; set; } = "PostgreSQL";
    public bool IsDockerEnabled { get; set; } = true;
}