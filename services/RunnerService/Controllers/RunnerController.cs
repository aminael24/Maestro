using Microsoft.AspNetCore.Mvc;
using RunnerService.Models;
using RunnerService.Services;
using System.Text;

namespace RunnerService.Controllers;

[ApiController]
[Route("api/runner")]
public class RunnerController : ControllerBase
{
    private readonly DockerService _dockerService;
    private readonly ILogger<RunnerController> _logger;

    public RunnerController(DockerService dockerService, ILogger<RunnerController> logger)
    {
        _dockerService = dockerService;
        _logger = logger;
    }

    [HttpOptions("run")]
    public IActionResult PreflightRun()
    {
        Response.Headers["Access-Control-Allow-Origin"] = "*";
        Response.Headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
        Response.Headers["Access-Control-Allow-Headers"] = "Content-Type";
        return Ok();
    }

    [HttpPost("run")]
    public async Task Run([FromBody] RunRequest request, CancellationToken cancellationToken)
    {
        Response.Headers["Content-Type"] = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["Connection"] = "keep-alive";
        Response.Headers["Access-Control-Allow-Origin"] = "*";

        async Task SendLog(string message)
        {
            var data = $"data: {message}\n\n";
            var bytes = Encoding.UTF8.GetBytes(data);
            await Response.Body.WriteAsync(bytes, cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }

        try
        {
            var (backendUrl, frontendUrl) = await _dockerService.RunProjectAsync(
                request.ProjectId,
                request.Sql,
                request.Model,
                request.Controller,
                request.Routes,
                request.Frontend,
                SendLog,
                cancellationToken);

            await SendLog($"BACKEND_URL:{backendUrl}");
            await SendLog($"FRONTEND_URL:{frontendUrl}");
            await SendLog("DONE");
        }
        catch (Exception ex)
        {
            await SendLog($"ERROR:{ex.Message}");
            _logger.LogError(ex, "Erreur lors de l'exécution du projet");
        }
    }
}