// cypress/support/e2e.js
// Ce fichier est chargé automatiquement avant chaque test e2e.

import "./commands";

// Évite que les erreurs JS non liées au flow de test fassent fail Cypress
// (ex : erreurs de GSAP/framer-motion en environnement de test).
Cypress.on("uncaught:exception", () => false);
