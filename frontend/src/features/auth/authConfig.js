import { env } from "../../utils/env";

export const authConfig = {
  keycloakUrl: env.keycloakUrl,
  realm: env.keycloakRealm,
  clientId: env.keycloakClientId,
  redirectUri: `${env.frontendUrl}/auth/callback`,
  scope: "openid profile email",
};
