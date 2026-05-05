using Microsoft.EntityFrameworkCore;
using Maestro.WorkspaceService.Domain.Entities;
using Maestro.WorkspaceService.Infrastructure.Persistence;
using Maestro.WorkspaceService.Application.Services;
using Maestro.WorkspaceService.Application.DTOs;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims; // Ajouté pour HttpContext.User.FindFirstValue

var builder = WebApplication.CreateBuilder(args);

// ── Configuration Database ──────────────────────────────────
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
builder.Services.AddDbContext<WorkspaceDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddSingleton<IKafkaProducer, KafkaProducer>();
builder.Services.AddAuthorization();

// ── Configuration Authentification (JWKS direct, pas metadata) ──
//
// On NE peut PAS utiliser MetadataAddress pour pointer JwtBearer
// sur l'URL interne, parce que Keycloak met sa propre URL PUBLIQUE
// (KC_HOSTNAME=localhost) dans le metadata OpenID. Du coup
// JwtBearer télécharge le metadata, y voit "jwks_uri =
// http://localhost:8080/..." et tente de fetch les clés sur
// localhost — qui depuis le container pointe sur lui-même → 404.
//
// On charge donc les clés JWKS DIRECTEMENT depuis l'URL interne
// avec un retry au boot.
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
            Console.WriteLine($"[JWT] JWKS chargé depuis {jwksUri} ({jwks.Keys.Count} clé(s))");
            break;
        }
        catch (Exception ex)
        {
            jwksRetries--;
            Console.WriteLine($"[JWT] JWKS fetch échoué ({jwksRetries} essais restants) sur {jwksUri}: {ex.Message}");
            await Task.Delay(3000);
        }
    }
    if (jwks == null || jwks.Keys.Count == 0)
    {
        Console.WriteLine($"[JWT] ⚠️  JWKS n'a PAS pu être chargé depuis {jwksUri}. Toutes les requêtes auth vont échouer en 401.");
    }
}

// IMPORTANT: Désactive le remapping automatique des claims (pour garder "sub")
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;

        // PAS de MetadataAddress — voir explication ci-dessus. On
        // fournit les clés directement.

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
            OnAuthenticationFailed = context => {
                Console.WriteLine($"[JWT] Échec validation sur {context.Request.Path}: {context.Exception.GetType().Name}: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context => {
                var sub = context.Principal?.FindFirst("sub")?.Value ?? "?";
                Console.WriteLine($"[JWT] OK sur {context.Request.Path} - sub: {sub}");
                return Task.CompletedTask;
            },
            OnChallenge = context => {
                Console.WriteLine($"[JWT] 401 challenge sur {context.Request.Path} (error='{context.Error}', desc='{context.ErrorDescription}')");
                return Task.CompletedTask;
            },
        };
    });

builder.Services.ConfigureHttpJsonOptions(options => {
    // Permet de recevoir/envoyer les enums en string (ex: "Frontend") au lieu de 0, 1, 2
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

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
            // Supprime la base de données si elle existe. Utile en dev pour un schéma propre.
            // ATTENTION: Ceci efface toutes les données à chaque démarrage.
            // db.Database.EnsureDeleted(); // Désactivé pour conserver les données au redémarrage

            // Tente de créer les tables. Si elles existent déjà, EnsureCreated ne fera rien.
            // C'est plus sûr que creator.HasTables() qui peut être trompé par la table de migration.
            if (db.Database.EnsureCreated())
            {
                app.Logger.LogInformation("[DB] Schema created: Projects table generated.");
            }
            app.Logger.LogInformation("[DB] Database is ready.");
            break;
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning("[DB] Database not ready yet, retrying in 2s... ({Retries} attempts left). Error: {Message}", retries, ex.Message);
            retries--;
            // Réduction du temps d'attente à 2s pour un démarrage plus fluide
            System.Threading.Thread.Sleep(2000);
        }
    }
}

// ── Health Check ────────────────────────────────────────────
app.MapHealthChecks("/health");

