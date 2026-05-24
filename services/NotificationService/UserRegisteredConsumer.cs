using Confluent.Kafka;
using System.Text.Json;
using NotificationService.Services;
using NotificationService.Models;

namespace NotificationService;

public class UserRegisteredConsumer : BackgroundService
{
    private readonly ILogger<UserRegisteredConsumer> _logger;
    private readonly string _bootstrapServers;
    private readonly IEmailService _emailService;

    public UserRegisteredConsumer(
        ILogger<UserRegisteredConsumer> logger,
        IEmailService emailService)
    {
        _logger = logger;
        _emailService = emailService;

        _bootstrapServers =
            Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS")
            ?? "kafka:9092";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "[NotificationService] Starting Kafka consumer on {Broker}",
            _bootstrapServers);

        var config = new ConsumerConfig
        {
            BootstrapServers = _bootstrapServers,
            GroupId = "notification-service-group",
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = true,
        };

        using var consumer =
            new ConsumerBuilder<Ignore, string>(config).Build();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                consumer.Subscribe("user.registered");

                _logger.LogInformation(
                    "[NotificationService] Subscribed to topic 'user.registered'");

                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    "[NotificationService] Kafka not ready yet ({Msg}), retrying in 5s…",
                    ex.Message);

                await Task.Delay(5000, stoppingToken);
            }
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = consumer.Consume(stoppingToken);

                if (result?.Message?.Value == null)
                    continue;

                var payload = JsonSerializer.Deserialize<UserRegisteredEvent>(
                    result.Message.Value,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                if (payload == null)
                    continue;

                await _emailService.SendWelcomeEmailAsync(
                    payload,
                    stoppingToken);

                _logger.LogInformation(
                    "[NotificationService] Welcome email sent to {Email}",
                    payload.Email);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "[NotificationService] Error consuming Kafka message");

                await Task.Delay(2000, stoppingToken);
            }
        }

        consumer.Close();

        _logger.LogInformation(
            "[NotificationService] Consumer stopped");
    }
}