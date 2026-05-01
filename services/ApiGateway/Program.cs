using System.Net.Http.Headers;
using System.Text.Json;
using ApiGateway.Data;
using ApiGateway.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Pre-warm ThreadPool to prevent starvation warnings during high-load container startups
ThreadPool.SetMinThreads(100, 100);

// ── Environment variables ───────────────────────────────────
var realmUrl            = Environment.GetEnvironmentVariable("KEYCLOAK_REALM_URL");
var tokenEndpoint       = Environment.GetEnvironmentVariable("KEYCLOAK_TOKEN_ENDPOINT");
var gatewayClientId     = Environment.GetEnvironmentVariable("KEYCLOAK_CLIENT_ID");
var gatewayClientSecret = Environment.GetEnvironmentVariable("KEYCLOAK_CLIENT_SECRET");
var workspaceServiceUrl = Environment.GetEnvironmentVariable("WORKSPACE_SERVICE_URL");
var deployServiceUrl    = Environment.GetEnvironmentVariable("DEPLOY_SERVICE_URL");
var aiServiceUrl        = Environment.GetEnvironmentVariable("AI_SERVICE_URL") ?? "http://host.docker.internal:8000";

var userDbHost     = Environment.GetEnvironmentVariable("USER_DB_HOST");
var userDbPort     = Environment.GetEnvironmentVariable("USER_DB_PORT");
var userDbName     = Environment.GetEnvironmentVariable("USER_DB_DATABASE");
var userDbUsername  = Environment.GetEnvironmentVariable("USER_DB_USERNAME");
var userDbPassword  = Environment.GetEnvironmentVariable("USER_DB_PASSWORD_LOCAL");

var connectionString =
    $"Host={userDbHost};Port={userDbPort};Database={userDbName};Username={userDbUsername};Password={userDbPassword}";

// ── Database ────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ── CORS ────────────────────────────────────────────────────
var corsOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS") ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ── JWT Authentication ──────────────────────────────────────
// STRATÉGIE JWKS MANUELLE (Docker) :
// Le backend tourne dans Docker et doit récupérer les clés JWKS
// via le réseau interne (keycloak:8080). On fetch les clés explicitement
// au démarrage et on les injecte dans IssuerSigningKeys pour éviter
// les problèmes de discovery automatique cross-hostname.
var keycloakPublicIssuer   = "http://localhost:8080/realms/maestro";
var keycloakInternalIssuer = realmUrl ?? keycloakPublicIssuer;
var jwksUri = $"{keycloakInternalIssuer}/protocol/openid-connect/certs";

// Fetch JWKS au démarrage (retry si Keycloak pas encore prêt)
Microsoft.IdentityModel.Tokens.JsonWebKeySet? jwks = null;
{
    using var httpClient = new HttpClient();
    var jwksRetries = 10;
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
            Console.WriteLine($"[JWT] JWKS fetch échoué ({jwksRetries} essais restants): {ex.Message}");
            await System.Threading.Tasks.Task.Delay(3000);
        }
    }
    if (jwks == null)
        throw new InvalidOperationException($"Impossible de récupérer les clés JWKS depuis {jwksUri}");
}

// IMPORTANT: désactive le remapping automatique des claims JWT par .NET.
// Sans ça, "sub" devient "nameidentifier", "email" disparaît, etc.
// Doit être appelé AVANT AddAuthentication.
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience     = false,
            ValidateIssuer       = true,
            ValidIssuers         = new[] { keycloakPublicIssuer, keycloakInternalIssuer },
            ValidateLifetime     = true,
            // Clés injectées directement — pas de discovery automatique
            IssuerSigningKeys    = jwks.GetSigningKeys(),
            ValidateIssuerSigningKey = true
        };
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                // This log will tell you if it's an Expired Token or an Issuer Mismatch
                Console.WriteLine($"[JWT] AUTH FAILED: {ctx.Exception.Message}");
                return System.Threading.Tasks.Task.CompletedTask;
            },
            OnTokenValidated = ctx =>
            {
                var sub = ctx.Principal?.FindFirst("sub")?.Value ?? "?";
                Console.WriteLine($"[JWT] OK - sub: {sub}");
                return System.Threading.Tasks.Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHttpClient();

// ── DI Services ─────────────────────────────────────────────
builder.Services.AddScoped<KeycloakService>();
builder.Services.AddScoped<OidcService>();
builder.Services.AddScoped<LocalUserService>();
builder.Services.AddScoped<RegisterService>();
builder.Services.AddScoped<LoginService>();
builder.Services.AddScoped<ProfileImageService>();
builder.Services.AddControllers();
builder.Services.AddProblemDetails(); // Better error formatting
builder.WebHost.UseWebRoot("wwwroot");

var app = builder.Build();

// ── Auto-migrate DB on startup ──────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var retries = 10;
    while (retries > 0)
    {
        try
        {
            db.Database.Migrate();
            app.Logger.LogInformation("✅ Database migration applied.");
            break;
        }
        catch (Exception ex)
        {
            retries--;
            app.Logger.LogWarning(ex, $"⏳ DB not ready, retrying ({retries} left)...");
            Thread.Sleep(3000);
        }
    }
}

// ── Middleware pipeline ─────────────────────────────────────
app.UseCors(); // Keep this at the top

var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadPath),
    RequestPath = ""
});
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => Results.Ok(new
{
    service = "Maestro API Gateway",
    status = "running"
}));

// ── WORKSPACE-SERVICE proxy ─────────────────────────────────
app.MapGet("/api/projects", async (HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var incomingToken = ExtractBearerToken(context);
        if (incomingToken is null) return Results.Unauthorized();

        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, $"{workspaceServiceUrl}/internal/projects");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", incomingToken);

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] Workspace Service is down: {ex.Message}");
        // On renvoie un objet d'erreur structuré pour le frontend
        return Results.Problem("Workspace Service unreachable", statusCode: 502);
    }
}).RequireAuthorization();

