// cypress/e2e/register.cy.js
//
// E2E : page de création de compte.

describe("Register page", () => {
  beforeEach(() => {
    cy.visit("/auth/register", { timeout: 30000 });
  });

  it("affiche le formulaire complet", () => {
    cy.contains("h1", "Maestro").should("be.visible");
    cy.get("input#firstName").should("exist");
    cy.get("input#lastName").should("exist");
    cy.get("input#username").should("exist");
    cy.get("input#email").should("exist");
    cy.get("input#password").should("exist");
    cy.contains("button", /Créer le compte/i).should("be.visible");
  });

  it("la validation HTML empêche le submit si un champ est vide", () => {
    cy.contains("button", /Créer le compte/i).click();
    cy.location("pathname").should("eq", "/auth/register");
  });

  it("submit valide envoie une requête POST /auth/register", () => {
    cy.stubRegister({ message: "Compte créé", id: 42 }, 200);

    cy.get("input#firstName").type("Ahmed");
    cy.get("input#lastName").type("El Fassi");
    cy.get("input#username").type("ahmedf");
    cy.get("input#email").type("ahmed@maestro.dev");
    cy.get("input#password").type("S3cret123!");
    cy.contains("button", /Créer le compte/i).click();

    cy.wait("@register").its("request.method").should("eq", "POST");

    cy.contains(/Compte créé avec succès/i).should("be.visible");

    cy.location("pathname", { timeout: 4000 }).should("eq", "/auth/login");
  });

  it("affiche le message d'erreur si le backend renvoie 400", () => {
    cy.stubRegister({ message: "Email déjà utilisé" }, 400);

    cy.get("input#firstName").type("Ahmed");
    cy.get("input#lastName").type("El Fassi");
    cy.get("input#username").type("ahmedf");
    cy.get("input#email").type("duplicate@maestro.dev");
    cy.get("input#password").type("S3cret123!");
    cy.contains("button", /Créer le compte/i).click();

    cy.wait("@register");
    cy.contains(/Email déjà utilisé/i).should("be.visible");
    cy.location("pathname").should("eq", "/auth/register");
  });

  it('le lien "Retour à l\'accueil" ramène sur /', () => {
    cy.contains(/Retour à l'accueil/i).click();
    cy.location("pathname").should("eq", "/");
  });
});