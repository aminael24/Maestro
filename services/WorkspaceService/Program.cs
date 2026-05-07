using Microsoft.EntityFrameworkCore;
using Maestro.WorkspaceService.Domain.Entities;
using Maestro.WorkspaceService.Infrastructure.Persistence;
using Maestro.WorkspaceService.Application.Services;
using Maestro.WorkspaceService.Application.DTOs;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
 
var builder = WebApplication.CreateBuilder(args);
 
// ── Database ─────────────────────────────────────────────────
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
builder.Services.AddDbContext<WorkspaceDbContext>(options =>
    options.UseNpgsql(connectionString));
 
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddSingleton<IKafkaProducer, KafkaProducer>();
builder.Services.AddAuthorization();
 
// ── JWT / Keycloak ────────────────────────────────────────────
// Chargement direct des JWKS depuis l'URL interne (pas de MetadataAddress)
// car Keycloak expose son URL publique dans le metadata OpenID,
// ce qui causerait un 404 depuis le container.
var keycloakInternalIssuer = "http://keycloak:8080/realms/maestro";
var jwksUri = $"{keycloakInternalIssuer}/protocol/openid-connect/certs";
 
Microsoft.IdentityModel.Tokens.JsonWebKeySet? jwks = null;
{
    using var httpClient = new HttpClient();
    var jwksRetries = 15;
    while (jwksRetries > 0)
    {
        try
        {
            var jwksJson = await httpClient.GetStringAsync(jwksUri);
            jwks = new Microsoft.IdentityModel.Tokens.JsonWebKeySet(jwksJson);
            Console.WriteLine($"[JWT] JWKS chargé — {jwks.Keys.Count} clé(s)");
            break;
        }
        catch (Exception ex)
        {
            jwksRetries--;
            Console.WriteLine($"[JWT] JWKS fetch échoué ({jwksRetries} essais restants) : {ex.Message}");
            await Task.Delay(3000);
        }
    }
    if (jwks == null || jwks.Keys.Count == 0)
        Console.WriteLine("[JWT] ⚠️  JWKS non chargé — toutes les requêtes auth retourneront 401.");
}
 
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
 
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience         = false,
            ValidateIssuer           = false,
            ValidateLifetime         = true,
            ClockSkew                = TimeSpan.FromMinutes(5),
            ValidateIssuerSigningKey = true,
            IssuerSigningKeys        = jwks?.GetSigningKeys(),
        };
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine($"[JWT] ✗ {ctx.Request.Path} — {ctx.Exception.GetType().Name}: {ctx.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = ctx =>
            {
                var sub = ctx.Principal?.FindFirst("sub")?.Value ?? "?";
                Console.WriteLine($"[JWT] ✓ {ctx.Request.Path} — sub: {sub}");
                return Task.CompletedTask;
            },
        };
    });
 
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
 
var app = builder.Build();
 
// ── Auto-migration ────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WorkspaceDbContext>();
    var retries = 10;
    while (retries > 0)
    {
        try
        {
            if (db.Database.EnsureCreated())
                app.Logger.LogInformation("[DB] Schema créé.");
            app.Logger.LogInformation("[DB] Base de données prête.");
            break;
        }
        catch (Exception ex)
        {
            retries--;
            app.Logger.LogWarning("[DB] Pas encore prête, nouvel essai dans 2s... ({Retries} restants). {Message}", retries, ex.Message);
            System.Threading.Thread.Sleep(2000);
        }
    }
}
 
app.MapHealthChecks("/health");
app.UseAuthentication();
app.UseAuthorization();
 
// ════════════════════════════════════════════════════════════════
// PROJETS
// ════════════════════════════════════════════════════════════════
 
// GET /internal/projects — liste tous les projets de l'utilisateur
app.MapGet("/internal/projects", async (IProjectService svc, ILogger<Program> log) =>
{
    try { return Results.Ok(await svc.GetAllProjectsAsync()); }
    catch (Exception ex)
    {
        log.LogError(ex, "Erreur récupération projets");
        return Results.Problem("Erreur interne.");
    }
}).RequireAuthorization();
 
