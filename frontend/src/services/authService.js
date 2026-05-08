import { env } from "../utils/env";
import { guardedFetch } from "../utils/apiGuard";

// ═══════════════════════════════════════════════════════════════
//  authService – cookie-based, no localStorage, no PKCE.
//
//  Toutes les fonctions utilisent `credentials: "include"` pour que
//  le navigateur attache les cookies HttpOnly gérés par le gateway.
//  Le frontend ne voit jamais de token.
// ═══════════════════════════════════════════════════════════════

/** Lit le body en gérant les réponses vides sans throw. */
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

// ── Login (Keycloak login standard) ─────────────────────────────

/**
 * Full-page navigation vers /auth/login du gateway.
 * Le gateway redirige vers Keycloak (page username/MdP).
 */
export function redirectToGatewayLogin() {
  window.location.href = `${env.apiGatewayUrl}/auth/login`;
}

// ── Login social ───────────────────────────────────────────────

/**
 * Login Google via Keycloak Identity Provider.
 * Le gateway ajoute kc_idp_hint=google → Keycloak shunte sa page de
 * login et envoie l'utilisateur direct chez Google.
 */
export function redirectToGoogleLogin() {
  window.location.href = `${env.apiGatewayUrl}/auth/login/google`;
}

/**
 * Login GitHub via Keycloak Identity Provider.
 */
export function redirectToGitHubLogin() {
  window.location.href = `${env.apiGatewayUrl}/auth/login/github`;
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

// ── Forgot password ────────────────────────────────────────────

/**
 * Demande à Keycloak (via le gateway) d'envoyer un email de reset.
 * Réponse TOUJOURS 200 (anti-énumération).
 */
export async function requestPasswordReset(email) {
  const response = await guardedFetch(
    `${env.apiGatewayUrl}/auth/forgot-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include",
    }
  );
  const data = await safeJson(response);
  if (!response.ok) throw new Error(data?.message || "Erreur forgot password");
  return data;
}

// ── Refresh ────────────────────────────────────────────────────

export async function refreshAccessToken() {
  const response = await guardedFetch(`${env.apiGatewayUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  return response.ok;
}

// ── Logout COMPLET (kill session Keycloak) ─────────────────────

/**
 * Logout en 2 phases :
 *
 *   1. POST /auth/logout au gateway
 *      → le gateway révoque la session côté Keycloak (back-channel)
 *      → le gateway clear nos cookies maestro_*
 *      → le gateway renvoie logoutUrl = URL Keycloak end_session
 *
 *   2. window.location = logoutUrl
 *      → le navigateur visite Keycloak end_session
 *      → Keycloak clear ses cookies de session SSO côté navigateur
 *      → Keycloak redirige vers /auth/login (post_logout_redirect_uri)
 *
 * Sans la phase 2, l'utilisateur garde un cookie SSO Keycloak et un
 * re-login serait silencieux (auto-loggué). Avec la phase 2, l'utilisateur
 * est VRAIMENT déconnecté partout.
 */
export async function logout() {
  let logoutUrl = null;

  try {
    const response = await guardedFetch(`${env.apiGatewayUrl}/auth/logout`, {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (response.ok) {
      const data = await safeJson(response);
      logoutUrl = data?.logoutUrl || null;
    }
  } catch {
    // best effort — l'utilisateur veut sortir, on ne le bloque pas
  }

  // ─── Anti retour-arrière ──────────────────────────────────────
  // On vide l'historique de cette session de navigation autant
  // que possible. window.location.replace() ne crée pas de nouvelle
  // entrée dans l'historique (contrairement à .href = ...) :
  // une fois sur la landing page après logout, le bouton "back"
  // ne ramène plus sur les pages connectées.
  //
  // De plus, le backend envoie Cache-Control: no-store sur les
  // pages protégées, donc même si le navigateur tente de réafficher
  // une page depuis son cache via "back", elle sera re-fetchée et
  // le ProtectedRoute redirigera vers /auth/login.
  if (logoutUrl) {
    window.location.replace(logoutUrl);
  } else {
    // Fallback : on retourne au moins sur la landing
    window.location.replace("/");
  }
}

// ── Profile ────────────────────────────────────────────────────

export async function getMe(/* _legacyToken */) {
  const response = await guardedFetch(`${env.apiGatewayUrl}/auth/me`, {
    credentials: "include",
  });
  const data = await safeJson(response);
  if (!response.ok) throw new Error(data?.message || "Erreur /auth/me");
  return data;
}

// ── Backwards-compat shim ──────────────────────────────────────

export async function exchangeCode() {
  return {};
}
