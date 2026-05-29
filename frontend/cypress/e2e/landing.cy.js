// cypress/e2e/landing.cy.js
//
// E2E : page d'accueil Maestro.
// On stubbe /auth/me en 401 pour que le router affiche bien la LandingPage
// (sinon LandingOrRedirect renvoie sur /workspace/dashboard).

describe("Landing page", () => {
  beforeEach(() => {
    cy.stubAuthAnonymous();
    cy.visit("/");
    cy.wait("@authMe401", { timeout: 10000 });
  });

  it("affiche la navbar avec logo + boutons CTA", () => {
    cy.get('[data-testid="landing-navbar"]').should("be.visible");
    cy.get('[data-testid="logo-link"]').should("be.visible");
    cy.get('[data-testid="nav-register-btn"]').should(
      "contain.text",
      "Créer un compte",
    );
    cy.get('[data-testid="nav-login-btn"]').should(
      "contain.text",
      "Se connecter",
    );
  });


  it("le bouton Découvrir scrolle vers la section features", () => {
    cy.get('[data-testid="hero-discover-btn"]').click();
    // Après scroll, la section #features doit être proche du top du viewport
    cy.get("#features").should("be.visible");
    cy.window().then((win) => {
      expect(win.scrollY).to.be.greaterThan(100);
    });
  });

  it("le scroll applique la classe 'scrolled' à la navbar", () => {
    cy.get('[data-testid="landing-navbar"]').should("have.class", "top");
    cy.scrollTo(0, 600);
    cy.get('[data-testid="landing-navbar"]', { timeout: 4000 }).should(
      "have.class",
      "scrolled",
    );
    cy.get('[data-testid="landing-navbar"]').should(
      "have.attr",
      "data-scrolled",
      "true",
    );
  });

  it('clic sur "Créer un compte" (navbar) → /auth/register', () => {
    cy.get('[data-testid="nav-register-btn"]').click();
    cy.location("pathname").should("eq", "/auth/register");
  });

 

  it("la section À propos liste les 6 services Maestro réels", () => {
    cy.contains("ApiGateway").should("exist");
    cy.contains("Auth OIDC").should("exist");
    cy.contains("WorkspaceService").should("exist");
    cy.contains("Sécurité tokens").should("exist");
    cy.contains("AIService + RunnerService").should("exist");
    cy.contains("Infrastructure Docker").should("exist");
  });

  it("la section Fonctionnalités contient les 4 slides Maestro réelles", () => {
    cy.contains("ApiGateway & Auth OIDC Keycloak").should("exist");
    cy.contains("WorkspaceService + Monaco Editor").should("exist");
    cy.contains("AIService LLaMA 3.1 + RunnerService Docker").should("exist");
    cy.contains("Infrastructure Docker Compose + Kafka").should("exist");
  });
});
