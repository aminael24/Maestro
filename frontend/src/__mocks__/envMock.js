// Mock du module utils/env.js pour Jest (pas d'import.meta.env en jest/CJS)
module.exports = {
  env: {
    mode: "dev",
    keycloakUrl: "http://localhost:8080",
    keycloakRealm: "maestro",
    keycloakClientId: "maestro-frontend",
    frontendUrl: "http://localhost:5173",
    apiGatewayUrl: "http://localhost:5000",
  },
  isDevMode: true,
  isIntegratedMode: false,
  assertEnv: () => {},
};
