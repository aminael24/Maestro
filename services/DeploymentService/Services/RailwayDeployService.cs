using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DeploymentService.Models;

namespace DeploymentService.Services;

public class RailwayDeployService(IHttpClientFactory httpClientFactory, ILogger<RailwayDeployService> logger)
{
    // Railway uses GraphQL
    private const string RailwayGraphQL = "https://backboard.railway.app/graphql/v2";

    public async Task<DeployResponse> DeployAsync(DeployRequest req)
    {
        var client = CreateClient(req.RailwayToken);

        // 1. Get or create project
        var projectId = await CreateProjectAsync(client, req.ServiceName);

        // 2. Link GitHub repo and trigger deploy
        var serviceId = await LinkRepoAndDeployAsync(client, projectId, req);

        // 3. Get service URL
        var serviceUrl = await GetServiceUrlAsync(client, serviceId) 
                         ?? $"https://{req.ServiceName}.up.railway.app";

        return new DeployResponse(serviceId, serviceUrl, "deploying");
    }

    public async Task<DeployStatusResponse> GetDeployStatusAsync(string serviceId, string railwayToken)
    {
        var client = CreateClient(railwayToken);

        var query = new
        {
            query = @"
                query ServiceDeployments($serviceId: String!) {
                  deployments(input: { serviceId: $serviceId }, first: 1) {
                    edges { node { id status url } }
                  }
                }",
            variables = new { serviceId }
        };

        var resp = await client.PostAsync(RailwayGraphQL,
            new StringContent(JsonSerializer.Serialize(query), Encoding.UTF8, "application/json"));
        resp.EnsureSuccessStatusCode();

        var json = await resp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var edges = doc.RootElement
            .GetProperty("data")
            .GetProperty("deployments")
            .GetProperty("edges");

        if (edges.GetArrayLength() == 0)
            return new DeployStatusResponse("deploying", null);

        var node = edges[0].GetProperty("node");
        var status = node.GetProperty("status").GetString() ?? "deploying";
        var url = node.TryGetProperty("url", out var urlProp) ? urlProp.GetString() : null;

        // Railway statuses: DEPLOYING, SUCCESS, FAILED, CRASHED, REMOVED
        return new DeployStatusResponse(status.ToLower(), url);
    }

    private async Task<string> CreateProjectAsync(HttpClient client, string name)
    {
        var mutation = new
        {
            query = @"
                mutation CreateProject($name: String!) {
                  projectCreate(input: { name: $name }) { id }
                }",
            variables = new { name }
        };

        var resp = await client.PostAsync(RailwayGraphQL,
            new StringContent(JsonSerializer.Serialize(mutation), Encoding.UTF8, "application/json"));
        resp.EnsureSuccessStatusCode();

        var json = await resp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("data").GetProperty("projectCreate").GetProperty("id").GetString()!;
    }

    private async Task<string> LinkRepoAndDeployAsync(HttpClient client, string projectId, DeployRequest req)
    {
        // Create service from GitHub repo
        var mutation = new
        {
            query = @"
                mutation ServiceCreate($projectId: String!, $source: ServiceSourceInput!) {
                  serviceCreate(input: { projectId: $projectId, source: $source }) { id }
                }",
            variables = new
            {
                projectId,
                source = new
                {
                    repo = req.RepoUrl.Replace("https://github.com/", ""),
                    branch = req.Branch
                }
            }
        };

        var resp = await client.PostAsync(RailwayGraphQL,
            new StringContent(JsonSerializer.Serialize(mutation), Encoding.UTF8, "application/json"));
        resp.EnsureSuccessStatusCode();

        var json = await resp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("data").GetProperty("serviceCreate").GetProperty("id").GetString()!;
    }

    private async Task<string?> GetServiceUrlAsync(HttpClient client, string serviceId)
    {
        var query = new
        {
            query = @"
                query GetService($serviceId: String!) {
                  service(id: $serviceId) { domains { edges { node { domain } } } }
                }",
            variables = new { serviceId }
        };

        var resp = await client.PostAsync(RailwayGraphQL,
            new StringContent(JsonSerializer.Serialize(query), Encoding.UTF8, "application/json"));
        if (!resp.IsSuccessStatusCode) return null;

        var json = await resp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var edges = doc.RootElement
            .GetProperty("data").GetProperty("service")
            .GetProperty("domains").GetProperty("edges");

        if (edges.GetArrayLength() == 0) return null;
        var domain = edges[0].GetProperty("node").GetProperty("domain").GetString();
        return domain != null ? $"https://{domain}" : null;
    }

    private HttpClient CreateClient(string token)
    {
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        return client;
    }
}