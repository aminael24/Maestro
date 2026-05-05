namespace ApiGateway.Services;

/// <summary>
/// Centralized helper for the four cookies used by the auth flow.
///
///   maestro_access_token   – Bearer token used for protected APIs.
///                            Path = "/"  (sent on every API call).
///   maestro_refresh_token  – Refresh token, only used by /auth/*.
///                            Path = "/auth".
///   maestro_id_token       – ID token, used at logout for id_token_hint.
///                            Path = "/auth".
///   maestro_oauth_state    – Short-lived CSRF cookie set during /auth/login,
///                            verified at /auth/callback. Path = "/auth".
///
/// All cookies are HttpOnly. Secure + SameSite are picked based on
/// environment:
///
///   Development  → Secure = false, SameSite = Lax (works on plain HTTP).
///   Production   → Secure = true,  SameSite = None (cross-site HTTPS).
/// </summary>
public static class AuthCookieHelper
{
    public const string AccessTokenCookie  = "maestro_access_token";
    public const string RefreshTokenCookie = "maestro_refresh_token";
    public const string IdTokenCookie      = "maestro_id_token";
    public const string OAuthStateCookie   = "maestro_oauth_state";

    // ── Access token ──────────────────────────────────────────────
    public static void SetAccessTokenCookie(HttpResponse response, string token, int expiresInSeconds, bool isProduction)
    {
        var options = BuildBaseOptions(isProduction);
        options.Path   = "/";
        // Slightly outlive the token so a request that arrives a few ms
        // before the JWT expires still carries it; the JWT middleware
        // is the source of truth for actual validity.
        options.MaxAge = TimeSpan.FromSeconds(Math.Max(expiresInSeconds, 60));
        response.Cookies.Append(AccessTokenCookie, token, options);
    }

    public static string? GetAccessToken(HttpRequest request)
    {
        request.Cookies.TryGetValue(AccessTokenCookie, out var value);
        return value;
    }

    public static void ClearAccessTokenCookie(HttpResponse response, bool isProduction)
    {
        var options = BuildBaseOptions(isProduction);
        options.Path = "/";
        response.Cookies.Delete(AccessTokenCookie, options);
    }

    // ── Refresh token ─────────────────────────────────────────────
    public static void SetRefreshTokenCookie(HttpResponse response, string token, bool isProduction)
    {
        var options = BuildBaseOptions(isProduction);
        options.Path   = "/auth";
        options.MaxAge = TimeSpan.FromDays(30);
        response.Cookies.Append(RefreshTokenCookie, token, options);
    }

    public static string? GetRefreshToken(HttpRequest request)
    {
        request.Cookies.TryGetValue(RefreshTokenCookie, out var value);
        return value;
    }

    public static void ClearRefreshTokenCookie(HttpResponse response, bool isProduction)
    {
        var options = BuildBaseOptions(isProduction);
        options.Path = "/auth";
        response.Cookies.Delete(RefreshTokenCookie, options);
    }

    // ── ID token ──────────────────────────────────────────────────
    public static void SetIdTokenCookie(HttpResponse response, string token, bool isProduction)
    {
        var options = BuildBaseOptions(isProduction);
        options.Path   = "/auth";
        options.MaxAge = TimeSpan.FromDays(30);
        response.Cookies.Append(IdTokenCookie, token, options);
    }

    public static string? GetIdToken(HttpRequest request)
    {
        request.Cookies.TryGetValue(IdTokenCookie, out var value);
        return value;
    }

    public static void ClearIdTokenCookie(HttpResponse response, bool isProduction)
    {
        var options = BuildBaseOptions(isProduction);
        options.Path = "/auth";
        response.Cookies.Delete(IdTokenCookie, options);
    }

    // ── OAuth state (CSRF) ────────────────────────────────────────
    public static void SetOAuthStateCookie(HttpResponse response, string state, bool isProduction)
    {
        var options = BuildBaseOptions(isProduction);
        options.Path   = "/auth";
        options.MaxAge = TimeSpan.FromMinutes(10);
        response.Cookies.Append(OAuthStateCookie, state, options);
    }

    public static string? GetOAuthState(HttpRequest request)
    {
        request.Cookies.TryGetValue(OAuthStateCookie, out var value);
        return value;
    }

    public static void ClearOAuthStateCookie(HttpResponse response, bool isProduction)
    {
        var options = BuildBaseOptions(isProduction);
        options.Path = "/auth";
        response.Cookies.Delete(OAuthStateCookie, options);
    }

    // ── Clear everything (logout) ─────────────────────────────────
    public static void ClearAllAuthCookies(HttpResponse response, bool isProduction)
    {
        ClearAccessTokenCookie(response, isProduction);
        ClearRefreshTokenCookie(response, isProduction);
        ClearIdTokenCookie(response, isProduction);
        ClearOAuthStateCookie(response, isProduction);
    }

    // ── Internal ──────────────────────────────────────────────────
    private static CookieOptions BuildBaseOptions(bool isProduction)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure   = isProduction,
            SameSite = isProduction ? SameSiteMode.None : SameSiteMode.Lax,
        };
    }
}
