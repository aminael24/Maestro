import { env } from "../utils/env";
import { guardedFetch } from "../utils/apiGuard";

// ═══════════════════════════════════════════════════════════════
//  authService – cookie-based, no localStorage, no PKCE.
//
//  Every function here uses `credentials: "include"` so the browser
//  attaches the gateway-managed HttpOnly cookies. The frontend
//  never sees any token.
// ═══════════════════════════════════════════════════════════════

/** Read body safely – handles empty responses without throwing. */
async function safeJson(response) {
  const text = await response.text();
  if (!text || text.trim() === "") return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Réponse non-JSON du serveur (status ${response.status}): ${text.slice(0, 200)}`
    );
  }
}

// ── Login ──────────────────────────────────────────────────────

/**
 * Triggers a full-page navigation to the gateway's /auth/login.
 * The gateway will redirect to Keycloak and, after authentication,
 * back to /workspace/projects with the auth cookies set.
 */
export function redirectToGatewayLogin() {
  window.location.href = `${env.apiGatewayUrl}/auth/login`;
}

// ── Register ───────────────────────────────────────────────────

export async function registerUser(formData) {
  const response = await guardedFetch(`${env.apiGatewayUrl}/auth/register`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const data = await safeJson(response);
  if (!response.ok) throw new Error(data?.message || "Erreur register");
  return data;
}

// ── Refresh (optional – the gateway can refresh transparently) ─

/**
 * Forces a refresh of the access cookie. Useful after a 401.
 * Returns true on success, false if the session is dead.
 */
export async function refreshAccessToken() {
  const response = await guardedFetch(`${env.apiGatewayUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  return response.ok;
}

// ── Logout ─────────────────────────────────────────────────────

/**
 * Clears the auth cookies on the gateway.
 * Returns true even if the network call fails — the user wants out.
 */
export async function logout() {
  try {
    await guardedFetch(`${env.apiGatewayUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // best effort
  }
  return true;
}

// ── Profile ────────────────────────────────────────────────────

/**
 * Fetches the authenticated user. The browser sends the
 * maestro_access_token cookie automatically (credentials: include).
 *
 * Throws on 401 — the caller is expected to redirect to /auth/login.
 *
 * Note: the optional `_legacyToken` argument is accepted for backwards
 * compatibility with old call sites that used to pass an access
 * token; it is silently ignored.
 */
export async function getMe(/* _legacyToken */) {
  const response = await guardedFetch(`${env.apiGatewayUrl}/auth/me`, {
    credentials: "include",
  });
  const data = await safeJson(response);
  if (!response.ok) throw new Error(data?.message || "Erreur /auth/me");
  return data;
}

// ── Backwards-compat shim ──────────────────────────────────────

/**
 * Legacy export – the frontend no longer exchanges codes. The
 * gateway's /auth/callback handles the exchange and sets cookies.
 * Kept as a no-op so old imports don't crash; new code should not
 * call this.
 */
export async function exchangeCode() {
  return {};
}
