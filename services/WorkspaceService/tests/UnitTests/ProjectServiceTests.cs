using Maestro.WorkspaceService.Application.DTOs;
using Maestro.WorkspaceService.Application.Services;
using Maestro.WorkspaceService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Maestro.WorkspaceService.Domain.Entities;

namespace Maestro.WorkspaceService.Tests.UnitTests;

public class ProjectServiceTests
{
    public ProjectServiceTests()
    {
        // Utilise un dossier temporaire pour les tests au lieu de /app/projects
        var tempPath = Path.Combine(Path.GetTempPath(), "MaestroTests", Guid.NewGuid().ToString());
        Environment.SetEnvironmentVariable("PROJECTS_STORAGE_PATH", tempPath);
    }

    private WorkspaceDbContext GetDatabaseContext()
    {
        var options = new DbContextOptionsBuilder<WorkspaceDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new WorkspaceDbContext(options);
    }

    [Fact]
    public async Task CreateProjectAsync_ShouldSaveProject_Task5_TestCreation()
    {
        // Arrange
        var db = GetDatabaseContext();
        var service = new ProjectService(db, NullLogger<ProjectService>.Instance);
        var request = new CreateProjectRequest(
            "Projet de Test", 
            "Vérification Task 5", 
            "2026-10-10", 
            ProjectType.Fullstack, 
            "React", 
            "Express", 
            "PostgreSQL", 
            true
        );

        // Act
        var result = await service.CreateProjectAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Projet de Test");
        var exists = await db.Projects.AnyAsync(p => p.Name == "Projet de Test");
        exists.Should().BeTrue();
    }

    [Fact]
    public async Task GetAllProjectsAsync_ShouldReturnAll_Task5_TestRecuperation()
    {
        // Arrange
        var db = GetDatabaseContext();
        db.Projects.Add(new Domain.Entities.Project { Name = "P1", Type = ProjectType.Frontend });
        db.Projects.Add(new Domain.Entities.Project { Name = "P2", Type = ProjectType.Backend });
        await db.SaveChangesAsync();
        var service = new ProjectService(db, NullLogger<ProjectService>.Instance);

        // Act
        var results = await service.GetAllProjectsAsync();

        // Assert
        results.Should().HaveCount(2);
    }

    [Fact]
    public async Task DeleteProjectAsync_ShouldReturnTrue_WhenSuccess()
    {
        var db = GetDatabaseContext();
        var project = new Domain.Entities.Project { Name = "Delete Me" };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        var service = new ProjectService(db, NullLogger<ProjectService>.Instance);

        var deleted = await service.DeleteProjectAsync(project.Id);
        deleted.Should().BeTrue();
    }

    [Fact]
    public async Task InitializeProjectAsync_ShouldSetStatusToActive()
    {
        // Arrange
        var db = GetDatabaseContext();
        var project = new Project { Name = "Init Test", Status = "pending" };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        var service = new ProjectService(db, NullLogger<ProjectService>.Instance);

        // Act
        await service.InitializeProjectAsync(project.Id, ProjectType.Frontend);

        // Assert
        var updated = await db.Projects.FindAsync(project.Id);
        updated!.Status.Should().Be("active");
    }
}