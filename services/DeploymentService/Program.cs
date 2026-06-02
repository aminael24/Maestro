using DeploymentService.Services;
using DeploymentService.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var keycloakRealmUrl = Environment.GetEnvironmentVariable("KEYCLOAK_REALM_URL") 
                       ?? "http://keycloak:8080/realms/maestro";

builder.Services.AddHttpClient();
builder.Services.AddSingleton<RenderDeployService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.Authority = keycloakRealmUrl;
        opt.RequireHttpsMetadata = false;
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

// Called by ApiGateway (internal, already token-exchanged)
app.MapPost("/internal/deploy", async (DeployRequest req, RenderDeployService svc) =>
{
    try
    {
        var result = await svc.DeployAsync(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapGet("/internal/deploy/{serviceId}/status", 
    async (string serviceId, string renderApiKey, RenderDeployService svc) =>
{
    var status = await svc.GetDeployStatusAsync(serviceId, renderApiKey);
    return Results.Ok(new { status });
});

app.Run();