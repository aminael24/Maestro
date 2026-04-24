using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Maestro.WorkspaceService.Application.DTOs;
using System.IO;
using System.Linq;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Maestro.WorkspaceService.Infrastructure.Persistence;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Maestro.WorkspaceService.Tests.IntegrationTests;

public class ProjectsApiTests : IClassFixture<ProjectsApiTests.WorkspaceFactory>
{
    static ProjectsApiTests()
    {
        // Force la racine du contenu sur le répertoire actuel (/src dans Docker)
        // Cela empêche WebApplicationFactory de chercher un fichier .sln inexistant.
        Environment.SetEnvironmentVariable("ASPNETCORE_TEST_CONTENTROOT_WorkspaceService", Directory.GetCurrentDirectory());

        // Définit un chemin de stockage temporaire pour éviter les erreurs de permission sur Windows
        var tempPath = Path.Combine(Path.GetTempPath(), "MaestroIntegrationTests", Guid.NewGuid().ToString());
        Environment.SetEnvironmentVariable("PROJECTS_STORAGE_PATH", tempPath);
    }

    private readonly JsonSerializerOptions _options = new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public class WorkspaceFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseContentRoot(Directory.GetCurrentDirectory());

            builder.ConfigureServices(services =>
            {
                // On retire la configuration PostgreSQL réelle
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<WorkspaceDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                // On la remplace par une base de données en mémoire pour les tests
                services.AddDbContext<WorkspaceDbContext>(options =>
                    options.UseInMemoryDatabase("IntegrationTestDb"));
            });
        }
    }

    private readonly HttpClient _client;

    public ProjectsApiTests(WorkspaceFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetProjects_ReturnsSuccessAndJson()
    {
        // Act
        var response = await _client.GetAsync("/internal/projects");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var projects = await response.Content.ReadFromJsonAsync<IEnumerable<ProjectDto>>(_options);
        projects.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateProject_ReturnsCreatedAndInitializes()
    {
        // Arrange
        var request = new CreateProjectRequest("API Integration Project", "Test", "2025-12-12");

        // Act
        var response = await _client.PostAsJsonAsync("/internal/projects", request, _options);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<ProjectDto>(_options);
        created.Should().NotBeNull();
        created!.Name.Should().Be("API Integration Project");
        created.Status.Should().Be("active"); // Vérifie que l'initialisation a bien eu lieu
    }
}
