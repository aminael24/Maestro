using NotificationService;
using NotificationService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSingleton<IEmailService, SmtpEmailService>();
builder.Services.AddHostedService<DeployConsumer>();   // ← add this

builder.Services.AddHostedService<UserRegisteredConsumer>();

var app = builder.Build();
app.MapGet("/health", () => Results.Ok("healthy"));




// SSE endpoint — frontend polls this for real-time deploy notifications
app.MapGet("/internal/notifications/deploy/{userId}", async (string userId, HttpContext ctx, CancellationToken ct) =>
{
    ctx.Response.Headers["Content-Type"] = "text/event-stream";
    ctx.Response.Headers["Cache-Control"] = "no-cache";
    ctx.Response.Headers["Connection"] = "keep-alive";

    // Push a heartbeat every 15s so the connection stays alive
    while (!ct.IsCancellationRequested)
    {
        await ctx.Response.WriteAsync($"data: heartbeat\n\n", ct);
        await ctx.Response.Body.FlushAsync(ct);
        await Task.Delay(15000, ct);
    }
});



app.MapControllers();

app.Run();