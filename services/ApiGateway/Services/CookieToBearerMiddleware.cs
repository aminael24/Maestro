namespace ApiGateway.Services;

/// <summary>
/// Si la requête entrante porte le cookie maestro_access_token et n'a
/// pas déjà d'en-tête Authorization, on copie la valeur du cookie sous
/// la forme `Authorization: Bearer ...`.
///
/// Cela permet à tout le code existant (JwtBearer, [Authorize], proxy)
/// de continuer à fonctionner sans modification, alors que le frontend
/// n'envoie plus jamais d'en-tête Authorization.
///
/// Doit être enregistré AVANT UseAuthentication() dans le pipeline.
/// </summary>
public sealed class CookieToBearerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CookieToBearerMiddleware> _logger;

    public CookieToBearerMiddleware(
        RequestDelegate next,
        ILogger<CookieToBearerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";
        var hasAuthHeader = context.Request.Headers.ContainsKey("Authorization");
        var cookieToken = AuthCookieHelper.GetAccessToken(context.Request);

        if (!hasAuthHeader && !string.IsNullOrEmpty(cookieToken))
        {
            context.Request.Headers["Authorization"] = $"Bearer {cookieToken}";
            _logger.LogDebug("[CookieBearer] {Path}: cookie → Authorization header (token len={Len})",
                path, cookieToken.Length);
        }
        else if (!hasAuthHeader && string.IsNullOrEmpty(cookieToken))
        {
            // Diagnostic utile : si l'utilisateur reçoit un 401 sur /api/*,
            // c'est presque toujours parce que le cookie n'est pas là.
            // On log la liste des cookies présents pour aider au debug.
            var cookieNames = string.Join(",", context.Request.Cookies.Keys);
            _logger.LogDebug("[CookieBearer] {Path}: no Authorization header AND no maestro_access_token cookie. Cookies present: [{Cookies}]",
                path, cookieNames);
        }

        await _next(context);
    }
}
