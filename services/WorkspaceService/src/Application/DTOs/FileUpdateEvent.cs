namespace Maestro.WorkspaceService.Application.DTOs;

public record FileUpdateEvent(int ProjectId, string Path, string Content);