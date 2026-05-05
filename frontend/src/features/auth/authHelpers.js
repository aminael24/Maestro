// ═══════════════════════════════════════════════════════════════
//  authHelpers – DEPRECATED.
//
//  PKCE is no longer performed in the frontend. The login flow is
//  initiated by simply redirecting the browser to the gateway's
//  /auth/login endpoint; the gateway handles state, the redirect to
//  Keycloak, the code exchange and the cookie set-up.
//
//  This file remains as a thin shim so existing imports keep
//  compiling during the migration. Use `redirectToGatewayLogin`
//  from `services/authService` in new code.
// ═══════════════════════════════════════════════════════════════

import { env } from "../../utils/env";

/**
 * Redirects the browser to the gateway's /auth/login endpoint.
 * The gateway then redirects to Keycloak.
 *
 * No PKCE, no localStorage, no state generation in the frontend.
 */
export function redirectToKeycloakLogin() {
  window.location.href = `${env.apiGatewayUrl}/auth/login`;
}

// ── No-ops kept for backwards compatibility ─────────────────────
export function getStoredCodeVerifier() {
  return null;
}

export function getStoredState() {
  return null;
}

export function clearPkceData() {
  // No-op: nothing to clean, the frontend never stored PKCE data.
}
