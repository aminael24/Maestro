using Maestro.WorkspaceService.Application.DTOs;

namespace Maestro.WorkspaceService.Application.Services;

public interface IKafkaProducer
{
    Task ProduceAsync(string topic, string message);
    Task ProduceProjectOpenedAsync(ProjectOpenedEvent @event);
}