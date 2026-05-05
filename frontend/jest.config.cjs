/**
 * jest.config.cjs
 * Configuration Jest pour un projet React / Vite
 *
 * Placement : frontend/jest.config.cjs
 */
module.exports = {
  testEnvironment: "jsdom",

  // Transforme JSX / ESM avec babel-jest
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // Transforme les fichiers dans node_modules qui sont ESM-only
  transformIgnorePatterns: [
    "/node_modules/(?!(react-router-dom|react-router|@remix-run)/)",
  ],

  // Alias pour import.meta.env (géré via le mock de env.js)
  moduleNameMapper: {
    // Assets statiques → stub
    "\\.(png|jpg|jpeg|gif|svg|webp)$": "<rootDir>/src/__mocks__/fileMock.js",
    "\\.(css|less|scss)$": "<rootDir>/src/__mocks__/styleMock.js",
  },

  // Setup après l'environnement jsdom
  setupFilesAfterSetup: ["<rootDir>/src/setupTests.js"],

  // Racine des tests
  roots: ["<rootDir>/src"],
};
