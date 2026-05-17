using Confluent.Kafka;
using System.Text.Json;
using System.IO;
using Microsoft.Extensions.Hosting;

namespace Maestro.RunnerService.Services;

public record FileUpdateEvent(int ProjectId, string Path, string Content);

public class KafkaFileConsumer : BackgroundService
{
    private readonly ILogger<KafkaFileConsumer> _logger;
    private readonly string _storagePath;
    private readonly IConsumer<Ignore, string> _consumer;

    public KafkaFileConsumer(ILogger<KafkaFileConsumer> logger)
    {
        _logger = logger;
        _storagePath = "/app/projects"; // Doit correspondre au volume partagé

        var config = new ConsumerConfig
        {
            BootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") ?? "kafka:9092",
            GroupId = "runner-service-group",
            AutoOffsetReset = AutoOffsetReset.Earliest
        };

        _consumer = new ConsumerBuilder<Ignore, string>(config).Build();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _consumer.Subscribe("project-updates");
        _logger.LogInformation("[Kafka] RunnerService écoute le topic project-updates...");

        await Task.Run(async () =>
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var result = _consumer.Consume(stoppingToken);
                    if (result == null || result.IsPartitionEOF) continue;

                    var @event = JsonSerializer.Deserialize<FileUpdateEvent>(result.Message.Value, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    
                    if (@event == null) continue;

                    var fullPath = Path.Combine(_storagePath, @event.ProjectId.ToString(), @event.Path);
                    Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
                    File.WriteAllText(fullPath, @event.Content);

                    _logger.LogInformation("[Kafka] Fichier synchronisé pour le projet {ProjectId}: {Path}", @event.ProjectId, @event.Path);
                }
                catch (ConsumeException ex) when (ex.Error.Code == ErrorCode.UnknownTopicOrPart)
                {
                    // Le topic n'existe pas encore (auto-création au 1er message). On logge et on attend.
                    _logger.LogWarning("[Kafka] Le topic 'project-updates' n'est pas encore disponible. En attente d'une mise à jour de fichier...");
                    await Task.Delay(5000, stoppingToken);
                }
                catch (Exception ex) 
                { 
                    _logger.LogError(ex, "Erreur de consommation Kafka"); 
                    await Task.Delay(2000, stoppingToken);
                }
            }
        }, stoppingToken);
    }
}