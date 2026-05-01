// ═══════════════════════════════════════════════════════════════
//  Token storage – MEMORY + LOCALSTORAGE
//  Le refresh_token est dans un cookie HttpOnly côté backend.
//  The access_token is persisted to survive redirects/refreshes.
//  The id_token lives here in a JS variable.
// ═══════════════════════════════════════════════════════════════

let _accessToken = null;
let _idToken = null;
let _expiresIn = null;       // durée en secondes
let _obtainedAt = null;      // Date.now() au moment de la sauvegarde

export function saveTokens({ accessToken, idToken, expiresIn }) {
  _accessToken = accessToken ?? null;
  _idToken = idToken ?? null;
  _expiresIn = expiresIn ?? null;
  _obtainedAt = Date.now();

  localStorage.setItem('maestro_access_token', _accessToken || '');
  localStorage.setItem('maestro_id_token', _idToken || '');
  localStorage.setItem('maestro_expires_in', _expiresIn?.toString() || '0');
  localStorage.setItem('maestro_obtained_at', _obtainedAt.toString());
}

export function getAccessToken() {
  const token = _accessToken || localStorage.getItem('maestro_access_token');
  return token && token !== '' ? token : null;
}

export function getIdToken() {
  return _idToken;
}

/**
 * Retourne le nombre de millisecondes restantes avant expiration
 * de l'access_token (approximatif, basé sur expiresIn).
 * Retourne 0 si inconnu ou déjà expiré.
 */
export function getTimeUntilExpiry() {
  const exp = _expiresIn || parseInt(localStorage.getItem('maestro_expires_in') || '0');
  const obt = _obtainedAt || parseInt(localStorage.getItem('maestro_obtained_at') || '0');

  if (!exp || !obt) return 0;
  const elapsed = Date.now() - obt;
  const remaining = exp * 1000 - elapsed;
  return Math.max(0, remaining);
}

export function clearTokens() {
  _accessToken = null;
  _idToken = null;
  _expiresIn = null;
  _obtainedAt = null;
  localStorage.removeItem('maestro_access_token');
  localStorage.removeItem('maestro_id_token');
  localStorage.removeItem('maestro_expires_in');
  localStorage.removeItem('maestro_obtained_at');
}
