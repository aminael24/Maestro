using Maestro.WorkspaceService.Application.DTOs;
using Maestro.WorkspaceService.Domain.Entities;
using Maestro.WorkspaceService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.IO;
 
namespace Maestro.WorkspaceService.Application.Services;
 
public interface IProjectService
{
    Task<IEnumerable<ProjectDto>> GetAllProjectsAsync();
    Task<ProjectDto?> GetProjectByIdAsync(int id);
    Task<ProjectDto> CreateProjectAsync(CreateProjectRequest request);
    Task<bool> DeleteProjectAsync(int id);
    Task InitializeProjectAsync(int projectId, ProjectType type);
    Task<object> GetProjectFileTreeAsync(int projectId);
    Task<string?> GetFileContentAsync(int projectId, string relativePath);
    Task<bool> SaveFileContentAsync(int projectId, string relativePath, string content);
}
 
public class ProjectService(WorkspaceDbContext db, ILogger<ProjectService> logger) : IProjectService
{
    private readonly string _basePath = Environment.GetEnvironmentVariable("PROJECTS_STORAGE_PATH") ?? "/app/projects";
 
    // ── Helpers ──────────────────────────────────────────────────────────────
 
    /// <summary>
    /// Construit le chemin racine du projet sur disque :
    ///   /app/projects/{keycloakId}/{projectId}/
    /// Garantit l'isolation entre utilisateurs.
    /// </summary>
    private string GetProjectRootPath(Project project) =>
        Path.Combine(_basePath, project.KeycloakId, project.Id.ToString());
 
    /// <summary>
    /// Récupère le projet depuis la DB, lève une exception si introuvable.
    /// Utilisé par toutes les méthodes qui ont besoin du chemin disque.
    /// </summary>
    private async Task<Project> GetProjectOrThrowAsync(int projectId)
    {
        var project = await db.Projects.FindAsync(projectId);
        if (project == null)
            throw new KeyNotFoundException($"Project {projectId} not found.");
        return project;
    }
 
    // ── CRUD Projets ──────────────────────────────────────────────────────────
 
    public async Task<IEnumerable<ProjectDto>> GetAllProjectsAsync()
    {
        var projects = await db.Projects.ToListAsync();
        return projects.Select(MapToDto).ToList();
    }
 
    public async Task<ProjectDto?> GetProjectByIdAsync(int id)
    {
        var project = await db.Projects.FindAsync(id);
        return project != null ? MapToDto(project) : null;
    }
 
    public async Task<ProjectDto> CreateProjectAsync(CreateProjectRequest request)
    {
        var project = new Project
        {
            Name             = request.Name,
            Description      = request.Description ?? string.Empty,
            DueDate          = request.DueDate ?? string.Empty,
            Type             = request.Type,
            FrontendFramework = request.FrontendFramework ?? "React",
            BackendFramework = request.BackendFramework ?? "Express",
            Database         = request.Database ?? "PostgreSQL",
            IsDockerEnabled  = request.IsDockerEnabled,
            Status           = "pending",
            KeycloakId       = request.KeycloakId
        };
 
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return MapToDto(project);
    }
 
    public async Task<bool> DeleteProjectAsync(int id)
    {
        var project = await db.Projects.FindAsync(id);
        if (project == null) return false;
 
        // Suppression du dossier physique si le projet est sur disque
        var rootPath = GetProjectRootPath(project);
        if (Directory.Exists(rootPath))
        {
            Directory.Delete(rootPath, recursive: true);
            logger.LogInformation("[Delete] Dossier supprimé : {RootPath}", rootPath);
        }
 
        db.Projects.Remove(project);
        await db.SaveChangesAsync();
        return true;
    }
 
    // ── Initialisation du workspace ───────────────────────────────────────────
 
    public async Task InitializeProjectAsync(int projectId, ProjectType type)
{
    logger.LogInformation("[Init] Démarrage initialisation projet {ProjectId} ({Type})", projectId, type);

    var project = await GetProjectOrThrowAsync(projectId);
    var rootPath = GetProjectRootPath(project);

    try
    {
        if (!Directory.Exists(rootPath))
            Directory.CreateDirectory(rootPath);

        // Structure PLATE : tous les fichiers à la racine
        await CreateFrontendTemplate(rootPath);
        await CreateBackendTemplate(rootPath);
        await CreateDbTemplate(rootPath);

        // Mise à jour du statut en DB
        project.Status = "active";
        await db.SaveChangesAsync();
        logger.LogInformation("[Init] Projet {ProjectId} initialisé avec succès. Chemin : {RootPath}", projectId, rootPath);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "[Init] Échec initialisation projet {ProjectId}", projectId);
        throw;
    }
}
 
    // ── Templates ─────────────────────────────────────────────────────────────

