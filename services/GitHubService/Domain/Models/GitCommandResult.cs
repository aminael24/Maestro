namespace GitHubService.Domain.Models;

public record GitCommandResult(bool Success, string Output, string Error, int ExitCode);
