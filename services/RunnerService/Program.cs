var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHostedService<KafkaConsumerService>();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapHealthChecks("/health");
app.MapGet("/", () => "RunnerService running");

app.Run();