private async Task CreateFrontendTemplate(string path)
{
    // App.jsx à la racine
    var appJsx = @"export default function App() { 
  return <h1>Maestro Project</h1>; 
}";
    
    await File.WriteAllTextAsync(
        Path.Combine(path, "App.jsx"),
        appJsx
    );
}

private async Task CreateBackendTemplate(string path)
{
    // model.js à la racine
    await File.WriteAllTextAsync(
        Path.Combine(path, "model.js"),
        "// Model will be generated by AI"
    );
    
    // controller.js à la racine
    await File.WriteAllTextAsync(
        Path.Combine(path, "controller.js"),
        "// Controller will be generated by AI"
    );
    
    // routes.js à la racine
    await File.WriteAllTextAsync(
        Path.Combine(path, "routes.js"),
        "// Routes will be generated by AI"
    );
}

private async Task CreateDbTemplate(string path)
{
    // schema.sql à la racine
    await File.WriteAllTextAsync(
        Path.Combine(path, "schema.sql"),
        "-- SQL schema will be generated by AI"
    );
}
 
    // ── Fichiers ──────────────────────────────────────────────────────────────
 
    /// <summary>
    /// Retourne l'arbre de fichiers du projet (sans le dossier .git).
    /// Renvoie une Task pour garder une interface async cohérente.
    /// </summary>
    public async Task<object> GetProjectFileTreeAsync(int projectId)
    {
        var project = await GetProjectOrThrowAsync(projectId);
        var rootPath = GetProjectRootPath(project);
 
        if (!Directory.Exists(rootPath))
            return new { error = "Project workspace not found on disk" };
 
        return ScanDirectory(rootPath);
    }
 
    private object ScanDirectory(string path)
    {
        var info = new DirectoryInfo(path);
        return new
        {
            name = info.Name,
            type = "directory",
            children = info.GetFileSystemInfos()
                .Where(f => f.Name != ".git")
                .OrderBy(f => f is FileInfo ? 1 : 0) // dossiers en premier
                .ThenBy(f => f.Name)
                .Select(f => f is DirectoryInfo d
                    ? ScanDirectory(d.FullName)
                    : (object)new { name = f.Name, type = "file" })
        };
    }
 
    public async Task<string?> GetFileContentAsync(int projectId, string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return null;
 
        var project = await GetProjectOrThrowAsync(projectId);
        var rootPath = GetProjectRootPath(project) + Path.DirectorySeparatorChar;
 
        var normalizedPath = relativePath.Replace('\\', '/').TrimStart('/');
        var fullPath = Path.GetFullPath(Path.Combine(rootPath, normalizedPath));
 
        // Sécurité : interdire les path traversal (../../etc)
        if (!fullPath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning("[Security] Path traversal bloqué — projet {ProjectId} : {FullPath}", projectId, fullPath);
            return null;
        }
 
        if (!File.Exists(fullPath))
        {
            logger.LogWarning("[Files] Fichier introuvable : {FullPath}", fullPath);
            return null;
        }
 
        logger.LogInformation("[Files] Lecture : {FullPath}", fullPath);
        return await File.ReadAllTextAsync(fullPath);
    }
 
    public async Task<bool> SaveFileContentAsync(int projectId, string relativePath, string content)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return false;
 
        var project = await GetProjectOrThrowAsync(projectId);
        var rootPath = GetProjectRootPath(project) + Path.DirectorySeparatorChar;
 
        var normalizedPath = relativePath.Replace('\\', '/').TrimStart('/');
        var fullPath = Path.GetFullPath(Path.Combine(rootPath, normalizedPath));
 
        // Sécurité : interdire les path traversal
        if (!fullPath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning("[Security] Path traversal bloqué (écriture) — projet {ProjectId} : {FullPath}", projectId, fullPath);
            return false;
        }
 
        // Crée les sous-dossiers si nécessaire (ex: src/components/Button.jsx)
        var directory = Path.GetDirectoryName(fullPath);
        if (directory != null && !Directory.Exists(directory))
            Directory.CreateDirectory(directory);
 
        await File.WriteAllTextAsync(fullPath, content);
        logger.LogInformation("[Files] Sauvegardé : {FullPath}", fullPath);
        return true;
    }
 
    // ── Mapper ────────────────────────────────────────────────────────────────
 
    private static ProjectDto MapToDto(Project p) => new(
        p.Id, p.Name, p.Description, p.DueDate, p.Status,
        p.Type, p.FrontendFramework, p.BackendFramework,
        p.Database, p.IsDockerEnabled, p.KeycloakId
    );
}
 