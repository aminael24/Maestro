using GitHubService.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? "Host=github-db;Port=5432;Database=github_db;Username=admin;Password=admin_password";

builder.Services.AddDbContext<GitHubDbContext>(options =>
    options.UseNpgsql(databaseUrl));

builder.Services.AddHealthChecks();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GitHubDbContext>();
    var retries = 10;
    while (retries > 0)
    {
        try
        {
            db.Database.EnsureCreated();
            app.Logger.LogInformation("[DB] GitHub database schema is ready.");
            break;
        }
        catch (Exception ex)
        {
            retries--;
            app.Logger.LogWarning(ex, "[DB] GitHub database not ready yet, retrying ({Retries})...", retries);
            Thread.Sleep(2000);
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapHealthChecks("/health");

app.MapGet("/api/repositories", async (GitHubDbContext db) => await db.Repositories.ToListAsync());
app.MapGet("/api/github-connections", async (GitHubDbContext db) => await db.GithubConnections.ToListAsync());
app.MapGet("/api/sync-operations", async (GitHubDbContext db) => await db.SyncOperations.ToListAsync());

app.Run();
