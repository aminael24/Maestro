using System.Net.Http.Headers;
using System.Text;
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
var gitHubServiceUrl = Environment.GetEnvironmentVariable("GITHUB_SERVICE_URL") ?? "http://github-service:8080";

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

// IMPORTANT : on NE peut PAS utiliser MetadataAddress pour pointer
// JwtBearer sur l'URL interne, parce que Keycloak met sa propre URL
// PUBLIQUE (KC_HOSTNAME=localhost) dans le metadata OpenID. Du coup
// JwtBearer télécharge le metadata, y voit "jwks_uri =
// http://localhost:8080/..." et tente de fetch les clés sur localhost
// — qui depuis le container du gateway pointe sur lui-même → 404.
//
// On charge donc les clés JWKS DIRECTEMENT depuis l'URL interne
// avec un retry qui ne bloque pas si Keycloak n'est pas prêt.
var jwksUri = $"{keycloakInternalIssuer}/protocol/openid-connect/certs";

Microsoft.IdentityModel.Tokens.JsonWebKeySet? jwks = null;

// Permet aux tests d'intégration (WebApplicationFactory) de bypass le
// fetch JWKS qui boucle 15× et fait timeout en CI. Quand SKIP_JWKS_FETCH=1
// on n'essaie même pas — toute requête authentifiée ressortira en 401, ce
// qui est exactement ce que veulent les tests sur endpoints publics.
var skipJwksFetch = Environment.GetEnvironmentVariable("SKIP_JWKS_FETCH") == "1";
if (!skipJwksFetch)
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
            await System.Threading.Tasks.Task.Delay(3000);
        }
    }
    if (jwks == null || jwks.Keys.Count == 0)
    {
        Console.WriteLine($"[JWT] ⚠️  JWKS n'a PAS pu être chargé depuis {jwksUri}. Toutes les requêtes auth vont échouer en 401.");
    }
}
else
{
    Console.WriteLine("[JWT] SKIP_JWKS_FETCH=1 → JWKS skipped (test mode).");
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
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine($"[JWT] AUTH FAILED on {ctx.Request.Path}: {ctx.Exception.GetType().Name}: {ctx.Exception.Message}");
                return System.Threading.Tasks.Task.CompletedTask;
            },
            OnTokenValidated = ctx =>
            {
                var sub = ctx.Principal?.FindFirst("sub")?.Value ?? "?";
                Console.WriteLine($"[JWT] OK - sub: {sub} on {ctx.Request.Path}");
                return System.Threading.Tasks.Task.CompletedTask;
            },
            OnChallenge = ctx =>
            {
                Console.WriteLine($"[JWT] 401 challenge on {ctx.Request.Path} (error='{ctx.Error}', desc='{ctx.ErrorDescription}')");
                return System.Threading.Tasks.Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHttpClient();

// ── DI Services ─────────────────────────────────────────────
builder.Services.AddScoped<KeycloakService>();
builder.Services.AddScoped<OidcService>();
builder.Services.AddScoped<LocalUserService>();
builder.Services.AddScoped<RegisterService>();
builder.Services.AddSingleton<ApiGateway.Services.KafkaProducer>();
builder.Services.AddScoped<LoginService>();
builder.Services.AddScoped<ProfileImageService>();
builder.Services.AddScoped<PasswordResetService>();
builder.Services.AddControllers();
builder.Services.AddProblemDetails(); // Better error formatting
if (Environment.GetEnvironmentVariable("SKIP_JWKS_FETCH") != "1")
{
    builder.WebHost.UseWebRoot("wwwroot");
}
var app = builder.Build();

// ── Auto-migrate DB on startup ──────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // EF InMemory ne supporte pas Migrate() (utilisé par les tests
    // d'intégration via WebApplicationFactory). On le détecte et on
    // utilise EnsureCreated à la place — pour tous les autres providers
    // (Npgsql en prod), le comportement reste identique avec Migrate().
    if (db.Database.ProviderName?.Contains("InMemory", StringComparison.OrdinalIgnoreCase) == true)
    {
        db.Database.EnsureCreated();
        app.Logger.LogInformation("✅ InMemory DB ensured (test mode).");
    }
    else
    {
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

// Bridge: turn the maestro_access_token cookie into an Authorization
// header BEFORE JwtBearer authentication runs. This is what makes the
// frontend's "no localStorage, only cookies" flow work — the SPA never
// sends a Bearer header but every protected endpoint still sees one.
// ── No-store cache middleware ───────────────────────────────
//
// Empêche le navigateur de servir une réponse mise en cache après
// déconnexion (notamment via le bouton "Retour" du navigateur).
// Posé sur /auth/* et /api/* — les pages publiques restent
// cacheables normalement.
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? "";
    if (path.StartsWith("/auth", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWith("/api",  StringComparison.OrdinalIgnoreCase))
    {
        context.Response.OnStarting(() =>
        {
            context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
            context.Response.Headers["Pragma"]        = "no-cache";
            context.Response.Headers["Expires"]       = "0";
            return Task.CompletedTask;
        });
    }
    await next();
});

app.UseMiddleware<ApiGateway.Services.CookieToBearerMiddleware>();

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







// ── RAILWAY OAuth ───────────────────────────────────────────
app.MapGet("/api/railway/auth-url", (HttpContext context) =>
{
    var clientId = Environment.GetEnvironmentVariable("RAILWAY_CLIENT_ID");
    var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
    var redirectUri = $"{frontendUrl}/railway/callback";
    var state = Guid.NewGuid().ToString();
    var url = $"https://backboard.railway.com/oauth/auth" +
          $"?client_id={clientId}" +
          $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
          $"&response_type=code" +
          $"&scope=openid%20email%20profile%20project%3Awrite%20offline_access" +
          $"&prompt=consent" +
          $"&state={state}";
    return Results.Ok(new { authUrl = url, state });
}).RequireAuthorization();

app.MapPost("/api/railway/token", async (HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
    using var bodyDoc = JsonDocument.Parse(body);
    var code = bodyDoc.RootElement.GetProperty("code").GetString();
    var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
    var redirectUri = $"{frontendUrl}/railway/callback";

    var clientId     = Environment.GetEnvironmentVariable("RAILWAY_CLIENT_ID") ?? "";
    var clientSecret = Environment.GetEnvironmentVariable("RAILWAY_CLIENT_SECRET") ?? "";

    var client = httpClientFactory.CreateClient();
    var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

    var form = new Dictionary<string, string>
    {
        ["grant_type"]   = "authorization_code",
        ["code"]         = code ?? "",
        ["redirect_uri"] = redirectUri,
    };

    var resp = await client.PostAsync("https://backboard.railway.com/oauth/token", new FormUrlEncodedContent(form));
    var json = await resp.Content.ReadAsStringAsync();
    return Results.Content(json, "application/json", statusCode: (int)resp.StatusCode);
}).RequireAuthorization();
// ── DEPLOY proxy ────────────────────────────────────────────
app.MapPost("/api/deploy/railway", async (HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    var incomingToken = ExtractBearerToken(context);
    if (incomingToken is null) return Results.Unauthorized();

    using var reader = new StreamReader(context.Request.Body);
    var body = await reader.ReadToEndAsync();

    var client = httpClientFactory.CreateClient();
    var request = new HttpRequestMessage(HttpMethod.Post, deployServiceUrl + "/internal/deploy");
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", incomingToken);
    request.Content = new StringContent(body, Encoding.UTF8, "application/json");

    var response = await client.SendAsync(request);
    var content = await response.Content.ReadAsStringAsync();
    return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
}).RequireAuthorization();

app.MapGet("/api/deploy/railway/{serviceId}/status", async (string serviceId, string railwayToken, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    var incomingToken = ExtractBearerToken(context);
    if (incomingToken is null) return Results.Unauthorized();

    var client = httpClientFactory.CreateClient();
    var request = new HttpRequestMessage(HttpMethod.Get,
        $"{deployServiceUrl}/internal/deploy/{serviceId}/status?railwayToken={Uri.EscapeDataString(railwayToken)}");
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", incomingToken);

    var response = await client.SendAsync(request);
    var content = await response.Content.ReadAsStringAsync();
    return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
}).RequireAuthorization();







// ── GITHUB SERVICE proxy ─────────────────────────────────
app.MapGet("/api/github/providers", async (HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, $"{gitHubServiceUrl}/api/providers");

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] GitHub Service is down: {ex.Message}");
        return Results.Problem("GitHub Service unreachable", statusCode: 502);
    }
}).RequireAuthorization();

