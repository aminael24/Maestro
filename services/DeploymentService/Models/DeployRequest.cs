namespace DeploymentService.Models;

public record DeployRequest(
    string RepoUrl,       // e.g. https://github.com/user/repo
    string Branch,        // e.g. main
    string ServiceName,   // name for the Render service
    string RenderApiKey,  // user's Render API key
    string? BuildCommand, // optional, e.g. "npm run build"
    string? StartCommand  // optional, e.g. "npm start"
);

public record DeployResponse(
    string ServiceId,
    string ServiceUrl,
    string Status
);