using RunnerService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<DockerService>();
builder.Services.AddHostedService<Maestro.RunnerService.Services.KafkaFileConsumer>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseWebSockets();
app.UseCors("AllowAll");
app.MapControllers();

app.Run();