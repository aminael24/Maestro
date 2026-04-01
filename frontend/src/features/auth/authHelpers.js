import { authConfig } from "./authConfig";

// ── PKCE helpers ─────────────────────────────────────────────

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(buffer) {
  let str = "";
  for (const byte of buffer) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ── State helpers ─────────────────────────────────────────────

function generateState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// ── Storage ───────────────────────────────────────────────────
// IMPORTANT: localStorage (pas sessionStorage) pour survivre à la
// redirection Keycloak, qui peut réinitialiser le contexte de session.
const PKCE_KEY  = "pkce_code_verifier";
const STATE_KEY = "pkce_state";

// ── Public API ────────────────────────────────────────────────

function getAuthEndpoint() {
  return `${authConfig.keycloakUrl}/realms/${authConfig.realm}/protocol/openid-connect/auth`;
}

/**
 * Redirige vers Keycloak avec PKCE + state CSRF.
 * code_verifier stocké dans localStorage pour survivre à la redirection.
 */
export async function redirectToKeycloakLogin() {
  const codeVerifier  = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state         = generateState();

  // localStorage survit à la redirection Keycloak (contrairement à sessionStorage)
  localStorage.setItem(PKCE_KEY,  codeVerifier);
  localStorage.setItem(STATE_KEY, state);

  const url = new URL(getAuthEndpoint());
  url.searchParams.set("client_id",             authConfig.clientId);
  url.searchParams.set("redirect_uri",          authConfig.redirectUri);
  url.searchParams.set("response_type",         "code");
  url.searchParams.set("scope",                 authConfig.scope);
  url.searchParams.set("code_challenge",        codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state",                 state);

  window.location.href = url.toString();
}

/** Récupère le code_verifier stocké lors du login. */
export function getStoredCodeVerifier() {
  return localStorage.getItem(PKCE_KEY);
}

/** Récupère le state pour validation CSRF. */
export function getStoredState() {
  return localStorage.getItem(STATE_KEY);
}

/** Nettoie les données PKCE après échange réussi (ou en cas d'erreur). */
export function clearPkceData() {
  localStorage.removeItem(PKCE_KEY);
  localStorage.removeItem(STATE_KEY);
}
