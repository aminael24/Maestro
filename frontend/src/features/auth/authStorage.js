// ═══════════════════════════════════════════════════════════════
//  Token storage – EN MÉMOIRE UNIQUEMENT
//  Le refresh_token est dans un cookie HttpOnly côté backend.
//  L'access_token et l'id_token vivent ici, en variable JS.
//  Un rechargement de page les perd → le frontend appelle /auth/refresh.
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
}

export function getAccessToken() {
  return _accessToken;
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
  if (!_expiresIn || !_obtainedAt) return 0;
  const elapsed = Date.now() - _obtainedAt;
  const remaining = _expiresIn * 1000 - elapsed;
  return Math.max(0, remaining);
}

export function clearTokens() {
  _accessToken = null;
  _idToken = null;
  _expiresIn = null;
  _obtainedAt = null;
}
