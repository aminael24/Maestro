using DeploymentService.Services;
using DeploymentService.Models;
using Confluent.Kafka;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

var kafkaBroker = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") ?? "kafka:9092";

builder.Services.AddHttpClient();
builder.Services.AddSingleton<RailwayDeployService>();

var app = builder.Build();

// POST /internal/deploy  — called by the API Gateway proxy
app.MapPost("/internal/deploy", async (DeployRequest req, RailwayDeployService svc) =>
{
    try
    {
        var result = await svc.DeployAsync(req);

        await PublishKafkaEvent(kafkaBroker, "deploy.started", new
        {
            userId      = req.UserId,
            serviceName = req.ServiceName,
            serviceUrl  = result.ServiceUrl,
            serviceId   = result.ServiceId,
            timestamp   = DateTime.UtcNow
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
    try
    {
        var status = await svc.GetDeployStatusAsync(serviceId, railwayToken);

        if (status.Status == "success" && status.Url != null)
        {
            await PublishKafkaEvent(kafkaBroker, "deploy.completed", new
            {
                serviceId,
                serviceUrl = status.Url,
                timestamp  = DateTime.UtcNow
            });
        }

        return Results.Ok(status);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Background: consume github.push events and auto-deploy
_ = Task.Run(async () =>
{
    var config = new ConsumerConfig
    {
        BootstrapServers = kafkaBroker,
        GroupId          = "deploy-service-github-push",
        AutoOffsetReset  = AutoOffsetReset.Latest,
    };
    using var consumer = new ConsumerBuilder<Ignore, string>(config).Build();
    consumer.Subscribe("github.push");

    while (true)
    {
        try
        {
            var msg = consumer.Consume(TimeSpan.FromSeconds(5));
            if (msg?.Message?.Value == null) continue;

            using var doc = JsonDocument.Parse(msg.Message.Value);
            var root      = doc.RootElement;
            var repoUrl   = root.TryGetProperty("repoUrl",   out var r) ? r.GetString() : null;
            var branch    = root.TryGetProperty("branch",    out var b) ? b.GetString() : "main";
            var projectId = root.TryGetProperty("projectId", out var p) ? p.GetString() : null;

            if (string.IsNullOrWhiteSpace(repoUrl)) continue;

            Console.WriteLine($"[Deploy] github.push received for {repoUrl} branch={branch}");

            // Emit deploy.started so the frontend can pick it up via polling
            await PublishKafkaEvent(kafkaBroker, "deploy.started", new
            {
                projectId,
                repoUrl,
                branch,
                source    = "github.push",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Deploy Consumer] Error: {ex.Message}");
            await Task.Delay(3000);
        }
    }
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