using DeploymentService.Services;
using DeploymentService.Models;
using Confluent.Kafka;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var keycloakRealmUrl = Environment.GetEnvironmentVariable("KEYCLOAK_REALM_URL")
                       ?? "http://keycloak:8080/realms/maestro";
var kafkaBroker = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") ?? "kafka:9092";

builder.Services.AddHttpClient();
builder.Services.AddSingleton<RailwayDeployService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.Authority = keycloakRealmUrl;
        opt.RequireHttpsMetadata = false;
        opt.TokenValidationParameters = new TokenValidationParameters { ValidateAudience = false };
    });
builder.Services.AddAuthorization();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

// POST /internal/deploy
app.MapPost("/internal/deploy", async (DeployRequest req, RailwayDeployService svc) =>
{
    try
    {
        var result = await svc.DeployAsync(req);

        // Publish deploy.started to Kafka
        await PublishKafkaEvent(kafkaBroker, "deploy.started", new
        {
            userId = req.UserId,
            serviceName = req.ServiceName,
            serviceUrl = result.ServiceUrl,
            serviceId = result.ServiceId,
            timestamp = DateTime.UtcNow
        });

        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// GET /internal/deploy/{serviceId}/status?railwayToken=xxx
app.MapGet("/internal/deploy/{serviceId}/status",
    async (string serviceId, string railwayToken, RailwayDeployService svc) =>
{
    var status = await svc.GetDeployStatusAsync(serviceId, railwayToken);

    // If just went live, fire deploy.completed event
    if (status.Status == "success" && status.Url != null)
    {
        await PublishKafkaEvent(kafkaBroker, "deploy.completed", new
        {
            serviceId,
            serviceUrl = status.Url,
            timestamp = DateTime.UtcNow
        });
    }

    return Results.Ok(status);
});

app.Run();

static async Task PublishKafkaEvent(string broker, string topic, object payload)
{
    var config = new ProducerConfig { BootstrapServers = broker };
    using var producer = new ProducerBuilder<Null, string>(config).Build();
    await producer.ProduceAsync(topic, new Message<Null, string>
    {
        Value = JsonSerializer.Serialize(payload)
    });
}