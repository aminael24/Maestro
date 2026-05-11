using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Maestro.WorkspaceService.Application.DTOs;
using System.IO;
using System.Linq;
using Maestro.WorkspaceService.Domain.Entities;
using Maestro.WorkspaceService.Application.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Maestro.WorkspaceService.Infrastructure.Persistence;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Text.Encodings.Web;
using Microsoft.Extensions.Logging;

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

    // Un simple Fake pour intercepter les messages Kafka pendant les tests
    public class FakeKafkaProducer : IKafkaProducer
    {
        public ProjectOpenedEvent? LastEvent { get; private set; }
        public Task ProduceProjectOpenedAsync(ProjectOpenedEvent @event) { LastEvent = @event; return Task.CompletedTask; }
        public Task ProduceAsync(string topic, string message) => Task.CompletedTask;
    }

    // Handler pour simuler un utilisateur authentifié via JWT
    public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public TestAuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
            : base(options, logger, encoder) { }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var claims = new[] { new Claim("sub", "test-user-id"), new Claim(ClaimTypes.NameIdentifier, "test-user-id") };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, "Test");
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }

    public class WorkspaceFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Tente de localiser le dossier racine du service pour charger la config correcte
            var projectDir = Directory.GetCurrentDirectory();
            if (projectDir.Contains("tests")) 
                projectDir = Path.Combine(projectDir, "..", "..");
            builder.UseContentRoot(projectDir);

            builder.ConfigureServices(services =>
            {
                // On retire la configuration PostgreSQL réelle
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<WorkspaceDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                // On la remplace par une base de données en mémoire pour les tests
                services.AddDbContext<WorkspaceDbContext>(options =>
                    options.UseInMemoryDatabase("IntegrationTestDb"));

                // On remplace le vrai producteur Kafka par notre Fake
                services.AddSingleton<IKafkaProducer, FakeKafkaProducer>();

                // On surcharge l'authentification pour les tests
                services.AddAuthentication("Test")
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", null);
                
                // On force le schéma par défaut sur "Test"
                services.Configure<AuthenticationOptions>(o => o.DefaultAuthenticateScheme = "Test");
            });
        }
    }

    private readonly WorkspaceFactory _factory;
    private readonly HttpClient _client;

    public ProjectsApiTests(WorkspaceFactory factory)
    {
        _factory = factory;
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
    public async Task GetProjectById_ReturnsSuccessAndTriggersKafka()
    {
        // 1. Create a project
        var request = new CreateProjectRequest("Kafka Test", "Desc", "2025", ProjectType.Frontend, "React", "None", "None", false, "test-user-id");
        var createResp = await _client.PostAsJsonAsync("/internal/projects", request, _options);
        var created = await createResp.Content.ReadFromJsonAsync<ProjectDto>(_options);

        // 2. Get by ID
        var response = await _client.GetAsync($"/internal/projects/{created!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var project = await response.Content.ReadFromJsonAsync<ProjectDto>(_options);
        project!.Id.Should().Be(created.Id);

        // Vérifier que l'événement Kafka a été réellement produit
        var kafka = _factory.Services.GetRequiredService<IKafkaProducer>() as FakeKafkaProducer;
        kafka.Should().NotBeNull();
        kafka!.LastEvent.Should().NotBeNull();
        kafka.LastEvent!.ProjectId.Should().Be(created.Id);
        kafka.LastEvent.KeycloakId.Should().Be("test-user-id");
    }

    [Fact]
    public async Task CreateProject_ReturnsCreatedAndInitializes()
    {
        // Arrange
        var request = new CreateProjectRequest("API Integration Project", "Test", "2025-12-12", ProjectType.Frontend, "React", "Express", "PostgreSQL", true, "test-user-id");

        // Act
        var response = await _client.PostAsJsonAsync("/internal/projects", request, _options);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<ProjectDto>(_options);
        created.Should().NotBeNull();
        created!.Name.Should().Be("API Integration Project");
        created.KeycloakId.Should().Be("test-user-id");
        created.Status.Should().Be("active"); // Vérifie que l'initialisation a bien eu lieu

        // Vérifier que le fichier template a été créé sur disque
        var storagePath = Environment.GetEnvironmentVariable("PROJECTS_STORAGE_PATH");
        var expectedFile = Path.Combine(storagePath!, "test-user-id", created.Id.ToString(), "src", "App.jsx");
        File.Exists(expectedFile).Should().BeTrue();
    }

    [Fact]
    public async Task GetFileTree_ReturnsValidStructure()
    {
        // 1. Create
        var request = new CreateProjectRequest("Tree Test", "Desc", "2025", ProjectType.Frontend, "React", "None", "None", false, "test-user-id");
        var createResp = await _client.PostAsJsonAsync("/internal/projects", request, _options);
        var project = await createResp.Content.ReadFromJsonAsync<ProjectDto>(_options);

        // 2. Get Tree
        var response = await _client.GetAsync($"/internal/projects/{project!.Id}/files");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var tree = await response.Content.ReadFromJsonAsync<JsonElement>();
        tree.GetProperty("name").GetString().Should().Be(project.Id.ToString());
        tree.GetProperty("children").GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetFileContent_ReturnsContent_AfterCreation()
    {
        // 1. Create
        var request = new CreateProjectRequest("File Test", "Desc", "2025", ProjectType.Backend, "None", "Express", "None", false, "test-user-id");
        var createResp = await _client.PostAsJsonAsync("/internal/projects", request, _options);
        var project = await createResp.Content.ReadFromJsonAsync<ProjectDto>(_options);

        // 2. Get File Tree
        var treeResp = await _client.GetAsync($"/internal/projects/{project!.Id}/files");
        treeResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // 3. Get Specific Content (index.js généré par le template Backend)
        var contentResp = await _client.GetAsync($"/internal/projects/{project.Id}/files/content?path=index.js");
        contentResp.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var data = await contentResp.Content.ReadFromJsonAsync<JsonElement>();
        data.GetProperty("content").GetString().Should().Contain("express");
    }

    [Fact]
    public async Task SaveFile_UpdatesFileOnDisk()
    {
        // 1. Create
        var request = new CreateProjectRequest("Update Test", "Desc", "2025", ProjectType.Frontend, "React", "None", "None", false, "test-user-id");
        var createResp = await _client.PostAsJsonAsync("/internal/projects", request, _options);
        var project = await createResp.Content.ReadFromJsonAsync<ProjectDto>(_options);

        // 2. Update Content
        var saveRequest = new { Path = "src/NewFile.txt", Content = "Hello Maestro" };
        var putResp = await _client.PutAsJsonAsync($"/internal/projects/{project!.Id}/files/content", saveRequest);
        putResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // 3. Verify
        var getResp = await _client.GetAsync($"/internal/projects/{project.Id}/files/content?path=src/NewFile.txt");
        var data = await getResp.Content.ReadFromJsonAsync<JsonElement>();
        data.GetProperty("content").GetString().Should().Be("Hello Maestro");
    }

    [Fact]
    public async Task DeleteProject_RemovesFromDbAndDisk()
    {
        // 1. Create
        var request = new CreateProjectRequest("Delete Test", "Desc", "2025", ProjectType.Frontend, "React", "None", "None", false, "test-user-id");
        var createResp = await _client.PostAsJsonAsync("/internal/projects", request, _options);
        var project = await createResp.Content.ReadFromJsonAsync<ProjectDto>(_options);
        var storagePath = Environment.GetEnvironmentVariable("PROJECTS_STORAGE_PATH");
        var projectPath = Path.Combine(storagePath!, "test-user-id", project!.Id.ToString());

        // 2. Delete
        var delResp = await _client.DeleteAsync($"/internal/projects/{project.Id}");
        delResp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // 3. Assert disk removal
        Directory.Exists(projectPath).Should().BeFalse();
    }
}
