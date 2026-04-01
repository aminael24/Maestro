using System.Security.Claims;
using ApiGateway.Models;
using ApiGateway.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiGateway.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly RegisterService _registerService;
    private readonly LocalUserService _localUserService;
    private readonly LoginService _loginService;
    private readonly OidcService _oidcService;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        RegisterService registerService,
        LocalUserService localUserService,
        LoginService loginService,
        OidcService oidcService,
        IWebHostEnvironment env)
    {
        _registerService = registerService;
        _localUserService = localUserService;
        _loginService = loginService;
        _oidcService = oidcService;
        _env = env;
    }

    private bool IsProduction => !_env.IsDevelopment();

    // ─────────────────────────────────────────────────────────
    // POST /auth/register
    // ─────────────────────────────────────────────────────────
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromForm] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.FirstName) ||
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
            return BadRequest(new
            {
                message = "Echec création compte",
                error = ex.Message
            });
        }
    }

    // ─────────────────────────────────────────────────────────
    // POST /auth/callback
    // Échange le code OIDC + PKCE → tokens.
    // refresh_token → cookie HttpOnly
    // access_token + id_token + expiresIn → JSON body
    // ─────────────────────────────────────────────────────────
    [HttpPost("callback")]
    public async Task<IActionResult> Callback(
        [FromBody] AuthCodeExchangeRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return BadRequest(new { message = "Code manquant" });
        }

        try
        {
            var tokens = await _oidcService.ExchangeCodeAsync(
                request.Code,
                request.CodeVerifier,
                cancellationToken);

            // ── Stocker le refresh_token dans un cookie HttpOnly ──
            if (!string.IsNullOrWhiteSpace(tokens.RefreshToken))
            {
                RefreshTokenCookieHelper.SetRefreshTokenCookie(
                    Response, tokens.RefreshToken, IsProduction);
            }

            // ── Ne renvoyer que access_token, id_token, expiresIn ──
            return Ok(new
            {
                accessToken = tokens.AccessToken,
                idToken     = tokens.IdToken,
                expiresIn   = tokens.ExpiresIn
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = "Échec échange code OIDC",
                error = ex.Message
            });
        }
    }

    // ─────────────────────────────────────────────────────────
    // POST /auth/refresh
    // Lit le refresh_token depuis le cookie HttpOnly,
    // demande un nouveau jeu de tokens à Keycloak,
    // met à jour le cookie avec le nouveau refresh_token,
    // renvoie le nouvel access_token au frontend.
    // ─────────────────────────────────────────────────────────
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        var refreshToken = RefreshTokenCookieHelper.GetRefreshToken(Request);

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return Unauthorized(new { message = "Aucun refresh_token (cookie absent ou expiré)" });
        }

        try
        {
            var tokens = await _oidcService.RefreshTokenAsync(refreshToken, cancellationToken);

            // Rotation : mettre à jour le cookie avec le nouveau refresh_token
            if (!string.IsNullOrWhiteSpace(tokens.RefreshToken))
            {
                RefreshTokenCookieHelper.SetRefreshTokenCookie(
                    Response, tokens.RefreshToken, IsProduction);
            }

            return Ok(new
            {
                accessToken = tokens.AccessToken,
                idToken     = tokens.IdToken,
                expiresIn   = tokens.ExpiresIn
            });
        }
        catch (Exception ex)
        {
            // Si le refresh échoue (token expiré / révoqué) → supprimer le cookie
            RefreshTokenCookieHelper.ClearRefreshTokenCookie(Response, IsProduction);

            return Unauthorized(new
            {
                message = "Refresh token invalide ou expiré",
                error = ex.Message
            });
        }
    }

    // ─────────────────────────────────────────────────────────
    // POST /auth/logout
    // Supprime le cookie refresh_token.
    // Optionnel : révoque le token côté Keycloak.
    // ─────────────────────────────────────────────────────────
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        RefreshTokenCookieHelper.ClearRefreshTokenCookie(Response, IsProduction);
        return Ok(new { message = "Déconnecté" });
    }

    // ─────────────────────────────────────────────────────────
    // POST /auth/login  (fallback – Resource Owner Password Grant)
    // ─────────────────────────────────────────────────────────
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "username et password sont obligatoires" });
        }

        try
        {
            var result = await _loginService.LoginAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Echec login", error = ex.Message });
        }
    }

    // ─────────────────────────────────────────────────────────
    // GET /auth/me  (protégé par JWT)
    // ─────────────────────────────────────────────────────────
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
            profileUrl = localUser?.ProfileUrl
        });
    }
}
