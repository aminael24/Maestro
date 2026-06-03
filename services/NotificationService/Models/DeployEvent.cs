namespace NotificationService.Models;

public record DeployStartedEvent(
    string UserId,
    string ServiceName,
    string ServiceUrl,
    string ServiceId,
    DateTime Timestamp
);

public record DeployCompletedEvent(
    string ServiceId,
    string ServiceUrl,
    DateTime Timestamp
);