app.MapGet("/api/github/providers/{provider}/auth-url", async (string provider, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var client = httpClientFactory.CreateClient();
        var target = $"{gitHubServiceUrl}/api/providers/{provider}/auth-url" + context.Request.QueryString;
        var request = new HttpRequestMessage(HttpMethod.Get, target);

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] GitHub Service is down: {ex.Message}");
        return Results.Problem("GitHub Service unreachable", statusCode: 502);
    }
}).RequireAuthorization();

app.MapPost("/api/github/providers/{provider}/token", async (string provider, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, $"{gitHubServiceUrl}/api/providers/{provider}/token")
        {
            Content = new StringContent(body, Encoding.UTF8, context.Request.ContentType ?? "application/json")
        };

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] GitHub Service is down: {ex.Message}");
        return Results.Problem("GitHub Service unreachable", statusCode: 502);
    }
}).RequireAuthorization();

app.MapPost("/api/github/providers/{provider}/repositories", async (string provider, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, $"{gitHubServiceUrl}/api/providers/{provider}/repositories")
        {
            Content = new StringContent(body, Encoding.UTF8, context.Request.ContentType ?? "application/json")
        };

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] GitHub Service is down: {ex.Message}");
        return Results.Problem("GitHub Service unreachable", statusCode: 502);
    }
}).RequireAuthorization();

