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
        var projectDir    = Path.Combine("/app/projects", projectId);
        var frontendDir   = Path.Combine(projectDir, "frontend");
        var frontendSrcDir = Path.Combine(frontendDir, "src");

        Directory.CreateDirectory(projectDir);
        Directory.CreateDirectory(frontendSrcDir);

        await onLog("📁 Dossier projet créé...");

        // ── Fichiers backend ──────────────────────────────────────────
        await File.WriteAllTextAsync(Path.Combine(projectDir, "model.js"),      model);
        await File.WriteAllTextAsync(Path.Combine(projectDir, "controller.js"), controller);
        await File.WriteAllTextAsync(Path.Combine(projectDir, "routes.js"),     routes);
        await File.WriteAllTextAsync(Path.Combine(projectDir, "schema.sql"),    sql);

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

        int backendPort  = _nextBackendPort++;
        int frontendPort = _nextFrontendPort++;

        var indexJs = $"""
const express = require('express');
const cors    = require('cors');
const router  = require('./routes');
const app     = express();
app.use(cors());
app.use(express.json());
app.use('/api', router);
app.listen({backendPort}, () => console.log('Backend running on port {backendPort}'));
""";
        await File.WriteAllTextAsync(Path.Combine(projectDir, "index.js"), indexJs);

        // ── Fichiers frontend ─────────────────────────────────────────
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
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Maestro AI Generator</title>
  <style>
    *{ margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',sans-serif; }
    body{
      min-height:100vh; overflow-x:hidden;
      background: radial-gradient(circle at top left,#1e3a8a 0%,transparent 25%),
                  radial-gradient(circle at bottom right,#7c3aed 0%,transparent 25%), #030712;
      color:white;
    }
    body::before{
      content:""; position:fixed; inset:0;
      background: linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),
                  linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);
      background-size:40px 40px; pointer-events:none;
    }
    .maestro-shell{ max-width:1400px; margin:auto; padding:40px; position:relative; z-index:2; }
    .header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:60px; }
    .logo{ display:flex; align-items:center; gap:14px; }
    .logo-icon{
      width:48px; height:48px; border-radius:16px;
      background:linear-gradient(135deg,#3b82f6,#8b5cf6);
      display:flex; align-items:center; justify-content:center;
      font-weight:900; font-size:1.2rem; box-shadow:0 8px 25px rgba(99,102,241,0.35);
    }
    .logo-text{ font-size:1.5rem; font-weight:800; }
    .status{
      display:flex; align-items:center; gap:10px; padding:12px 18px; border-radius:999px;
      background:rgba(34,197,94,0.12); border:1px solid rgba(255,255,255,0.08);
      color:#86efac; font-weight:600; backdrop-filter:blur(12px);
    }
    .status-dot{ width:10px; height:10px; border-radius:50%; background:#22c55e; box-shadow:0 0 12px #22c55e; }
    .generated-app{
      background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
      border-radius:30px; padding:35px; backdrop-filter:blur(18px);
      box-shadow:0 8px 40px rgba(0,0,0,0.35);
    }
    .generated-title{ display:flex; align-items:center; gap:14px; margin-bottom:12px; }
    .generated-title h2{ font-size:2rem; font-weight:800; }
    .generated-badge{
      padding:8px 14px; border-radius:999px; background:rgba(59,130,246,0.12);
      color:#93c5fd; font-size:0.85rem; font-weight:700; border:1px solid rgba(255,255,255,0.08);
    }
    .generated-subtitle{ color:#94a3b8; margin-bottom:30px; line-height:1.7; }
    #root{ margin-top:25px; }
    .footer{ margin-top:60px; text-align:center; color:#64748b; font-size:0.92rem; }
  </style>
</head>
<body>
  <div class="maestro-shell">
    <section class="header">
      <div class="logo">
        <div class="logo-icon">M</div>
        <div class="logo-text">Maestro AI</div>
      </div>
      <div class="status">
        <div class="status-dot"></div>
        AI Generator Active
      </div>
    </section>
    <section class="generated-app">
      <div class="generated-title">
        <h2>Generated Application</h2>
        <div class="generated-badge">AI Generated</div>
      </div>
      <div class="generated-subtitle">
        Cette interface a été automatiquement générée par Maestro AI.
        Le contenu dynamique de l'application est injecté automatiquement via React.
      </div>
      <div id="root"></div>
    </section>
    <div class="footer">Maestro AI © 2026 — Full-Stack AI Generation Platform</div>
  </div>
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

var viteConfig =
    "import { defineConfig } from 'vite';\n" +
    "import react from '@vitejs/plugin-react';\n" +
    "export default defineConfig({\n" +
    "  plugins: [react()],\n" +
    "  server: {\n" +
    $"    host: '0.0.0.0',\n" +
    $"    port: {frontendPort},\n" +
    "  },\n" +
    "  define: {\n" +
    $"    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:{backendPort}')\n" +
    "  }\n" +
    "});\n";

        await File.WriteAllTextAsync(Path.Combine(frontendDir, "vite.config.js"), viteConfig);

        await onLog("📝 Fichiers écrits...");

        // ── PostgreSQL ────────────────────────────────────────────────
        await onLog("🐳 Lancement PostgreSQL...");
        await RunDockerCommand(
            $"run -d --name postgres-{projectId} " +
            $"-e POSTGRES_DB=maestro_project -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin123 " +
            $"postgres:16",
            onLog, cancellationToken);

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

        // ── Backend ───────────────────────────────────────────────────
        await onLog("🚀 Lancement du backend...");
        await RunDockerCommand(
            $"run -d --name backend-{projectId} " +
            $"--link postgres-{projectId}:postgres-{projectId} " +
            $"-p {backendPort}:{backendPort} " +
            $"-e DB_HOST=postgres-{projectId} -e DB_PORT=5432 -e DB_NAME=maestro_project " +
            $"-e DB_USER=admin -e DB_PASSWORD=admin123 " +
            $"-w /app node:18-alpine tail -f /dev/null",
            onLog, cancellationToken);

        await Task.Delay(2000, cancellationToken);

        await onLog("📦 Copie des fichiers backend...");
        foreach (var file in new[] { "package.json", "index.js", "model.js", "controller.js", "routes.js" })
        {
            await RunDockerCommand(
                $"cp {projectDir}/{file} backend-{projectId}:/app/{file}",
                onLog, cancellationToken);
        }

        await onLog("⚙️ Installation des dépendances backend...");
        await RunDockerCommand(
            $"exec -d backend-{projectId} sh -c \"npm install && node index.js\"",
            onLog, cancellationToken);

        // ── Frontend ──────────────────────────────────────────────────
        await onLog("🌐 Lancement du frontend...");
        await RunDockerCommand(
            $"run -d --name frontend-{projectId} " +
            $"-p {frontendPort}:{frontendPort} " +
            $"-w /app node:18-alpine tail -f /dev/null",
            onLog, cancellationToken);

        await Task.Delay(2000, cancellationToken);

        await onLog("📦 Copie des fichiers frontend...");
        await RunDockerCommand($"cp {frontendDir}/. frontend-{projectId}:/app/", onLog, cancellationToken);

        await onLog("⚙️ Installation des dépendances frontend...");
        await RunDockerCommand(
            $"exec -d frontend-{projectId} sh -c \"npm install && npm run dev\"",
            onLog, cancellationToken);

        await onLog("⏳ Attente compilation Vite...");
        await Task.Delay(15000, cancellationToken);

        var backendUrl  = $"http://localhost:{backendPort}";
        var frontendUrl = $"http://localhost:{frontendPort}";

        await onLog($"✅ Backend disponible sur {backendUrl}");
        await onLog($"✅ Frontend disponible sur {frontendUrl}");
        await onLog("✅ Projet lancé avec succès !");

        return (backendUrl, frontendUrl);
    }

    private async Task RunDockerCommand(
        string arguments,
        Func<string, Task> onLog,
        CancellationToken cancellationToken)
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