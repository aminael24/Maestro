using System.Security.Claims;
using System.Security.Cryptography;
using ApiGateway.Models;
using ApiGateway.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiGateway.Controllers;

/// <summary>
/// Source unique de vérité pour le flow d'authentification.
///
///   GET  /auth/login              → Keycloak (page de login standard)
///   GET  /auth/login/google       → Keycloak avec kc_idp_hint=google
///   GET  /auth/login/github       → Keycloak avec kc_idp_hint=github
///   GET  /auth/callback           → exchange code, pose cookies, redirect frontend
///   POST /auth/refresh            → rotate cookies via refresh_token
///   POST /auth/logout             → révoque session Keycloak + clear cookies
///   GET  /auth/me                 → infos user (lit cookie via middleware)
///   POST /auth/register           → création user via Keycloak Admin API
///   POST /auth/forgot-password    → email de reset via Keycloak Admin API
///
/// Tokens never returned in JSON. Frontend has no token to keep.
/// </summary>
[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly RegisterService _registerService;
    private readonly LocalUserService _localUserService;
    private readonly OidcService _oidcService;
    private readonly PasswordResetService _passwordResetService;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        RegisterService registerService,
        LocalUserService localUserService,
        OidcService oidcService,
        PasswordResetService passwordResetService,
        IWebHostEnvironment env,
        ILogger<AuthController> logger)
    {
        _registerService      = registerService;
        _localUserService     = localUserService;
        _oidcService          = oidcService;
        _passwordResetService = passwordResetService;
        _env                  = env;
        _logger               = logger;
    }

    private bool IsProduction => !_env.IsDevelopment();

    private string FrontendUrl =>
        Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:5173";

    private string PostLoginRedirect  => $"{FrontendUrl.TrimEnd('/')}/workspace/dashboard";
    private string PostLogoutRedirect => $"{FrontendUrl.TrimEnd('/')}/";

    // ─────────────────────────────────────────────────────────────
    // GET /auth/login            → page Keycloak standard
    // GET /auth/login/google     → kc_idp_hint=google
    // GET /auth/login/github     → kc_idp_hint=github
    // ─────────────────────────────────────────────────────────────
    [HttpGet("login")]
    public IActionResult Login()        => StartLoginFlow(idpHint: null);

    [HttpGet("login/google")]
    public IActionResult LoginGoogle()  => StartLoginFlow(idpHint: "google");

    [HttpGet("login/github")]
    public IActionResult LoginGitHub()  => StartLoginFlow(idpHint: "github");

    /// <summary>
    /// Démarre le flow OIDC : pose le state cookie, construit l'URL
    /// d'autorisation, redirige le navigateur vers Keycloak.
    /// </summary>
    private IActionResult StartLoginFlow(string? idpHint)
    {
        var state = GenerateRandomToken();
        AuthCookieHelper.SetOAuthStateCookie(Response, state, IsProduction);

        var url = _oidcService.BuildAuthorizationUrl(state, idpHint);
        return Redirect(url);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /auth/callback
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
            _logger.LogWarning("[OIDC] Keycloak returned error: {Error} {Description}",
                error, errorDescription);
            return RedirectToLoginWithError(error);
        }

        if (string.IsNullOrEmpty(code))
            return RedirectToLoginWithError("missing_code");

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

        // Auto-provisionne le LocalUser quand l'utilisateur arrive via
        // un IdP social (Google/GitHub) → première connexion = pas
        // encore de ligne dans la BDD locale.
        await EnsureLocalUserAsync(tokens.AccessToken, cancellationToken);

        AuthCookieHelper.SetAccessTokenCookie(
            Response, tokens.AccessToken, tokens.ExpiresIn, IsProduction);

        if (!string.IsNullOrEmpty(tokens.RefreshToken))
            AuthCookieHelper.SetRefreshTokenCookie(Response, tokens.RefreshToken, IsProduction);

        if (!string.IsNullOrEmpty(tokens.IdToken))
            AuthCookieHelper.SetIdTokenCookie(Response, tokens.IdToken, IsProduction);

        return Redirect(PostLoginRedirect);
    }

    /// <summary>
    /// Si c'est la 1ère connexion via IdP social, on crée la ligne
    /// LocalUser pour pouvoir stocker plus tard la ProfileUrl.
    /// (ProfileUrl reste null tant que l'utilisateur ne l'a pas complétée.)
    /// </summary>
    private async Task EnsureLocalUserAsync(
        string accessToken,
        CancellationToken cancellationToken)
    {
        try
        {
            var keycloakId = ExtractSubFromJwt(accessToken);
            if (string.IsNullOrWhiteSpace(keycloakId)) return;

            var existing = await _localUserService.GetByKeycloakIdAsync(keycloakId, cancellationToken);
            if (existing != null) return;

            await _localUserService.CreateMinimalAsync(keycloakId, profileUrl: null, cancellationToken);
            _logger.LogInformation("[Auth] LocalUser auto-créé pour Keycloak {Sub}", keycloakId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[Auth] EnsureLocalUserAsync échoué (best effort)");
        }
    }

    /// <summary>Décode le sub d'un JWT sans validation (just lecture).</summary>
    private static string? ExtractSubFromJwt(string jwt)
    {
        var parts = jwt.Split('.');
        if (parts.Length < 2) return null;

        try
        {
            var payload = parts[1];
            var padded = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=')
                                .Replace('-', '+').Replace('_', '/');
            var json = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(padded));
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            return doc.RootElement.TryGetProperty("sub", out var subEl) ? subEl.GetString() : null;
        }
        catch
        {
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // POST /auth/refresh
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
    //   Logout COMPLET en 2 phases :
    //
    //     Phase 1 — back-channel (côté serveur) :
    //       Le gateway envoie un POST à Keycloak /protocol/openid-connect/logout
    //       avec le refresh_token. Keycloak invalide la session SSO côté
    //       serveur. Même si l'utilisateur tente de réutiliser ses cookies
    //       de session ailleurs, ils ne marcheront plus.
    //
    //     Phase 2 — clear côté navigateur :
    //       Le gateway clear ses propres cookies maestro_*.
    //       Le frontend reçoit ensuite logoutUrl (= URL Keycloak end-session)
    //       et redirige le navigateur dessus pour clear AUSSI les cookies
    //       de session SSO Keycloak (AUTH_SESSION_ID, KEYCLOAK_IDENTITY).
    //
    //   Si appelé en GET (navigation directe) on fait la phase 1 puis on
    //   redirige direct vers Keycloak end_session.
    // ─────────────────────────────────────────────────────────────
    [HttpPost("logout")]
    [HttpGet("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var refreshToken = AuthCookieHelper.GetRefreshToken(Request);
        var idToken      = AuthCookieHelper.GetIdToken(Request);

        // Phase 1 — back-channel : kill la session côté Keycloak.
        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _oidcService.RevokeRefreshTokenAsync(refreshToken, cancellationToken);
        }

        // Clear nos cookies.
        AuthCookieHelper.ClearAllAuthCookies(Response, IsProduction);

        var isPost = string.Equals(Request.Method, "POST", StringComparison.OrdinalIgnoreCase);

        if (isPost)
        {
            // Le frontend SPA fait POST. On lui renvoie l'URL Keycloak
            // end_session et c'est lui qui redirige le navigateur.
            return Ok(new
            {
                message   = "Déconnecté",
                logoutUrl = _oidcService.BuildEndSessionUrl(idToken, PostLogoutRedirect),
            });
        }

        // GET (navigation directe) → on redirige direct vers Keycloak.
        var endSessionUrl = _oidcService.BuildEndSessionUrl(idToken, PostLogoutRedirect);
        return Redirect(endSessionUrl);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /auth/me
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

    // ─────────────────────────────────────────────────────────────
    // POST /auth/forgot-password
    //
    //   Body : { "email": "user@example.com" }
    //
    //   Demande à Keycloak d'envoyer un email de reset.
    //   Réponse TOUJOURS 200 (anti-énumération).
    //
    //   Pré-requis Keycloak :
    //     - SMTP configuré au niveau du realm (Realm settings → Email)
    //     - Service account du client maestro-api-gateway avec les
    //       rôles realm-management : manage-users, query-users
    // ─────────────────────────────────────────────────────────────
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "email requis" });

        var clientId    = Environment.GetEnvironmentVariable("KEYCLOAK_CLIENT_ID");
        var redirectUri = $"{Environment.GetEnvironmentVariable("GATEWAY_PUBLIC_URL") ?? "http://localhost:5000"}/auth/callback";

        await _passwordResetService.SendResetEmailAsync(
            request.Email,
            clientId,
            redirectUri,
            cancellationToken);

        return Ok(new
        {
            message = "Si l'email existe, un lien de réinitialisation vient d'être envoyé."
        });
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

public record ForgotPasswordRequest(string Email);
