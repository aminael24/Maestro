using Confluent.Kafka;
using System.Text.Json;
using NotificationService.Services;
using NotificationService.Models;

namespace NotificationService;

public class DeployConsumer : BackgroundService
{
    private readonly ILogger<DeployConsumer> _logger;
    private readonly string _bootstrapServers;
    // Store userId→email mapping; in prod wire this to your user DB
    private static readonly Dictionary<string, string> _pendingDeploys = new();

    public DeployConsumer(ILogger<DeployConsumer> logger)
    {
        _logger = logger;
        _bootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") ?? "kafka:9092";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var config = new ConsumerConfig
        {
            BootstrapServers = _bootstrapServers,
            GroupId = "deploy-notification-group",
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = true,
        };

        using var consumer = new ConsumerBuilder<Ignore, string>(config).Build();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                consumer.Subscribe(new[] { "deploy.started", "deploy.completed" });
                break;
            }
            catch
            {
                await Task.Delay(5000, stoppingToken);
            }
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = consumer.Consume(stoppingToken);
                if (result?.Message?.Value == null) continue;

                if (result.Topic == "deploy.started")
                {
                    var ev = JsonSerializer.Deserialize<DeployStartedEvent>(
                        result.Message.Value,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (ev != null)
                    {
                        _pendingDeploys[ev.ServiceId] = ev.UserId;
                        _logger.LogInformation("[Deploy] Started for user {UserId}, service {Name}", ev.UserId, ev.ServiceName);
                        // Optionally send "deploy started" notification here via SSE/WebSocket
                    }
                }
                else if (result.Topic == "deploy.completed")
                {
                    var ev = JsonSerializer.Deserialize<DeployCompletedEvent>(
                        result.Message.Value,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (ev != null)
                    {
                        _logger.LogInformation("[Deploy] Completed: {Url}", ev.ServiceUrl);
                        _pendingDeploys.Remove(ev.ServiceId);
                        // Send email or push notification with ev.ServiceUrl
                    }
                }
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Deploy] Kafka error");
                await Task.Delay(2000, stoppingToken);
            }
        }

        consumer.Close();
    }
}