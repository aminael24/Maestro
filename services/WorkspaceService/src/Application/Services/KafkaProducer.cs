using Confluent.Kafka;
using Maestro.WorkspaceService.Application.DTOs;
using System.Text.Json;

namespace Maestro.WorkspaceService.Application.Services;

public class KafkaProducer : IKafkaProducer, IDisposable
{
    private readonly ILogger<KafkaProducer> _logger;
    private readonly IProducer<Null, string> _producer;

    public KafkaProducer(ILogger<KafkaProducer> logger)
    {
        _logger = logger;
        var bootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") ?? "kafka:9092";
        
        var config = new ProducerConfig 
        { 
            BootstrapServers = bootstrapServers,
            Acks = Acks.All,
            MessageSendMaxRetries = 3
        };

        _producer = new ProducerBuilder<Null, string>(config).Build();
    }

    public async Task ProduceAsync(string topic, string message)
    {
        try
        {
            await _producer.ProduceAsync(topic, new Message<Null, string> { Value = message });
        }
        catch (ProduceException<Null, string> e)
        {
            _logger.LogError("[Kafka] Échec de l'envoi vers le topic : {Reason}", e.Error.Reason);
            throw;
        }
    }

    public async Task ProduceProjectOpenedAsync(ProjectOpenedEvent @event)
    {
        var message = JsonSerializer.Serialize(@event);
        await ProduceAsync("project-opened-events", message);
        _logger.LogInformation("[Kafka] Événement ProjectOpened envoyé pour le projet {ProjectId}", @event.ProjectId);
    }

    public async Task ProduceFileUpdateAsync(FileUpdateEvent @event)
    {
        var message = JsonSerializer.Serialize(@event);
        await ProduceAsync("project-updates", message);
        _logger.LogInformation("[Kafka] Événement FileUpdate envoyé pour le projet {ProjectId}: {Path}", @event.ProjectId, @event.Path);
    }

    public void Dispose()
    {
        _producer?.Dispose();
    }
}