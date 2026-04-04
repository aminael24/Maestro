using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration Database ──────────────────────────────────
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
builder.Services.AddDbContext<WorkspaceDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddProblemDetails();

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
app.MapGet("/internal/projects", async (WorkspaceDbContext db, ILogger<Program> logger) =>
{
    try
    {
        var projects = await db.Projects.ToListAsync();
        if (!projects.Any())
        {
            var defaults = new[] {
                new Project { Name = "App React Native", Description = "Mobile application development", DueDate = "2026-05-15", Status = "active", Type = "Frontend", FrontendFramework = "React", IsDockerEnabled = true },
                new Project { Name = "ENSA ShareHub", Description = "Collaborative school platform", DueDate = "2026-04-03", Status = "pending", Type = "Fullstack", FrontendFramework = "React", BackendFramework = "Express", Database = "PostgreSQL", IsDockerEnabled = true }
            };
            db.Projects.AddRange(defaults);
            await db.SaveChangesAsync();
            return Results.Ok(defaults);
        }
        return Results.Ok(projects);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erreur lors de la récupération des projets");
        return Results.Problem("Erreur interne de base de données.");
    }
});

app.MapGet("/internal/projects/{id}", async (int id, WorkspaceDbContext db) =>
{
    var project = await db.Projects.FindAsync(id);
    return project is not null ? Results.Ok(project) : Results.NotFound();
});

app.MapPost("/internal/projects", async (Project project, WorkspaceDbContext db, ILogger<Program> logger) =>
{
    try
    {
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return Results.Created($"/internal/projects/{project.Id}", project);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erreur lors de la création du projet");
        return Results.Problem("Erreur lors de la sauvegarde du projet.");
    }
});

app.MapDelete("/internal/projects/{id}", async (int id, WorkspaceDbContext db) =>
{
    var project = await db.Projects.FindAsync(id);
    if (project is null) return Results.NotFound();
    db.Projects.Remove(project);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();

// ── Models & Context ────────────────────────────────────────
public class Project
{
    public int Id { get; set; }
    [Required] public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string Type { get; set; } = "Fullstack"; // Frontend / Backend / Fullstack
    public string FrontendFramework { get; set; } = "React";
    public string BackendFramework { get; set; } = "Express";
    public string Database { get; set; } = "PostgreSQL";
    public bool IsDockerEnabled { get; set; } = true;
}

public class WorkspaceDbContext : DbContext
{
    public WorkspaceDbContext(DbContextOptions<WorkspaceDbContext> options) : base(options) { }
    public DbSet<Project> Projects => Set<Project>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Force explicit lowercase table naming to avoid "Relation Projects does not exist"
        modelBuilder.Entity<Project>().ToTable("projects");
        base.OnModelCreating(modelBuilder);
    }
}