/**
 * api.js
 *
 * Axios instance utilisée pour tous les appels au backend Maestro.
 *
 * Différences importantes vs. la version précédente :
 *   - Plus de récupération d'access_token depuis localStorage / mémoire :
 *     les tokens vivent dans des cookies HttpOnly gérés par l'ApiGateway.
 *   - `withCredentials: true` → le navigateur envoie automatiquement le
 *     cookie `maestro_access_token` sur chaque requête.
 *   - Sur 401 on tente un /auth/refresh une seule fois ; si ça échoue,
 *     on redirige vers /auth/login (la session est morte).
 */

import axios from 'axios';
import { isDevMode } from '../utils/env';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_GATEWAY_URL ||
  'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // ← envoie les cookies HttpOnly maestro_*
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Intercepteur dev-mode ────────────────────────────────────
// En mode dev (mode === "dev"), on ne veut pas qu'un appel API
// parte par accident vers le backend (qui n'est peut-être pas lancé).
api.interceptors.request.use((config) => {
  if (isDevMode) {
    throw new Error(
      `[DEV MODE] API call blocked: ${config.method?.toUpperCase() || 'GET'} ${config.url}`
    );
  }
  return config;
});

// ── Intercepteur 401 → refresh once ──────────────────────────
// Si le serveur renvoie 401, on essaie une fois /auth/refresh.
// Si le refresh marche, on rejoue la requête originale.
// Sinon, on redirige vers la page de login.
let refreshPromise = null;

async function tryRefresh() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = axios
    .post(`${API_BASE_URL}/auth/refresh`, null, { withCredentials: true })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      // Ne pas tenter de refresh sur /auth/refresh lui-même
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      original._retried = true;
      const ok = await tryRefresh();
      if (ok) return api.request(original);

      // Session morte → on renvoie l'utilisateur sur /auth/login.
      // (Évité en mode dev pour ne pas casser les tests.)
      if (!isDevMode && typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Helpers d'erreur (inchangés) ─────────────────────────────
export const apiUtils = {
  handleError: (error) => {
    if (error.response) {
      if (error.response.status === 404)
        throw new Error('The Project Service is currently unavailable. Please try again later.');
      if (error.response.status === 401)
        throw new Error('Session expired. Please log out and log in again to continue.');

      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        `Erreur ${error.response.status}: ${error.response.statusText}`;
      throw new Error(message);
    } else if (error.request) {
      throw new Error('Network connection error');
    } else {
      throw new Error(error.message || 'Unknown error');
    }
  },
};
