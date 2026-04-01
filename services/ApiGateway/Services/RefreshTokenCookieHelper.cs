namespace ApiGateway.Services;

/// <summary>
/// Gère le stockage du refresh_token dans un cookie HttpOnly sécurisé.
/// En local (HTTP) : SameSite=Lax, Secure=false.
/// En production (HTTPS) : SameSite=None, Secure=true.
/// </summary>
public static class RefreshTokenCookieHelper
{
    public const string CookieName = "maestro_refresh_token";

    /// <summary>
    /// Écrit le refresh_token dans un cookie HttpOnly.
    /// </summary>
    public static void SetRefreshTokenCookie(HttpResponse response, string refreshToken, bool isProduction)
    {
        var options = BuildCookieOptions(isProduction);
        response.Cookies.Append(CookieName, refreshToken, options);
    }

    /// <summary>
    /// Supprime le cookie refresh_token.
    /// </summary>
    public static void ClearRefreshTokenCookie(HttpResponse response, bool isProduction)
    {
        var options = BuildCookieOptions(isProduction);
        response.Cookies.Delete(CookieName, options);
    }

    /// <summary>
    /// Lit le refresh_token depuis le cookie.
    /// </summary>
    public static string? GetRefreshToken(HttpRequest request)
    {
        request.Cookies.TryGetValue(CookieName, out var value);
        return value;
    }

    private static CookieOptions BuildCookieOptions(bool isProduction)
    {
        return new CookieOptions
        {
            HttpOnly = true,                                       // Jamais accessible via JS
            Secure   = isProduction,                               // true en HTTPS (prod), false en HTTP (local)
            SameSite = isProduction
                ? SameSiteMode.None                                // cross-origin HTTPS
                : SameSiteMode.Lax,                                // local dev (même origin)
            Path     = "/auth",                                    // Cookie envoyé uniquement sur /auth/*
            MaxAge   = TimeSpan.FromDays(30),                      // Durée alignée sur le refresh token Keycloak
        };
    }
}
