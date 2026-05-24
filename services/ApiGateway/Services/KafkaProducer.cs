using Confluent.Kafka;
using System.Text.Json;

namespace ApiGateway.Services;

/// <summary>
/// Wraps a Confluent Kafka producer.
/// Registered as singleton in Program.cs so the TCP connection is reused.
/// </summary>
public class KafkaProducer : IDisposable
{
    private readonly IProducer<string, string> _producer;
    private readonly ILogger<KafkaProducer> _logger;

    public KafkaProducer(ILogger<KafkaProducer> logger)
    {
        _logger = logger;
        var broker = Environment.GetEnvironmentVariable("KAFKA_BROKER") ?? "kafka:9092";

        var config = new ProducerConfig
        {
            BootstrapServers = broker,
            // Guarantee at-least-once delivery
            Acks             = Acks.All,
            MessageSendMaxRetries = 5,
        };

        _producer = new ProducerBuilder<string, string>(config).Build();
        _logger.LogInformation("[KafkaProducer] Connected to {Broker}", broker);
    }

    /// <summary>
    /// Publishes a "user.registered" event after successful registration.
    /// The notification-service consumes this and sends the welcome message.
    /// </summary>
    public async Task PublishUserRegisteredAsync(
        string userId,
        string username,
        string email,
        string firstName,
        string lastName,
        CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            UserId       = userId,
            Username     = username,
            Email        = email,
            FirstName    = firstName,
            LastName     = lastName,
            RegisteredAt = DateTime.UtcNow,
        };

        var json = JsonSerializer.Serialize(payload);

        var message = new Message<string, string>
        {
            Key   = userId,   // key = userId so events for same user go to same partition
            Value = json,
        };

        try
        {
            var result = await _producer.ProduceAsync("user.registered", message, cancellationToken);
            _logger.LogInformation(
                "[KafkaProducer] ✅ Published user.registered for {UserId} → partition {P} offset {O}",
                userId, result.Partition.Value, result.Offset.Value);
        }
        catch (Exception ex)
        {
            // We log but do NOT rethrow: a Kafka failure must not break registration
            _logger.LogError(ex, "[KafkaProducer] ❌ Failed to publish user.registered for {UserId}", userId);
        }
    }

    public void Dispose() => _producer?.Dispose();
}