// GET /internal/projects/{id} — détail d'un projet + événement Kafka
app.MapGet("/internal/projects/{id}", async (
    int id,
    IProjectService svc,
    IKafkaProducer kafka,
    ILogger<Program> log,
    HttpContext ctx) =>
{
    var project = await svc.GetProjectByIdAsync(id);
    if (project is null) return Results.NotFound();
 
    try
    {
        var keycloakId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? ctx.User.FindFirstValue("sub")
                      ?? project.KeycloakId;
 
        await kafka.ProduceProjectOpenedAsync(new ProjectOpenedEvent(
            project.Id, project.Name, keycloakId,
            project.Type.ToString(),
            project.FrontendFramework, project.BackendFramework,
            project.Database, project.IsDockerEnabled,
            DateTime.UtcNow
        ));
    }
    catch (Exception ex)
    {
        log.LogError(ex, "[Kafka] Échec envoi événement projet {ProjectId}", id);
        // Non bloquant : on retourne quand même le projet
    }
 
    return Results.Ok(project);
}).RequireAuthorization();
 
// POST /internal/projects — crée + initialise un projet
app.MapPost("/internal/projects", async (
    CreateProjectRequest request,
    IProjectService svc,
    ILogger<Program> log,
    HttpContext ctx) =>
{
    try
    {
        var keycloakId = ctx.User.FindFirstValue("sub")
                      ?? ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
 
        if (string.IsNullOrEmpty(keycloakId))
        {
            log.LogWarning("Création projet refusée — KeycloakId manquant.");
            return Results.Unauthorized();
        }
 
        // Création en DB
        var created = await svc.CreateProjectAsync(request with { KeycloakId = keycloakId });
 
        // Initialisation du workspace sur disque : /app/projects/{keycloakId}/{projectId}/
        log.LogInformation("[WS] Initialisation workspace projet {ProjectId} ({Type})", created.Id, created.Type);
        await svc.InitializeProjectAsync(created.Id, created.Type);
 
        // On retourne la version à jour (status = active)
        var updated = await svc.GetProjectByIdAsync(created.Id);
        return Results.Created($"/internal/projects/{created.Id}", updated);
    }
    catch (Exception ex)
    {
        log.LogError(ex, "Erreur création projet");
        return Results.Problem("Erreur lors de la création du projet.");
    }
}).RequireAuthorization();
 
// DELETE /internal/projects/{id} — supprime le projet + son dossier sur disque
app.MapDelete("/internal/projects/{id}", async (int id, IProjectService svc) =>
{
    var deleted = await svc.DeleteProjectAsync(id);
    return deleted ? Results.NoContent() : Results.NotFound();
}).RequireAuthorization();
 
// ════════════════════════════════════════════════════════════════
// FICHIERS  — /app/projects/{keycloakId}/{projectId}/
// ════════════════════════════════════════════════════════════════
 
// GET /internal/projects/{id}/files — arbre de fichiers
app.MapGet("/internal/projects/{id}/files", async (int id, IProjectService svc) =>
{
    try
    {
        var tree = await svc.GetProjectFileTreeAsync(id);
        return Results.Ok(tree);
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound();
    }
}).RequireAuthorization();
 
// GET /internal/projects/{id}/files/content?path=src/App.jsx — contenu d'un fichier
app.MapGet("/internal/projects/{id}/files/content", async (
    int id,
    string path,
    IProjectService svc) =>
{
    try
    {
        var content = await svc.GetFileContentAsync(id, path);
        return content is not null
            ? Results.Ok(new { content })
            : Results.NotFound();
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound();
    }
}).RequireAuthorization();
 
// PUT /internal/projects/{id}/files/content — sauvegarde un fichier (éditeur ou IA)
app.MapPut("/internal/projects/{id}/files/content", async (
    int id,
    SaveFileRequest request,
    IProjectService svc,
    ILogger<Program> log) =>
{
    try
    {
        var saved = await svc.SaveFileContentAsync(id, request.Path, request.Content);
        return saved ? Results.Ok() : Results.BadRequest("Chemin invalide ou accès refusé.");
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound();
    }
}).RequireAuthorization();
 
app.Run();
 
// ── DTOs locaux ───────────────────────────────────────────────
public record SaveFileRequest(string Path, string Content);
public partial class Program { }