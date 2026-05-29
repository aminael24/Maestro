/**
 * authService.test.js
 * Tests unitaires Jest pour les fonctions du service d'authentification.
 *
 * Couvre :
 *  - redirectToGatewayLogin → window.location.href
 *  - redirectToGoogleLogin / redirectToGitHubLogin
 *  - registerUser : succès, erreur HTTP, body non-JSON
 *  - requestPasswordReset
 */

// ── Mocks ──────────────────────────────────────────────────────
// Mock du module env utilisé par authService (Vite import.meta.env).
jest.mock("../utils/env", () => ({
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
}));

// Mock de apiGuard.guardedFetch → simple fetch (en dev, le vrai bloque).
jest.mock("../utils/apiGuard", () => ({
  guardedFetch: (...args) => global.fetch(...args),
}));

import {
  redirectToGatewayLogin,
  redirectToGoogleLogin,
  redirectToGitHubLogin,
  registerUser,
  requestPasswordReset,
} from "../services/authService";

// Helpers de mock fetch
function mockFetchOk(body = {}, status = 200) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  });
}
function mockFetchEmpty(status = 200) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(""),
  });
}
function mockFetchError(message = "boom", status = 400) {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    text: jest.fn().mockResolvedValue(JSON.stringify({ message })),
  });
}

describe("authService — redirections", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // On stubbe window.location pour pouvoir lire .href après set.
    delete window.location;
    window.location = { href: "" };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  it("redirectToGatewayLogin pointe vers /auth/login du gateway", () => {
    redirectToGatewayLogin();
    expect(window.location.href).toBe("http://localhost:5000/auth/login");
  });

  it("redirectToGoogleLogin pointe vers /auth/login/google", () => {
    redirectToGoogleLogin();
    expect(window.location.href).toBe(
      "http://localhost:5000/auth/login/google",
    );
  });

  it("redirectToGitHubLogin pointe vers /auth/login/github", () => {
    redirectToGitHubLogin();
    expect(window.location.href).toBe(
      "http://localhost:5000/auth/login/github",
    );
  });
});

describe("authService — registerUser", () => {
  beforeEach(() => {
    global.fetch = mockFetchOk({ message: "Compte créé", id: 42 });
  });

  it("POST FormData vers /auth/register avec credentials include", async () => {
    const fd = new FormData();
    fd.append("username", "ahmed");
    fd.append("email", "ahmed@maestro.dev");
    fd.append("password", "S3cret!");
    fd.append("firstName", "Ahmed");
    fd.append("lastName", "El Fassi");

    const result = await registerUser(fd);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://localhost:5000/auth/register");
    expect(opts.method).toBe("POST");
    expect(opts.credentials).toBe("include");
    expect(opts.body).toBe(fd);
    expect(result).toEqual({ message: "Compte créé", id: 42 });
  });

  it("throw avec le message backend si status non-2xx", async () => {
    global.fetch = mockFetchError("Email déjà utilisé", 409);
    await expect(registerUser(new FormData())).rejects.toThrow(
      /Email déjà utilisé/,
    );
  });

  it("body vide est traité comme objet vide (pas de throw)", async () => {
    global.fetch = mockFetchEmpty(200);
    const result = await registerUser(new FormData());
    expect(result).toEqual({});
  });

  it("body non-JSON sur réponse OK lève une erreur explicite", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("<html>oops</html>"),
    });
    await expect(registerUser(new FormData())).rejects.toThrow(/non-JSON/);
  });
});

describe("authService — requestPasswordReset", () => {
  beforeEach(() => {
    global.fetch = mockFetchOk({ message: "Si l'email existe..." });
  });

  it("POST JSON {email} vers /auth/forgot-password", async () => {
    await requestPasswordReset("user@maestro.dev");

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://localhost:5000/auth/forgot-password");
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opts.body)).toEqual({ email: "user@maestro.dev" });
    expect(opts.credentials).toBe("include");
  });

  it("throw si le serveur renvoie 500", async () => {
    global.fetch = mockFetchError("Internal", 500);
    await expect(requestPasswordReset("x@y.z")).rejects.toThrow(/Internal/);
  });
});
