using NotificationService.Models;

namespace NotificationService.Services;

public interface IEmailService
{
    Task SendWelcomeEmailAsync(
        UserRegisteredEvent evt,
        CancellationToken ct = default);
}