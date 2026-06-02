using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DeploymentService.Models;

namespace DeploymentService.Services;

public class RenderDeployService(IHttpClientFactory httpClientFactory, ILogger<RenderDeployService> logger)
{
    private const string RenderApiBase = "https://api.render.com/v1";

    public async Task<DeployResponse> DeployAsync(DeployRequest req)
    {
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", req.RenderApiKey);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        // 1. Get owner ID (required by Render API)
        var ownerResp = await client.GetAsync($"{RenderApiBase}/owners?limit=1");
        ownerResp.EnsureSuccessStatusCode();
        var ownerJson = await ownerResp.Content.ReadAsStringAsync();
        using var ownerDoc = JsonDocument.Parse(ownerJson);
        var ownerId = ownerDoc.RootElement[0].GetProperty("owner").GetProperty("id").GetString()!;

        // 2. Create the web service
        var payload = new
        {
            type = "web_service",
            name = req.ServiceName,
            ownerId,
            repo = req.RepoUrl,
            branch = req.Branch,
            serviceDetails = new
            {
                env = "node",
                buildCommand = req.BuildCommand ?? "npm install && npm run build",
                startCommand = req.StartCommand ?? "npm start",
                plan = "free",
                region = "oregon"
            }
        };

        var body = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var createResp = await client.PostAsync($"{RenderApiBase}/services", body);
        var createJson = await createResp.Content.ReadAsStringAsync();

        if (!createResp.IsSuccessStatusCode)
        {
            logger.LogError("Render API error: {body}", createJson);
            throw new Exception($"Render API error: {createResp.StatusCode} — {createJson}");
        }

        using var doc = JsonDocument.Parse(createJson);
        var service = doc.RootElement.GetProperty("service");
        var serviceId  = service.GetProperty("id").GetString()!;
        var serviceUrl = service.GetProperty("serviceDetails").GetProperty("url").GetString()
                         ?? $"https://{req.ServiceName}.onrender.com";

        return new DeployResponse(serviceId, serviceUrl, "deploying");
    }

    public async Task<string> GetDeployStatusAsync(string serviceId, string renderApiKey)
    {
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", renderApiKey);

        var resp = await client.GetAsync($"{RenderApiBase}/services/{serviceId}/deploys?limit=1");
        resp.EnsureSuccessStatusCode();
        var json = await resp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement[0].GetProperty("deploy").GetProperty("status").GetString() ?? "unknown";
    }
}