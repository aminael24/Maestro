using Maestro.WorkspaceService.Application.DTOs;

namespace Maestro.WorkspaceService.Application.Services;

public interface IKafkaProducer
{
    Task ProduceProjectOpenedAsync(ProjectOpenedEvent @event);
}