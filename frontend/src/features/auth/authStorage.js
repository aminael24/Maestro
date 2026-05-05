// ═══════════════════════════════════════════════════════════════
//  authStorage – DEPRECATED.
//
//  Tokens are now held only in HttpOnly cookies managed by the
//  ApiGateway. The frontend has no token to keep, so every helper
//  in this module is a no-op. The exports remain only to avoid
//  breaking older imports during the migration; new code should
//  not import from this file.
// ═══════════════════════════════════════════════════════════════

export function saveTokens(/* { accessToken, idToken, expiresIn } */) {
  // Intentional no-op: tokens live in HttpOnly cookies set by /auth/callback.
}

export function getAccessToken() {
  // The token is in an HttpOnly cookie — the browser cannot read it.
  // Code that used to call this should be reworked to either:
  //   * rely on `credentials: "include"` on fetch/axios calls, or
  //   * call /auth/me to verify the session is still alive.
  return null;
}

export function getIdToken() {
  return null;
}

export function getTimeUntilExpiry() {
  return 0;
}

export function clearTokens() {
  // No-op. Use POST /auth/logout to clear cookies on the gateway.
}
