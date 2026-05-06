namespace RunnerService.Services;

public class DockerService
{
    private readonly ILogger<DockerService> _logger;
    private static int _nextBackendPort = 3001;
    private static int _nextFrontendPort = 5174;

    public DockerService(ILogger<DockerService> logger)
    {
        _logger = logger;
    }

    public async Task<(string backendUrl, string frontendUrl)> RunProjectAsync(
        string projectId,
        string sql,
        string model,
        string controller,
        string routes,
        string frontend,
        Func<string, Task> onLog,
        CancellationToken cancellationToken = default)
    {
        var projectDir = Path.Combine("/app/projects", projectId);
        Directory.CreateDirectory(projectDir);

        await onLog("📁 Dossier projet créé...");

        await File.WriteAllTextAsync(Path.Combine(projectDir, "model.js"), model);
        await File.WriteAllTextAsync(Path.Combine(projectDir, "controller.js"), controller);
        await File.WriteAllTextAsync(Path.Combine(projectDir, "routes.js"), routes);
        await File.WriteAllTextAsync(Path.Combine(projectDir, "schema.sql"), sql);

        var backendPackageJson = """
{
    "name": "maestro-backend",
    "version": "1.0.0",
    "main": "index.js",
    "dependencies": {
        "express": "^4.18.2",
        "pg": "^8.11.0",
        "cors": "^2.8.5"
    }
}
""";
        await File.WriteAllTextAsync(Path.Combine(projectDir, "package.json"), backendPackageJson);

        int backendPort = _nextBackendPort++;
        int frontendPort = _nextFrontendPort++;

        var indexJs = $"""
const express = require('express');
const cors = require('cors');
const router = require('./routes');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', router);
app.listen({backendPort}, () => console.log('Backend running on port {backendPort}'));
""";
        await File.WriteAllTextAsync(Path.Combine(projectDir, "index.js"), indexJs);

        await onLog("📝 Fichiers écrits...");

        // Lancer postgres
        await onLog("🐳 Lancement PostgreSQL...");
        await RunDockerCommand($"run -d --name postgres-{projectId} -e POSTGRES_DB=maestro_project -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin123 postgres:16", onLog, cancellationToken);

        // Attendre que Postgres soit prêt
        await onLog("⏳ Attente PostgreSQL...");
        await Task.Delay(5000, cancellationToken);

        for (int i = 0; i < 10; i++)
        {
            var check = new System.Diagnostics.Process
            {
                StartInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "docker",
                    Arguments = $"exec postgres-{projectId} pg_isready -U admin -d maestro_project",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                }
            };
            check.Start();
            await check.WaitForExitAsync(cancellationToken);
            if (check.ExitCode == 0) break;
            await Task.Delay(2000, cancellationToken);
        }

        // Copier et exécuter le schema SQL
        await RunDockerCommand($"cp {projectDir}/schema.sql postgres-{projectId}:/schema.sql", onLog, cancellationToken);
        await RunDockerCommand($"exec postgres-{projectId} psql -U admin -d maestro_project -f /schema.sql", onLog, cancellationToken);

        await onLog("🚀 Lancement du backend...");

        // Lancer un container vide d'abord
        await RunDockerCommand(
            $"run -d --name backend-{projectId} --link postgres-{projectId}:postgres-{projectId} -p {backendPort}:{backendPort} -e DB_HOST=postgres-{projectId} -e DB_PORT=5432 -e DB_NAME=maestro_project -e DB_USER=admin -e DB_PASSWORD=admin123 -w /app node:18-alpine tail -f /dev/null",
            onLog, cancellationToken);

        await Task.Delay(2000, cancellationToken);

        // Copier les fichiers dans le container
        await onLog("📦 Copie des fichiers...");
        var filesToCopy = new[] { "package.json", "index.js", "model.js", "controller.js", "routes.js" };
        foreach (var file in filesToCopy)
        {
            await RunDockerCommand(
                $"cp {projectDir}/{file} backend-{projectId}:/app/{file}",
                onLog, cancellationToken);
        }

        // Lancer npm install et node
        await onLog("⚙️ Installation des dépendances...");
        await RunDockerCommand(
            $"exec -d backend-{projectId} sh -c \"npm install && node index.js\"",
            onLog, cancellationToken);

        var backendUrl = $"http://localhost:{backendPort}";
        var frontendUrl = $"http://localhost:{frontendPort}";

        await onLog($"✅ Backend disponible sur {backendUrl}");
        await onLog($"✅ Frontend disponible sur {frontendUrl}");

        return (backendUrl, frontendUrl);
    }

    private async Task RunDockerCommand(string arguments, Func<string, Task> onLog, CancellationToken cancellationToken)
    {
        var process = new System.Diagnostics.Process
        {
            StartInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "docker",
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            }
        };

        process.Start();

        _ = Task.Run(async () =>
        {
            while (!process.StandardError.EndOfStream)
            {
                var line = await process.StandardError.ReadLineAsync();
                if (line != null) await onLog(line);
            }
        });

        await process.WaitForExitAsync(cancellationToken);
    }
}