app.MapGet("/api/github/providers/{provider}/repositories/{owner}/{repoName}", async (string provider, string owner, string repoName, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var client = httpClientFactory.CreateClient();
        var target = $"{gitHubServiceUrl}/api/providers/{provider}/repositories/{Uri.EscapeDataString(owner)}/{Uri.EscapeDataString(repoName)}" + context.Request.QueryString;
        var request = new HttpRequestMessage(HttpMethod.Get, target);

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] GitHub Service is down: {ex.Message}");
        return Results.Problem("GitHub Service unreachable", statusCode: 502);
    }
}).RequireAuthorization();

app.MapGet("/api/github/repositories", async (HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, $"{gitHubServiceUrl}/api/repositories");

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] GitHub Service is down: {ex.Message}");
        return Results.Problem("GitHub Service unreachable", statusCode: 502);
    }
}).RequireAuthorization();

app.MapGet("/api/github/repositories/{projectId}", async (string projectId, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, $"{gitHubServiceUrl}/api/repositories/{projectId}");

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] GitHub Service is down: {ex.Message}");
        return Results.Problem("GitHub Service unreachable", statusCode: 502);
    }
}).RequireAuthorization();

app.MapPost("/api/github/repositories", async (HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, $"{gitHubServiceUrl}/api/repositories")
        {
            Content = new StringContent(body, Encoding.UTF8, context.Request.ContentType ?? "application/json")
        };

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] GitHub Service is down: {ex.Message}");
        return Results.Problem("GitHub Service unreachable", statusCode: 502);
    }
}).RequireAuthorization();

app.MapPut("/api/projects/{id}/files/content", async (string id, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var incomingToken = ExtractBearerToken(context);
        if (incomingToken is null) return Results.Unauthorized();
 
        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();
 
        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Put, $"{workspaceServiceUrl}/internal/projects/{id}/files/content");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", incomingToken);
        request.Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");
 
        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PROXY ERROR] Workspace Service is down: {ex.Message}");
        return Results.Problem("Unable to save file content.", statusCode: 502);
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

// Expose Program comme classe partielle publique pour permettre aux tests
// d'intégration (WebApplicationFactory<Program>) de la référencer. Les
// top-level statements génèrent une classe internal par défaut.
public partial class Program { }