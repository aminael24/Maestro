namespace RunnerService.Models;

public class RunRequest
{
    public string ProjectId { get; set; } = Guid.NewGuid().ToString();
    public string Sql { get; set; } = "";
    public string Model { get; set; } = "";
    public string Controller { get; set; } = "";
    public string Routes { get; set; } = "";
    public string Frontend { get; set; } = "";
}

public class RunResult
{
    public string ProjectId { get; set; } = "";
    public string BackendUrl { get; set; } = "";
    public string FrontendUrl { get; set; } = "";
    public string Status { get; set; } = "";
    public string Message { get; set; } = "";
}