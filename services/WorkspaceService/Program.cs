using Microsoft.EntityFrameworkCore;
using Maestro.WorkspaceService.Domain.Entities;
using Maestro.WorkspaceService.Infrastructure.Persistence;
using Maestro.WorkspaceService.Application.Services;
using Maestro.WorkspaceService.Application.DTOs;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration Database ──────────────────────────────────
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
builder.Services.AddDbContext<WorkspaceDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddProblemDetails();
builder.Services.AddScoped<IProjectService, ProjectService>();

var app = builder.Build();

// ── Auto-migration ──────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WorkspaceDbContext>();
    var retries = 10;
    while (retries > 0)
    {
        try
        {
            // Tente de créer les tables. Si elles existent déjà, EnsureCreated ne fera rien.
            // C'est plus sûr que creator.HasTables() qui peut être trompé par la table de migration.
            if (db.Database.EnsureCreated())
            {
                app.Logger.LogInformation("[DB] Schema created: Projects table generated.");
            }
            app.Logger.LogInformation("[DB] Database is ready.");
            break;
        }
        catch (Exception)
        {
            retries--;
            // Réduction du temps d'attente à 2s pour un démarrage plus fluide
            System.Threading.Thread.Sleep(2000);
        }
    }
}

// ── Health Check ────────────────────────────────────────────
app.MapGet("/health", () => Results.Ok("Healthy"));

// ── Internal Projects API ───────────────────────────────────
app.MapGet("/internal/projects", async (IProjectService projectService, WorkspaceDbContext db, ILogger<Program> logger) =>
{
    try
    {
        var projects = await projectService.GetAllProjectsAsync();
        return Results.Ok(projects);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erreur lors de la récupération des projets");
        return Results.Problem("Erreur interne de base de données.");
    }
});

app.MapGet("/internal/projects/{id}", async (int id, IProjectService projectService) =>
{
    var project = await projectService.GetProjectByIdAsync(id);
    return project is not null ? Results.Ok(project) : Results.NotFound();
});

app.MapPost("/internal/projects", async (CreateProjectRequest request, IProjectService projectService, ILogger<Program> logger) =>
{
    try
    {
        var created = await projectService.CreateProjectAsync(request);
        return Results.Created($"/internal/projects/{created.Id}", created);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erreur lors de la création du projet");
        return Results.Problem("Erreur lors de la création du projet.");
    }
});

app.MapDelete("/internal/projects/{id}", async (int id, IProjectService projectService) =>
{
    var deleted = await projectService.DeleteProjectAsync(id);
    return deleted ? Results.NoContent() : Results.NotFound();
});

app.Run();
public partial class Program { } // Déplacé à la fin pour permettre aux usings de rester en haut