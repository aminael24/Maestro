using Confluent.Kafka;
using Maestro.WorkspaceService.Application.DTOs;
using System.Text.Json;

namespace Maestro.WorkspaceService.Application.Services;

public class KafkaProducer : IKafkaProducer
{
    private readonly ILogger<KafkaProducer> _logger;
    private readonly string _bootstrapServers;

    public KafkaProducer(ILogger<KafkaProducer> logger)
    {
        _logger = logger;
        // Utilise la variable d'environnement définie dans docker-compose
        _bootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") ?? "kafka:9092";
    }

    public async Task ProduceProjectOpenedAsync(ProjectOpenedEvent @event)
    {
        var config = new ProducerConfig 
        { 
            BootstrapServers = _bootstrapServers,
            Acks = Acks.All,
            MessageSendMaxRetries = 3
        };

        using var producer = new ProducerBuilder<Null, string>(config).Build();

        try
        {
            var message = JsonSerializer.Serialize(@event);
            await producer.ProduceAsync("project-opened-events", new Message<Null, string> { Value = message });
            _logger.LogInformation("[Kafka] Événement envoyé avec succès pour le projet {ProjectId}", @event.ProjectId);
        }
        catch (ProduceException<Null, string> e)
        {
            _logger.LogError("[Kafka] Échec de l'envoi vers le topic : {Reason}", e.Error.Reason);
        }
    }
}