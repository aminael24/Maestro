import { env } from "../utils/env";
import { saveTokens } from "../features/auth/authStorage";
import {
  getStoredCodeVerifier,
  getStoredState,
  clearPkceData,
} from "../features/auth/authHelpers";

// ── Helpers ────────────────────────────────────────────────

/** Lit le body de façon sécurisée – ne crash pas sur un body vide */
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

// ── Register ───────────────────────────────────────────────

export async function registerUser(formData) {
  const response = await fetch(`${env.apiGatewayUrl}/auth/register`, {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Erreur register");
  return data;
}

// ── OIDC Callback (échange code + PKCE) ────────────────────

export async function exchangeCode(code, returnedState) {
  const codeVerifier = getStoredCodeVerifier();
  const expectedState = getStoredState();

  if (expectedState && returnedState && expectedState !== returnedState) {
    clearPkceData();
    throw new Error("State CSRF invalide – tentative de rejeu détectée");
  }

  if (!codeVerifier) {
    throw new Error(
      "code_verifier introuvable. Relancez la connexion (le verifier PKCE a expiré)."
    );
  }

  const response = await fetch(`${env.apiGatewayUrl}/auth/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // ← reçoit le cookie HttpOnly refresh_token
    body: JSON.stringify({ code, codeVerifier }),
  });

  const data = await safeJson(response);
  clearPkceData();

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Erreur HTTP ${response.status}`
    );
  }

  // Le backend ne renvoie plus le refresh_token (il est dans le cookie)
  const accessToken = data.accessToken ?? data.AccessToken;
  const idToken = data.idToken ?? data.IdToken;
  const expiresIn = data.expiresIn ?? data.ExpiresIn;

  saveTokens({ accessToken, idToken, expiresIn });
  return { accessToken, idToken, expiresIn };
}

// ── Refresh (silencieux) ───────────────────────────────────

/**
 * Appelle POST /auth/refresh.
 * Le cookie HttpOnly contenant le refresh_token part automatiquement.
 * Retourne le nouvel accessToken ou lance une erreur si la session est morte.
 */
export async function refreshAccessToken() {
  const response = await fetch(`${env.apiGatewayUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include", // ← envoie le cookie HttpOnly
  });

  if (!response.ok) {
    throw new Error("Session expirée – reconnexion nécessaire");
  }

  const data = await safeJson(response);

  const accessToken = data.accessToken ?? data.AccessToken;
  const idToken = data.idToken ?? data.IdToken;
  const expiresIn = data.expiresIn ?? data.ExpiresIn;

  saveTokens({ accessToken, idToken, expiresIn });
  return { accessToken, idToken, expiresIn };
}

// ── Logout ─────────────────────────────────────────────────

/**
 * Supprime le cookie refresh_token côté backend.
 * Le frontend doit aussi appeler clearTokens() pour vider la mémoire.
 */
export async function logout() {
  try {
    await fetch(`${env.apiGatewayUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // best-effort : même si le backend est injoignable, on déconnecte côté client
  }
}

// ── Get user profile ───────────────────────────────────────

export async function getMe(accessToken) {
  const response = await fetch(`${env.apiGatewayUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await safeJson(response);
  if (!response.ok) throw new Error(data?.message || "Erreur /auth/me");
  return data;
}
