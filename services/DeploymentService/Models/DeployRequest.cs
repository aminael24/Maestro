namespace DeploymentService.Models;

public record DeployRequest(
    string RepoUrl,
    string Branch,
    string ServiceName,
    string RailwayToken,   // was RenderApiKey
    string? BuildCommand,
    string? StartCommand,
        string UserId              // for Kafka notification

);

public record DeployResponse(
    string ServiceId,
    string ServiceUrl,
    string Status
);
public record DeployStatusResponse(
    string Status,
    string? Url
);