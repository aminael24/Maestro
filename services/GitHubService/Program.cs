using GitHubService.Application.Requests;
using GitHubService.Domain.Entities;
using GitHubService.Domain.Repositories;
using GitHubService.Domain.Services;
using GitHubService.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? "Host=github-db;Port=5432;Database=github_db;Username=admin;Password=admin_password";

builder.Services.AddDbContext<GitHubDbContext>(options =>
    options.UseNpgsql(databaseUrl));

builder.Services.AddScoped<IGitService, GitService>();
builder.Services.AddScoped<IRepositoryStore, RepositoryStore>();

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

app.MapGet("/api/repositories", async (IRepositoryStore store) => await store.GetAllAsync());
app.MapGet("/api/repositories/{projectId:guid}", async (Guid projectId, IRepositoryStore store) =>
{
    var repository = await store.GetByProjectIdAsync(projectId);
    return repository is null ? Results.NotFound() : Results.Ok(repository);
});

app.MapPost("/api/repositories", async (CreateRepositoryRequest request, IRepositoryStore store) =>
{
    var repository = new Repository
    {
        Id = Guid.NewGuid(),
        ProjectId = request.ProjectId,
        Provider = request.Provider,
        RemoteUrl = request.RemoteUrl,
        LocalPath = request.LocalPath,
        DefaultBranch = string.IsNullOrWhiteSpace(request.DefaultBranch) ? "main" : request.DefaultBranch,
        IsInitialized = false,
        CreatedAt = DateTime.UtcNow,
    };

    var saved = await store.CreateOrUpdateAsync(repository);
    return Results.Created($"/api/repositories/{saved.ProjectId}", saved);
});

app.MapPost("/api/repositories/{projectId:guid}/init", async (Guid projectId, IRepositoryStore store, IGitService gitService) =>
{
    var repository = await store.GetByProjectIdAsync(projectId);
    if (repository is null) return Results.NotFound();

    var result = await gitService.InitRepoAsync(repository.LocalPath);
    if (!result.Success)
    {
        return Results.Problem(result.Error, statusCode: 500);
    }

    repository.IsInitialized = true;
    await store.SaveChangesAsync();
    return Results.Ok(result);
});

app.MapPost("/api/repositories/{projectId:guid}/branch", async (Guid projectId, GitBranchRequest request, IRepositoryStore store, IGitService gitService) =>
{
    var repository = await store.GetByProjectIdAsync(projectId);
    if (repository is null) return Results.NotFound();

    var result = await gitService.CreateBranchAsync(repository.LocalPath, request.BranchName);
    return result.Success ? Results.Ok(result) : Results.Problem(result.Error, statusCode: 500);
});

app.MapPost("/api/repositories/{projectId:guid}/commit", async (Guid projectId, GitCommitRequest request, IRepositoryStore store, IGitService gitService) =>
{
    var repository = await store.GetByProjectIdAsync(projectId);
    if (repository is null) return Results.NotFound();

    var result = await gitService.CommitAsync(repository.LocalPath, request.Message);
    return result.Success ? Results.Ok(result) : Results.Problem(result.Error, statusCode: 500);
});

app.MapPost("/api/repositories/{projectId:guid}/push", async (Guid projectId, GitPushRequest request, IRepositoryStore store, IGitService gitService) =>
{
    var repository = await store.GetByProjectIdAsync(projectId);
    if (repository is null) return Results.NotFound();

    var result = await gitService.PushAsync(repository.LocalPath, request.BranchName);
    return result.Success ? Results.Ok(result) : Results.Problem(result.Error, statusCode: 500);
});

app.MapPost("/api/repositories/{projectId:guid}/fetch", async (Guid projectId, IRepositoryStore store, IGitService gitService) =>
{
    var repository = await store.GetByProjectIdAsync(projectId);
    if (repository is null) return Results.NotFound();

    var result = await gitService.FetchAsync(repository.LocalPath);
    return result.Success ? Results.Ok(result) : Results.Problem(result.Error, statusCode: 500);
});

app.MapGet("/api/repositories/{projectId:guid}/status", async (Guid projectId, IRepositoryStore store, IGitService gitService) =>
{
    var repository = await store.GetByProjectIdAsync(projectId);
    if (repository is null) return Results.NotFound();

    var status = await gitService.StatusAsync(repository.LocalPath);
    return status.Success ? Results.Ok(status) : Results.Problem(status.Error, statusCode: 500);
});

app.Run();
