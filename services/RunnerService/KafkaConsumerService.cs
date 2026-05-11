using Confluent.Kafka;
using System.Text.Json;

public class KafkaConsumerService : BackgroundService
{
    private readonly ILogger<KafkaConsumerService> _logger;

    public KafkaConsumerService(ILogger<KafkaConsumerService> logger)
    {
        _logger = logger;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return Task.Run(() => Consume(stoppingToken), stoppingToken);
    }

    private void Consume(CancellationToken ct)
    {
        var bootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") ?? "kafka:9092";

        var config = new ConsumerConfig
        {
            BootstrapServers = bootstrapServers,
            GroupId = "runner-service-group",
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = false
        };

        using var consumer = new ConsumerBuilder<Ignore, string>(config).Build();
        consumer.Subscribe("project-opened-events");

        _logger.LogInformation("[Kafka] Consumer started, listening on 'project-opened-events'");

        while (!ct.IsCancellationRequested)
        {
            try
            {
                var result = consumer.Consume(ct);
                var message = result.Message.Value;

                _logger.LogInformation("[Kafka] Message received: {Message}", message);

                var evt = JsonSerializer.Deserialize<ProjectOpenedEvent>(message);
                if (evt != null)
                {
                    _logger.LogInformation(
                        "[Runner] Processing project {ProjectId} ({Type}) for user {UserId}",
                        evt.ProjectId, evt.ProjectType, evt.KeycloakId
                    );

                    // TODO: trigger your runner logic here
                    // e.g. call AIService, spin up a container, etc.
                }

                consumer.Commit(result);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Kafka] Error consuming message");
            }
        }

        consumer.Close();
    }
}

// Mirror of WorkspaceService's DTO
public record ProjectOpenedEvent(
    int ProjectId,
    string Name,
    string KeycloakId,
    string ProjectType,
    string FrontendFramework,
    string BackendFramework,
    string Database,
    bool IsDockerEnabled,
    DateTime Timestamp
);