app.MapGet("/api/projects/{id}", async (string id, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var incomingToken = ExtractBearerToken(context);
        if (incomingToken is null) return Results.Unauthorized();

        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, $"{workspaceServiceUrl}/internal/projects/{id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", incomingToken);

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] Workspace Service is down: {ex.Message}");
        return Results.Problem("Unable to fetch project details.", statusCode: 502);
    }
}).RequireAuthorization();

app.MapDelete("/api/projects/{id}", async (string id, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var incomingToken = ExtractBearerToken(context);
        if (incomingToken is null) return Results.Unauthorized();

        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Delete, $"{workspaceServiceUrl}/internal/projects/{id}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", incomingToken);

        var response = await client.SendAsync(request);
        
        if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
            return Results.NoContent();

        return Results.StatusCode((int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] Workspace Service is down: {ex.Message}");
        return Results.Problem("Unable to delete project: Workspace Service is unreachable.", statusCode: 502);
    }
}).RequireAuthorization();

app.MapPost("/api/projects", async (HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var incomingToken = ExtractBearerToken(context);
        if (incomingToken is null) return Results.Unauthorized();

        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();

        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, workspaceServiceUrl + "/internal/projects");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", incomingToken);
        request.Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] Workspace Service is down: {ex.Message}");
        return Results.Problem("Unable to create project: Workspace Service is unreachable.", statusCode: 502);
    }
}).RequireAuthorization();

// ── AI-AGENT proxy ──────────────────────────────────────────
app.MapPost("/api/projects/{id}/ai/prompt", async (string id, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var incomingToken = ExtractBearerToken(context);
        if (incomingToken is null) return Results.Unauthorized();

        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();

        var client = httpClientFactory.CreateClient();
        // S'assurer que le path correspond à ce que FastAPI attend (souvent sans /api/ai si préfixé)
        var request = new HttpRequestMessage(HttpMethod.Post, $"{aiServiceUrl}/api/ai/prompt");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", incomingToken);
        request.Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] AI Agent failure: {ex.Message}");
        return Results.Problem("AI Service unreachable", statusCode: 502);
    }
}).RequireAuthorization();

// ── FILES proxy ─────────────────────────────────────────────
app.MapGet("/api/projects/{id}/files", async (string id, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var incomingToken = ExtractBearerToken(context);
        if (incomingToken is null) return Results.Unauthorized();

        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, $"{workspaceServiceUrl}/internal/projects/{id}/files");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", incomingToken);

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] Workspace Service is down: {ex.Message}");
        return Results.Problem("Unable to fetch project file tree.", statusCode: 502);
    }
}).RequireAuthorization();

app.MapGet("/api/projects/{id}/files/content", async (string id, string path, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var incomingToken = ExtractBearerToken(context);
        if (incomingToken is null) return Results.Unauthorized();

        var client = httpClientFactory.CreateClient();
        var encodedPath = Uri.EscapeDataString(path);
        
        var request = new HttpRequestMessage(HttpMethod.Get, $"{workspaceServiceUrl}/internal/projects/{id}/files/content?path={encodedPath}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", incomingToken);

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception)
    {
        return Results.Problem("Unable to read file content.", statusCode: 502);
    }
}).RequireAuthorization();

// ── DEPLOY-SERVICE proxy (with token exchange) ──────────────
app.MapPost("/api/deploy", async (HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    var incomingToken = ExtractBearerToken(context);
    if (incomingToken is null) return Results.Unauthorized();

    var exchangedToken = await ExchangeTokenAsync(
        httpClientFactory, tokenEndpoint!, gatewayClientId!, gatewayClientSecret!,
        incomingToken, "deploy-service");

    if (exchangedToken is null)
        return Results.BadRequest(new { message = "Echec token exchange vers deploy-service" });

    using var reader = new StreamReader(context.Request.Body);
    var body = await reader.ReadToEndAsync();

    var client = httpClientFactory.CreateClient();
    var request = new HttpRequestMessage(HttpMethod.Post, deployServiceUrl + "/internal/deploy");
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", exchangedToken);
    request.Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");

    var response = await client.SendAsync(request);
    var content = await response.Content.ReadAsStringAsync();
    return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
}).RequireAuthorization();

app.Run();

// ── Helpers ─────────────────────────────────────────────────
static string? ExtractBearerToken(HttpContext context)
{
    var authHeader = context.Request.Headers.Authorization.ToString();
    if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
        return null;
    return authHeader["Bearer ".Length..].Trim();
}

static async Task<string?> ExchangeTokenAsync(
    IHttpClientFactory httpClientFactory, string tokenEndpoint,
    string clientId, string clientSecret, string subjectToken, string audience)
{
    var client = httpClientFactory.CreateClient();
    var form = new Dictionary<string, string>
    {
        ["grant_type"]           = "urn:ietf:params:oauth:grant-type:token-exchange",
        ["client_id"]            = clientId,
        ["client_secret"]        = clientSecret,
        ["subject_token"]        = subjectToken,
        ["requested_token_type"] = "urn:ietf:params:oauth:token-type:access_token",
        ["audience"]             = audience
    };

    var response = await client.PostAsync(tokenEndpoint, new FormUrlEncodedContent(form));
    if (!response.IsSuccessStatusCode) return null;

    var json = await response.Content.ReadAsStringAsync();
    using var doc = JsonDocument.Parse(json);
    return doc.RootElement.TryGetProperty("access_token", out var at) ? at.GetString() : null;
}