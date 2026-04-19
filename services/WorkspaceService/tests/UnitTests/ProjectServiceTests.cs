using Maestro.WorkspaceService.Application.DTOs;
using Maestro.WorkspaceService.Application.Services;
using Maestro.WorkspaceService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FluentAssertions;

namespace Maestro.WorkspaceService.Tests.UnitTests;

public class ProjectServiceTests
{
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
        var service = new ProjectService(db);
        var request = new CreateProjectRequest(
            "Projet de Test", 
            "Vérification Task 5", 
            "2026-10-10", 
            "Fullstack", 
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
        db.Projects.Add(new Domain.Entities.Project { Name = "P1", Type = "Frontend" });
        db.Projects.Add(new Domain.Entities.Project { Name = "P2", Type = "Backend" });
        await db.SaveChangesAsync();
        var service = new ProjectService(db);

        // Act
        var results = await service.GetAllProjectsAsync();

        // Assert
        Assert.Equal(2, results.Count());
    }

    [Fact]
    public async Task DeleteProjectAsync_ShouldReturnTrue_WhenSuccess()
    {
        var db = GetDatabaseContext();
        var project = new Domain.Entities.Project { Name = "Delete Me" };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        var service = new ProjectService(db);

        var deleted = await service.DeleteProjectAsync(project.Id);
        Assert.True(deleted);
    }
}