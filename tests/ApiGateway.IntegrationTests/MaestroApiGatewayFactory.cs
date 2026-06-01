using ApiGateway.Data;
using ApiGateway.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http;

namespace ApiGateway.IntegrationTests;

/// <summary>
/// Factory custom pour les tests d'intégration.
///
/// Difficultés :
///   1. Program.cs lit des variables d'environnement obligatoires (KEYCLOAK_*,
///      USER_DB_*). On les définit toutes avant que la factory ne construise
///      le host, sinon le startup throw.
///   2. Program.cs fetch les clés JWKS au démarrage via un HttpClient direct
///      (pas IHttpClientFactory). C'est en retry boucle 15× avec un sleep de
///      3s à chaque fois → en test, on accepte de laisser ce fetch échouer
///      silencieusement, le startup continue, et les endpoints non protégés
///      par [Authorize] (Register, ForgotPassword, Login, Callback) sont
///      testables.
///   3. EF auto-migration : on remplace Postgres par InMemory et on
///      désactive Database.Migrate (qui ne marche pas avec InMemory). On
///      EnsureCreated à la place.
/// </summary>
public class MaestroApiGatewayFactory : WebApplicationFactory<Program>
{
    public const string TestRealmUrl =
        "http://localhost:18080/realms/maestro";
    public const string TestTokenEndpoint =
        "http://localhost:18080/realms/maestro/protocol/openid-connect/token";
    public const string TestClientId = "maestro-api-gateway-test";

    public MaestroApiGatewayFactory()
    {
        // Toutes les variables d'env utilisées par Program.cs au boot.
        // On set AVANT d'appeler la base — sinon Program.cs RequireEnv()
        // throw une InvalidOperationException.
        Environment.SetEnvironmentVariable("KEYCLOAK_REALM_URL", TestRealmUrl);
        Environment.SetEnvironmentVariable("KEYCLOAK_TOKEN_ENDPOINT", TestTokenEndpoint);
        Environment.SetEnvironmentVariable("KEYCLOAK_CLIENT_ID", TestClientId);
        Environment.SetEnvironmentVariable("KEYCLOAK_CLIENT_SECRET", "test-secret");
        Environment.SetEnvironmentVariable("KEYCLOAK_ADMIN_TOKEN_ENDPOINT",
            "http://localhost:18080/realms/master/protocol/openid-connect/token");
        Environment.SetEnvironmentVariable("KEYCLOAK_ADMIN_USERNAME", "admin");
        Environment.SetEnvironmentVariable("KEYCLOAK_ADMIN_PASSWORD", "admin");
        Environment.SetEnvironmentVariable("KEYCLOAK_ADMIN_API_BASE_URL",
            "http://localhost:18080/admin/realms/maestro");
        Environment.SetEnvironmentVariable("WORKSPACE_SERVICE_URL",
            "http://localhost:18001");
        Environment.SetEnvironmentVariable("DEPLOY_SERVICE_URL",
            "http://localhost:18002");
        Environment.SetEnvironmentVariable("AI_SERVICE_URL",
            "http://localhost:18003");
        Environment.SetEnvironmentVariable("CORS_ALLOWED_ORIGINS",
            "http://localhost:5173");
        Environment.SetEnvironmentVariable("FRONTEND_URL", "http://localhost:5173");
        Environment.SetEnvironmentVariable("GATEWAY_PUBLIC_URL",
            "http://localhost:5000");
        Environment.SetEnvironmentVariable("KEYCLOAK_PUBLIC_URL",
            "http://localhost:18080");

        // Bypass du fetch JWKS bloquant au démarrage (15 retries × 3s).
        // Les endpoints non protégés par [Authorize] (Register, ForgotPassword,
        // Login) restent testables — les autres ressortiront en 401.
        Environment.SetEnvironmentVariable("SKIP_JWKS_FETCH", "1");

        // Postgres absent en test → InMemory via override DI.
        Environment.SetEnvironmentVariable("USER_DB_HOST", "test-not-used");
        Environment.SetEnvironmentVariable("USER_DB_PORT", "5432");
        Environment.SetEnvironmentVariable("USER_DB_DATABASE", "test-not-used");
        Environment.SetEnvironmentVariable("USER_DB_USERNAME", "test");
        Environment.SetEnvironmentVariable("USER_DB_PASSWORD_LOCAL", "test");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            // Remplace le DbContext Postgres par InMemory
            var dbContextDescriptor = services.SingleOrDefault(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (dbContextDescriptor != null) services.Remove(dbContextDescriptor);

            services.AddDbContext<AppDbContext>(opts =>
                opts.UseInMemoryDatabase("MaestroIntegrationTestDb"));

            // Hook : crée le schéma de la DB InMemory
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        });
    }
}