app.UseAuthentication();
app.UseAuthorization();

// ── Internal Projects API ───────────────────────────────────
app.MapGet("/internal/projects", async (IProjectService projectService, ILogger<Program> logger) =>
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
}).RequireAuthorization();

app.MapGet("/internal/projects/{id}", async (int id, IProjectService projectService, IKafkaProducer kafkaProducer, ILogger<Program> logger, HttpContext httpContext) =>
{
    var project = await projectService.GetProjectByIdAsync(id);
    if (project is null) return Results.NotFound();

    try
    {
        // Lorsque l'utilisateur récupère le projet (clic), on produit un événement Kafka
        // pour que le service IDE sache quel environnement préparer.
        var keycloakId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) 
                         ?? httpContext.User.FindFirstValue("sub") 
                         ?? project.KeycloakId;

        var openEvent = new ProjectOpenedEvent(
            project.Id,
            project.Name,
            keycloakId,
            project.Type.ToString(),
            project.FrontendFramework,
            project.BackendFramework,
            project.Database,
            project.IsDockerEnabled,
            DateTime.UtcNow
        );

        await kafkaProducer.ProduceProjectOpenedAsync(openEvent);
        logger.LogInformation("[Kafka] Événement ProjectOpened envoyé pour le projet {ProjectId}", id);
    }
    catch (Exception ex)
    {
        // On ne bloque pas l'accès au projet si Kafka échoue, mais on log l'erreur
        logger.LogError(ex, "Erreur lors de l'envoi Kafka pour le projet {ProjectId}", id);
    }

    return Results.Ok(project);
}).RequireAuthorization();

app.MapPost("/internal/projects", async (CreateProjectRequest request, IProjectService projectService, ILogger<Program> logger, HttpContext httpContext) =>
{
    try
    {
        // Extraire le KeycloakId des claims de l'utilisateur authentifié
        var keycloakId = httpContext.User.FindFirstValue("sub") 
                         ?? httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(keycloakId))
        {
            logger.LogWarning("Tentative de création de projet sans KeycloakId pour l'utilisateur.");
            return Results.Unauthorized(); // Ou Results.BadRequest si KeycloakId est obligatoire
        }

        // Créer un nouvel objet request avec le KeycloakId
        var requestWithKeycloakId = request with { KeycloakId = keycloakId };
        var created = await projectService.CreateProjectAsync(requestWithKeycloakId);

        // ── Initialisation automatique ────────────────────────
        // On prépare l'environnement de travail (IDE) pour le projet en fonction de son type.
        // Note : Ajoutez 'Task InitializeProjectAsync(int projectId, ProjectType projectType)' à IProjectService.
        logger.LogInformation("[WS] Initializing workspace environment for project {ProjectId} of type {ProjectType}...", created.Id, created.Type);
        await projectService.InitializeProjectAsync(created.Id, created.Type);

        // Récupérer la version à jour du projet (avec le statut 'active') pour la réponse
        var updatedProject = await projectService.GetProjectByIdAsync(created.Id);

        return Results.Created($"/internal/projects/{created.Id}", updatedProject);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erreur lors de la création du projet");
        return Results.Problem("Erreur lors de la création du projet.");
    }
}).RequireAuthorization();

app.MapDelete("/internal/projects/{id}", async (int id, IProjectService projectService) =>
{
    var deleted = await projectService.DeleteProjectAsync(id);
    return deleted ? Results.NoContent() : Results.NotFound();
}).RequireAuthorization();

app.MapGet("/internal/projects/{id}/files", (int id, IProjectService projectService) =>
{
    var tree = projectService.GetProjectFileTree(id);
    return Results.Ok(tree);
});

app.MapGet("/internal/projects/{id}/files/content", async (int id, string path, IProjectService projectService) =>
{
    var content = await projectService.GetFileContentAsync(id, path);
    return content is not null ? Results.Ok(new { content }) : Results.NotFound();
});

app.Run();
public partial class Program { } // Déplacé à la fin pour permettre aux usings de rester en haut