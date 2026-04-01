export const env = {
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL,
  keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM,
  keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  frontendUrl: import.meta.env.VITE_FRONTEND_URL,
  apiGatewayUrl: import.meta.env.VITE_API_GATEWAY_URL,
};

export function assertEnv() {
  const missing = [];

  if (!env.keycloakUrl) missing.push("VITE_KEYCLOAK_URL");
  if (!env.keycloakRealm) missing.push("VITE_KEYCLOAK_REALM");
  if (!env.keycloakClientId) missing.push("VITE_KEYCLOAK_CLIENT_ID");
  if (!env.frontendUrl) missing.push("VITE_FRONTEND_URL");
  if (!env.apiGatewayUrl) missing.push("VITE_API_GATEWAY_URL");

  if (missing.length > 0) {
    throw new Error(`Variables manquantes: ${missing.join(", ")}`);
  }
}
