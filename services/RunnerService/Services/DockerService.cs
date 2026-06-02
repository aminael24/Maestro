namespace RunnerService.Services;

public class DockerService
{
    private readonly ILogger<DockerService> _logger;

    // Plage de ports : backend 3001-3099, frontend 5174-5272
    private static readonly SemaphoreSlim _portLock     = new(1, 1);
    private static readonly HashSet<int>   _usedBackend  = new();
    private static readonly HashSet<int>   _usedFrontend = new();

    public DockerService(ILogger<DockerService> logger)
    {
        _logger = logger;
    }

    // ── Allocation de ports libres ─────────────────────────────────────────
    private static async Task<int> AllocatePort(HashSet<int> used, int start, int end)
    {
        await _portLock.WaitAsync();
        try
        {
            for (int p = start; p <= end; p++)
            {
                if (!used.Contains(p)) { used.Add(p); return p; }
            }
            throw new InvalidOperationException($"Aucun port disponible entre {start} et {end}.");
        }
        finally { _portLock.Release(); }
    }

    private static async Task ReleasePort(HashSet<int> used, int port)
    {
        await _portLock.WaitAsync();
        try { used.Remove(port); }
        finally { _portLock.Release(); }
    }

    // ── Point d'entrée principal ───────────────────────────────────────────
    public async Task<(string backendUrl, string frontendUrl)> RunProjectAsync(
        string projectId,
        string projectType,
        string sql,
        string model,
        string controller,
        string routes,
        string frontend,
        Func<string, Task> onLog,
        CancellationToken cancellationToken = default)
    {
        var type = (projectType ?? "fullstack").ToLower();

        bool hasBackend  = type is "backend"  or "fullstack";
        bool hasFrontend = type is "frontend" or "fullstack";

        // Nettoyage préventif des conteneurs existants pour ce projectId
        await CleanupProject(projectId, hasBackend, hasFrontend, onLog, cancellationToken);

        var projectDir     = Path.Combine("/app/projects", projectId);
        var frontendDir    = Path.Combine(projectDir, "frontend");
        var frontendSrcDir = Path.Combine(frontendDir, "src");

        Directory.CreateDirectory(projectDir);
        if (hasFrontend)
            Directory.CreateDirectory(frontendSrcDir);

        await onLog("📁 Dossier projet créé...");

        // Alloue seulement les ports nécessaires
        int backendPort  = hasBackend  ? await AllocatePort(_usedBackend,  3001, 3099) : 0;
        int frontendPort = hasFrontend ? await AllocatePort(_usedFrontend, 5174, 5272) : 0;

        string backendUrl  = "";
        string frontendUrl = "";

        try
        {
            // ── Fichiers backend ───────────────────────────────────────────
            if (hasBackend)
            {
                await WriteBackendFiles(projectDir, model, controller, routes, sql, backendPort);
                await onLog("📝 Fichiers backend écrits...");
            }

            // ── Fichiers frontend ──────────────────────────────────────────
            if (hasFrontend)
            {
                var apiUrl = hasBackend
                    ? $"http://localhost:{backendPort}"
                    : "http://localhost:3001"; // backend fictif pour mode frontend seul

                await WriteFrontendFiles(frontendDir, frontendSrcDir, frontend, frontendPort, apiUrl);
                await onLog("📝 Fichiers frontend écrits...");
            }

            await onLog("📝 Tous les fichiers écrits...");

            // ── PostgreSQL + Backend Node.js ───────────────────────────────
            if (hasBackend)
            {
                backendUrl = await StartBackend(projectId, projectDir, backendPort, onLog, cancellationToken);
            }

            // ── Frontend Vite/React ────────────────────────────────────────
            if (hasFrontend)
            {
                frontendUrl = await StartFrontend(projectId, frontendDir, frontendPort, onLog, cancellationToken);
            }

            await onLog("✅ Projet lancé avec succès !");
            return (backendUrl, frontendUrl);
        }
        catch
        {
            // En cas d'erreur, libère les ports alloués
            if (hasBackend  && backendPort  > 0) await ReleasePort(_usedBackend,  backendPort);
            if (hasFrontend && frontendPort > 0) await ReleasePort(_usedFrontend, frontendPort);
            throw;
        }
    }

    // ── Nettoyage des conteneurs existants ────────────────────────────────
    private async Task CleanupProject(
        string projectId,
        bool hasBackend,
        bool hasFrontend,
        Func<string, Task> onLog,
        CancellationToken cancellationToken)
    {
        var containers = new List<string>();
        if (hasBackend)
        {
            containers.Add($"backend-{projectId}");
            containers.Add($"postgres-{projectId}");
        }
        if (hasFrontend)
            containers.Add($"frontend-{projectId}");

        foreach (var name in containers)
        {
            await RunDockerCommand($"rm -f {name}", onLog, cancellationToken);
        }
    }

