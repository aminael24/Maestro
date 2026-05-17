// cypress/support/commands.js
// Commandes Cypress custom pour le projet Maestro.

/**
 * Stubbe les appels /auth/me du frontend pour qu'ils renvoient 401
 * (utilisateur non connecté). Permet à la LandingPage / route guard
 * de fonctionner en e2e sans backend.
 */
Cypress.Commands.add("stubAuthAnonymous", () => {
  cy.intercept("GET", "**/auth/me", { statusCode: 401, body: {} }).as(
    "authMe401",
  );
});

/**
 * Stubbe /auth/register avec une réponse paramétrable.
 */
Cypress.Commands.add("stubRegister", (response = {}, statusCode = 200) => {
  cy.intercept("POST", "**/auth/register", {
    statusCode,
    body: response,
  }).as("register");
});

/**
 * Stubbe /auth/login pour ne pas vraiment rediriger vers Keycloak
 * pendant un test e2e (qui n'a pas la stack docker complète).
 */
Cypress.Commands.add("stubLoginRedirect", () => {
  cy.intercept("GET", "**/auth/login*", {
    statusCode: 302,
    headers: { Location: "/_stubbed_keycloak" },
  }).as("loginRedirect");
});
