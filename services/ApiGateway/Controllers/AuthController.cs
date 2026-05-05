using System.Security.Claims;
using System.Security.Cryptography;
using ApiGateway.Models;
using ApiGateway.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiGateway.Controllers;

/// <summary>
/// Single source of truth for the auth flow.
///
///   GET  /auth/login      → redirects browser to Keycloak (sets state cookie)
///   GET  /auth/callback   → exchanges code, sets HttpOnly cookies, redirects to /workspace/projects
///   POST /auth/refresh    → rotates the refresh token, refreshes the access cookie
///   POST /auth/logout     → clears cookies and redirects to Keycloak end-session
///   GET  /auth/me         → reads the access cookie (via middleware) and returns the user
///   POST /auth/register   → creates a Keycloak user (admin API)
///
/// Tokens are NEVER returned in JSON. The frontend has no token to keep.
/// </summary>
[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly RegisterService _registerService;
    private readonly LocalUserService _localUserService;
    private readonly OidcService _oidcService;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        RegisterService registerService,
        LocalUserService localUserService,
        OidcService oidcService,
        IWebHostEnvironment env,
        ILogger<AuthController> logger)
    {
        _registerService  = registerService;
        _localUserService = localUserService;
        _oidcService      = oidcService;
        _env              = env;
        _logger           = logger;
    }

    private bool IsProduction => !_env.IsDevelopment();

    private string FrontendUrl =>
        Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:5173";

    private string PostLoginRedirect => $"{FrontendUrl.TrimEnd('/')}/workspace/dashboard";
    private string PostLogoutRedirect => $"{FrontendUrl.TrimEnd('/')}/auth/login";

    // ─────────────────────────────────────────────────────────────
    // GET /auth/login
    //
    //   Generates a CSRF state, drops it in an HttpOnly cookie scoped to
    //   /auth, and redirects the browser to Keycloak's authorization
    //   endpoint. The redirect_uri is the gateway's own /auth/callback.
    // ─────────────────────────────────────────────────────────────
    [HttpGet("login")]
    public IActionResult Login()
    {
        var state = GenerateRandomToken();
        AuthCookieHelper.SetOAuthStateCookie(Response, state, IsProduction);

        var url = _oidcService.BuildAuthorizationUrl(state);
        return Redirect(url);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /auth/callback
    //
    //   Keycloak redirects the browser here with ?code=...&state=...
    //   We:
    //     1) verify the state against the cookie set at /auth/login,
    //     2) exchange the code for tokens (confidential client),
    //     3) drop access/refresh/id-tokens in HttpOnly cookies,
    //     4) redirect the browser to the SPA's /workspace/projects.
    // ─────────────────────────────────────────────────────────────
    [HttpGet("callback")]
    public async Task<IActionResult> Callback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error,
        [FromQuery(Name = "error_description")] string? errorDescription,
        CancellationToken cancellationToken)
    {
        // Always clear the state cookie — single use.
        var expectedState = AuthCookieHelper.GetOAuthState(Request);
        AuthCookieHelper.ClearOAuthStateCookie(Response, IsProduction);

        if (!string.IsNullOrEmpty(error))
        {
            _logger.LogWarning("[OIDC] Keycloak returned error: {Error} {Description}", error, errorDescription);
            return RedirectToLoginWithError(error);
        }

        if (string.IsNullOrEmpty(code))
        {
            return RedirectToLoginWithError("missing_code");
        }

        if (string.IsNullOrEmpty(expectedState) || expectedState != state)
        {
            _logger.LogWarning("[OIDC] State mismatch (cookie='{Cookie}' query='{Query}')",
                expectedState, state);
            return RedirectToLoginWithError("invalid_state");
        }

        OidcTokenSet tokens;
        try
        {
            tokens = await _oidcService.ExchangeCodeAsync(code, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[OIDC] Code exchange failed");
            return RedirectToLoginWithError("token_exchange_failed");
        }

        if (string.IsNullOrEmpty(tokens.AccessToken))
            return RedirectToLoginWithError("no_access_token");

        AuthCookieHelper.SetAccessTokenCookie(
            Response, tokens.AccessToken, tokens.ExpiresIn, IsProduction);

        if (!string.IsNullOrEmpty(tokens.RefreshToken))
            AuthCookieHelper.SetRefreshTokenCookie(Response, tokens.RefreshToken, IsProduction);

        if (!string.IsNullOrEmpty(tokens.IdToken))
            AuthCookieHelper.SetIdTokenCookie(Response, tokens.IdToken, IsProduction);

        return Redirect(PostLoginRedirect);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /auth/refresh
    //
    //   The frontend doesn't strictly need this anymore (the gateway can
    //   refresh transparently) but we keep it so the SPA can force a
    //   refresh after a 401.
    // ─────────────────────────────────────────────────────────────
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        var refreshToken = AuthCookieHelper.GetRefreshToken(Request);
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "Aucun refresh_token (cookie absent ou expiré)" });

        try
        {
            var tokens = await _oidcService.RefreshTokenAsync(refreshToken, cancellationToken);

            AuthCookieHelper.SetAccessTokenCookie(
                Response, tokens.AccessToken, tokens.ExpiresIn, IsProduction);

            if (!string.IsNullOrEmpty(tokens.RefreshToken))
                AuthCookieHelper.SetRefreshTokenCookie(Response, tokens.RefreshToken, IsProduction);

            if (!string.IsNullOrEmpty(tokens.IdToken))
                AuthCookieHelper.SetIdTokenCookie(Response, tokens.IdToken, IsProduction);

            return Ok(new { ok = true, expiresIn = tokens.ExpiresIn });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[OIDC] Refresh failed, clearing cookies");
            AuthCookieHelper.ClearAllAuthCookies(Response, IsProduction);
            return Unauthorized(new { message = "Refresh token invalide ou expiré" });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // POST /auth/logout
    //
    //   Clears cookies. If the request comes from XHR (i.e. has an
    //   Accept: application/json header) we just return 200; if it's a
    //   plain navigation we redirect through Keycloak's end-session.
    // ─────────────────────────────────────────────────────────────
    [HttpPost("logout")]
    [HttpGet("logout")]
    public IActionResult Logout()
    {
        var idToken = AuthCookieHelper.GetIdToken(Request);
        AuthCookieHelper.ClearAllAuthCookies(Response, IsProduction);

        var wantsJson =
            Request.Headers.Accept.ToString().Contains("application/json", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(Request.Method, "POST", StringComparison.OrdinalIgnoreCase);

        if (wantsJson)
            return Ok(new { message = "Déconnecté" });

        var endSessionUrl = _oidcService.BuildEndSessionUrl(idToken, PostLogoutRedirect);
        return Redirect(endSessionUrl);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /auth/me
    //
    //   The CookieToBearerMiddleware (registered in Program.cs) copies
    //   the maestro_access_token cookie into the Authorization header
    //   before JWT bearer validation runs, so [Authorize] + claims work
    //   exactly as if the SPA had sent a Bearer token.
    // ─────────────────────────────────────────────────────────────
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var keycloakId = User.FindFirstValue("sub");
        var email      = User.FindFirstValue("email");
        var firstName  = User.FindFirstValue("given_name");
        var lastName   = User.FindFirstValue("family_name");
        var username   = User.FindFirstValue("preferred_username");

        if (string.IsNullOrWhiteSpace(keycloakId))
            return Unauthorized(new { message = "Token invalide: sub manquant" });

        var localUser = await _localUserService.GetByKeycloakIdAsync(keycloakId, cancellationToken);

        return Ok(new
        {
            keycloakId,
            username,
            email,
            firstName,
            lastName,
            profileUrl = localUser?.ProfileUrl,
        });
    }

    // ─────────────────────────────────────────────────────────────
    // POST /auth/register
    // ─────────────────────────────────────────────────────────────
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromForm] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Email)    ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.FirstName)||
            string.IsNullOrWhiteSpace(request.LastName))
        {
            return BadRequest(new
            {
                message = "username, email, password, firstName, lastName sont obligatoires"
            });
        }

        try
        {
            var result = await _registerService.RegisterAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Echec création compte", error = ex.Message });
        }
    }

    // ── Helpers ──────────────────────────────────────────────────

    private IActionResult RedirectToLoginWithError(string code)
    {
        var u = $"{FrontendUrl.TrimEnd('/')}/auth/login?error={Uri.EscapeDataString(code)}";
        return Redirect(u);
    }

    private static string GenerateRandomToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }
}
