namespace NotificationService.Models;

public record UserRegisteredEvent(
    string UserId,
    string Username,
    string Email,
    string FirstName,
    string LastName,
    DateTime RegisteredAt
);