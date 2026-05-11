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
        var frontendDir = Path.Combine(projectDir, "frontend");
        var frontendSrcDir = Path.Combine(frontendDir, "src");

        Directory.CreateDirectory(projectDir);
        Directory.CreateDirectory(frontendSrcDir);

        await onLog("📁 Dossier projet créé...");

        // Fichiers backend
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

        // Fichiers frontend
        await File.WriteAllTextAsync(Path.Combine(frontendSrcDir, "App.jsx"), frontend);

   var frontendPackageJson = """
{
    "name": "maestro-frontend",
    "version": "1.0.0",
    "scripts": { "dev": "vite --host 0.0.0.0 --port FRONTEND_PORT" },
    "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "axios": "^1.4.0"
    },
    "devDependencies": {
        "vite": "^4.4.0",
        "@vitejs/plugin-react": "^4.0.0"
    }
}
""".Replace("FRONTEND_PORT", frontendPort.ToString());
        await File.WriteAllTextAsync(Path.Combine(frontendDir, "package.json"), frontendPackageJson);

var indexHtml = """
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Maestro App</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
      body { background: #f0f4f8; color: #1a202c; }
      #root { max-width: 1200px; margin: 0 auto; padding: 2rem; }
      h1, h2 { color: #2d3748; margin-bottom: 1.5rem; }
      h1 { font-size: 2rem; border-bottom: 3px solid #4299e1; padding-bottom: 0.5rem; }
      h2 { font-size: 1.3rem; color: #4a5568; }
      form { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); margin-bottom: 2rem; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
      input { padding: 0.6rem 1rem; border: 1.5px solid #cbd5e0; border-radius: 8px; font-size: 0.9rem; outline: none; transition: border 0.2s; min-width: 140px; }
      input:focus { border-color: #4299e1; }
      button { padding: 0.6rem 1.4rem; background: #4299e1; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.2s; }
      button:hover { background: #2b6cb0; }
      button.delete { background: #fc8181; }
      button.delete:hover { background: #e53e3e; }
      button.edit { background: #68d391; color: #1a202c; margin-right: 0.4rem; }
      button.edit:hover { background: #38a169; color: white; }
      table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }
      th { background: #4299e1; color: white; padding: 0.9rem 1rem; text-align: left; font-weight: 600; }
      td { padding: 0.8rem 1rem; border-bottom: 1px solid #e2e8f0; }
      tr:hover td { background: #ebf8ff; }
      tr:last-child td { border-bottom: none; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
""";
        await File.WriteAllTextAsync(Path.Combine(frontendDir, "index.html"), indexHtml);

        var mainJsx = """
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
""";
        await File.WriteAllTextAsync(Path.Combine(frontendSrcDir, "main.jsx"), mainJsx);

        var viteConfig = """
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
""";
        await File.WriteAllTextAsync(Path.Combine(frontendDir, "vite.config.js"), viteConfig);

        await onLog("📝 Fichiers écrits...");

        // Lancer postgres
        await onLog("🐳 Lancement PostgreSQL...");
        await RunDockerCommand($"run -d --name postgres-{projectId} -e POSTGRES_DB=maestro_project -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin123 postgres:16", onLog, cancellationToken);

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

        await RunDockerCommand($"cp {projectDir}/schema.sql postgres-{projectId}:/schema.sql", onLog, cancellationToken);
        await RunDockerCommand($"exec postgres-{projectId} psql -U admin -d maestro_project -f /schema.sql", onLog, cancellationToken);

        // Lancer backend
        await onLog("🚀 Lancement du backend...");
        await RunDockerCommand(
            $"run -d --name backend-{projectId} --link postgres-{projectId}:postgres-{projectId} -p {backendPort}:{backendPort} -e DB_HOST=postgres-{projectId} -e DB_PORT=5432 -e DB_NAME=maestro_project -e DB_USER=admin -e DB_PASSWORD=admin123 -w /app node:18-alpine tail -f /dev/null",
            onLog, cancellationToken);

        await Task.Delay(2000, cancellationToken);

        await onLog("📦 Copie des fichiers backend...");
        var filesToCopy = new[] { "package.json", "index.js", "model.js", "controller.js", "routes.js" };
        foreach (var file in filesToCopy)
        {
            await RunDockerCommand(
                $"cp {projectDir}/{file} backend-{projectId}:/app/{file}",
                onLog, cancellationToken);
        }

        await onLog("⚙️ Installation des dépendances backend...");
        await RunDockerCommand(
            $"exec -d backend-{projectId} sh -c \"npm install && node index.js\"",
            onLog, cancellationToken);

        // Lancer frontend
        await onLog("🌐 Lancement du frontend...");
        await RunDockerCommand(
            $"run -d --name frontend-{projectId} -p {frontendPort}:{frontendPort} -e VITE_API_URL=http://localhost:{backendPort} -w /app node:18-alpine tail -f /dev/null",
            onLog, cancellationToken);

        await Task.Delay(2000, cancellationToken);

        await onLog("📦 Copie des fichiers frontend...");
        await RunDockerCommand($"cp {frontendDir}/. frontend-{projectId}:/app/", onLog, cancellationToken);

        await onLog("⚙️ Installation des dépendances frontend...");
        await RunDockerCommand(
            $"exec -d frontend-{projectId} sh -c \"npm install && npm run dev\"",
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