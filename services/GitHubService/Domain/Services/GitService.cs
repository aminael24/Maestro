using System.Diagnostics;
using GitHubService.Domain.Models;

namespace GitHubService.Domain.Services;

public class GitService : IGitService
{
    public async Task<GitCommandResult> InitRepoAsync(string localPath)
    {
        if (string.IsNullOrWhiteSpace(localPath))
        {
            return new GitCommandResult(false, string.Empty, "localPath is required", -1);
        }

        Directory.CreateDirectory(localPath);
        return await RunGitCommandAsync(localPath, "init");
    }

    public Task<GitCommandResult> CreateBranchAsync(string localPath, string branchName)
    {
        if (string.IsNullOrWhiteSpace(branchName))
        {
            return Task.FromResult(new GitCommandResult(false, string.Empty, "branchName is required", -1));
        }

        return RunGitCommandAsync(localPath, $"checkout -b {EscapeArgument(branchName)}");
    }

    public async Task<GitCommandResult> CommitAsync(string localPath, string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return new GitCommandResult(false, string.Empty, "commit message is required", -1);
        }

        var addResult = await RunGitCommandAsync(localPath, "add .");
        if (!addResult.Success)
        {
            return addResult;
        }

        return await RunGitCommandAsync(localPath, $"commit -m {EscapeArgument(message)}");
    }

    public Task<GitCommandResult> PushAsync(string localPath, string branchName)
    {
        if (string.IsNullOrWhiteSpace(branchName))
        {
            return Task.FromResult(new GitCommandResult(false, string.Empty, "branchName is required", -1));
        }

        return RunGitCommandAsync(localPath, $"push origin {EscapeArgument(branchName)}");
    }

    public Task<GitCommandResult> FetchAsync(string localPath)
    {
        return RunGitCommandAsync(localPath, "fetch origin");
    }

    public async Task<GitStatusResult> StatusAsync(string localPath)
    {
        var branchResult = await RunGitCommandAsync(localPath, "rev-parse --abbrev-ref HEAD");
        var statusResult = await RunGitCommandAsync(localPath, "status --short --branch");

        if (!branchResult.Success || !statusResult.Success)
        {
            return new GitStatusResult(false, string.Empty, false, statusResult.Output, statusResult.Error, statusResult.ExitCode);
        }

        var output = statusResult.Output.Trim();
        var isClean = output.Contains("nothing to commit") || output.Contains("working tree clean") || string.IsNullOrWhiteSpace(output);
        return new GitStatusResult(true, branchResult.Output.Trim(), isClean, statusResult.Output, statusResult.Error, statusResult.ExitCode);
    }

    private static async Task<GitCommandResult> RunGitCommandAsync(string workingDirectory, string arguments)
    {
        if (string.IsNullOrWhiteSpace(workingDirectory))
        {
            return new GitCommandResult(false, string.Empty, "workingDirectory is required", -1);
        }

        if (!Directory.Exists(workingDirectory))
        {
            return new GitCommandResult(false, string.Empty, $"Directory not found: {workingDirectory}", -1);
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = "git",
            Arguments = arguments,
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using var process = Process.Start(startInfo);
        if (process == null)
        {
            return new GitCommandResult(false, string.Empty, "Failed to start git process", -1);
        }

        var output = await process.StandardOutput.ReadToEndAsync();
        var error = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        var success = process.ExitCode == 0;
        if (!success && error.Length == 0)
        {
            error = output;
        }

        return new GitCommandResult(success, output.TrimEnd(), error.TrimEnd(), process.ExitCode);
    }

    private static string EscapeArgument(string value)
    {
        return value.Contains(' ') || value.Contains('"')
            ? '"' + value.Replace("\"", "\\\"") + '"'
            : value;
    }
}
