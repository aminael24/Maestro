/**
 * jest.config.cjs
 * Configuration Jest pour le projet Maestro frontend (React 19 + Vite)
 *
 * Placement : frontend/jest.config.cjs
 */
module.exports = {
  testEnvironment: "jsdom",

  // Transforme JSX / TSX / ESM avec babel-jest
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },

  // Bypasse certains modules ESM-only (react-router, framer-motion, lucide)
  transformIgnorePatterns: [
    "/node_modules/(?!(react-router-dom|react-router|@remix-run|framer-motion|lucide-react)/)",
  ],

  // Mappage des assets statiques et CSS vers des stubs
  moduleNameMapper: {
    "\\.(png|jpg|jpeg|gif|svg|webp)$": "<rootDir>/src/__mocks__/fileMock.js",
    "\\.(css|less|scss)$": "<rootDir>/src/__mocks__/styleMock.js",
  },

  // Setup avant le test framework (polyfills bas niveau)
  setupFiles: ["<rootDir>/src/setupGlobals.cjs"],
  // Setup après que jsdom soit prêt (jest-dom matchers, etc.)
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],

  roots: ["<rootDir>/src"],

  testMatch: [
    "**/__tests__/**/*.{js,jsx,ts,tsx}",
    "**/?(*.)+(spec|test).{js,jsx,ts,tsx}",
  ],

  testPathIgnorePatterns: ["/node_modules/", "/cypress/"],
};
