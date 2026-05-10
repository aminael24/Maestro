namespace GitHubService.Domain.Models;

public record GitStatusResult(bool Success, string Branch, bool IsClean, string Output, string Error, int ExitCode);
