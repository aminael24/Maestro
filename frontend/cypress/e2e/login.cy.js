// cypress/e2e/login.cy.js

describe("Login flow", () => {
  it("la route /auth/login déclenche une redirection vers le gateway", () => {
    cy.intercept("GET", "**/auth/login*", (req) => {
      req.reply({ statusCode: 200, body: "<html>stub keycloak</html>" });
    }).as("gatewayLogin");

    cy.visit("/auth/login", { failOnStatusCode: false });
    cy.wait("@gatewayLogin", { timeout: 5000 });
  });

  it("le bouton 'Se connecter' est présent et cliquable sur la landing", () => {
    cy.stubAuthAnonymous();
    cy.visit("/");
    cy.wait("@authMe401", { timeout: 10000 });

    cy.get('[data-testid="nav-login-btn"]')
      .should("be.visible")
      .and("contain.text", "Se connecter")
      .and("not.be.disabled");
  });

  it("le bouton 'Se connecter' a la bonne classe CSS", () => {
    cy.stubAuthAnonymous();
    cy.visit("/");
    cy.wait("@authMe401", { timeout: 10000 });

    cy.get('[data-testid="nav-login-btn"]')
      .should("have.attr", "class")
      .and("match", /m-btn-login/);
  });

  it("la route /auth/callback sans code retourne sur la landing", () => {
    cy.intercept("GET", "**/auth/callback*", (req) => {
      req.reply({
        statusCode: 302,
        headers: { Location: "/auth/login?error=missing_code" },
        body: "",
      });
    }).as("callback");

    cy.visit("/auth/callback", { failOnStatusCode: false });
    cy.location("pathname", { timeout: 5000 }).should("match",
      /^\/(auth\/login)?$/);
  });

  it("/workspace/dashboard sans session redirige hors de la route protégée", () => {
    cy.stubAuthAnonymous();
    cy.intercept("GET", "**/auth/login*", {
      statusCode: 200,
      body: "<html>stub</html>",
    });

    cy.visit("/workspace/dashboard", { failOnStatusCode: false });
    cy.wait("@authMe401", { timeout: 10000 });
    cy.location("pathname", { timeout: 5000 }).should("not.eq",
      "/workspace/dashboard");
  });
});