    // ── Écriture des fichiers backend ─────────────────────────────────────
    private async Task WriteBackendFiles(
        string projectDir,
        string model, string controller, string routes, string sql,
        int backendPort)
    {
        await File.WriteAllTextAsync(Path.Combine(projectDir, "model.js"),      model);
        await File.WriteAllTextAsync(Path.Combine(projectDir, "controller.js"), controller);
        await File.WriteAllTextAsync(Path.Combine(projectDir, "routes.js"),     routes);
        await File.WriteAllTextAsync(Path.Combine(projectDir, "schema.sql"),    sql);

        var packageJson = """
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
        await File.WriteAllTextAsync(Path.Combine(projectDir, "package.json"), packageJson);

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
    }

    // ── Écriture des fichiers frontend ────────────────────────────────────
    private async Task WriteFrontendFiles(
        string frontendDir, string frontendSrcDir,
        string frontend,
        int frontendPort,
        string apiUrl)
    {
        await File.WriteAllTextAsync(Path.Combine(frontendSrcDir, "App.jsx"), frontend);
        await File.WriteAllTextAsync(Path.Combine(frontendSrcDir, "App.css"), "/* styles */");


var packageJson =
    "{\n" +
    "  \"name\": \"maestro-frontend\",\n" +
    "  \"version\": \"1.0.0\",\n" +
    $"  \"scripts\": {{ \"dev\": \"vite --host 0.0.0.0 --port {frontendPort}\" }},\n" +
    "  \"dependencies\": {\n" +
    "    \"react\": \"^18.2.0\",\n" +
    "    \"react-dom\": \"^18.2.0\",\n" +
    "    \"axios\": \"^1.4.0\"\n" +
    "  },\n" +
    "  \"devDependencies\": {\n" +
    "    \"vite\": \"^4.4.0\",\n" +
    "    \"@vitejs/plugin-react\": \"^4.0.0\"\n" +
    "  }\n" +
    "}";
        await File.WriteAllTextAsync(Path.Combine(frontendDir, "package.json"), packageJson);

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
            $"    'import.meta.env.VITE_API_URL': JSON.stringify('{apiUrl}')\n" +
            "  }\n" +
            "});\n";

        await File.WriteAllTextAsync(Path.Combine(frontendDir, "vite.config.js"), viteConfig);
    }

    // ── Lancement backend (Postgres + Node) ───────────────────────────────
    private async Task<string> StartBackend(
        string projectId,
        string projectDir,
        int backendPort,
        Func<string, Task> onLog,
        CancellationToken cancellationToken)
    {
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
                    FileName               = "docker",
                    Arguments              = $"exec postgres-{projectId} pg_isready -U admin -d maestro_project",
                    RedirectStandardOutput = true,
                    RedirectStandardError  = true,
                    UseShellExecute        = false,
                    CreateNoWindow         = true,
                }
            };
            check.Start();
            await check.WaitForExitAsync(cancellationToken);
            if (check.ExitCode == 0) break;
            await Task.Delay(2000, cancellationToken);
        }

        await RunDockerCommand($"cp {projectDir}/schema.sql postgres-{projectId}:/schema.sql",             onLog, cancellationToken);
        await RunDockerCommand($"exec postgres-{projectId} psql -U admin -d maestro_project -f /schema.sql", onLog, cancellationToken);

        await onLog("🚀 Lancement du backend Node.js...");
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

        var url = $"http://localhost:{backendPort}";
        await onLog($"✅ Backend disponible sur {url}");
        return url;
    }

    // ── Lancement frontend (Vite/React) ───────────────────────────────────
    private async Task<string> StartFrontend(
        string projectId,
        string frontendDir,
        int frontendPort,
        Func<string, Task> onLog,
        CancellationToken cancellationToken)
    {
        await onLog("🌐 Lancement du frontend Vite...");
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

        var url = $"http://localhost:{frontendPort}";
        await onLog($"✅ Frontend disponible sur {url}");
        return url;
    }

    // ── Exécution commande Docker ─────────────────────────────────────────
    private async Task RunDockerCommand(
        string arguments,
        Func<string, Task> onLog,
        CancellationToken cancellationToken)
    {
        var process = new System.Diagnostics.Process
        {
            StartInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName               = "docker",
                Arguments              = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError  = true,
                UseShellExecute        = false,
                CreateNoWindow         = true,
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