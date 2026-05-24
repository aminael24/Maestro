using NotificationService;
using NotificationService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSingleton<IEmailService, SmtpEmailService>();

builder.Services.AddHostedService<UserRegisteredConsumer>();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok("healthy"));
app.MapControllers();

app.Run();