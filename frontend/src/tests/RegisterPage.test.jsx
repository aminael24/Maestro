/**
 * RegisterPage.test.jsx
 * Tests Jest + React Testing Library pour la page Register.
 */

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
jest.mock("../utils/apiGuard", () => ({
  guardedFetch: () => Promise.resolve({ ok: true, text: async () => "{}" }),
}));

// Mock authService : on intercepte registerUser
const mockRegisterUser = jest.fn();
jest.mock("../services/authService", () => ({
  registerUser: (...a) => mockRegisterUser(...a),
}));

// Mock redirectToKeycloakLogin
const mockRedirect = jest.fn();
jest.mock("../features/auth/authHelpers", () => ({
  redirectToKeycloakLogin: () => mockRedirect(),
}));

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import React from "react";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import RegisterPage from "../pages/Auth/RegisterPage";

function renderRegister() {
  return render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>,
  );
}

function fillForm({
  firstName = "Ahmed",
  lastName = "El Fassi",
  username = "ahmedf",
  email = "ahmed@maestro.dev",
  password = "S3cret123!",
} = {}) {
  fireEvent.change(screen.getByLabelText(/Prénom/i), {
    target: { value: firstName, name: "firstName" },
  });
  fireEvent.change(screen.getByLabelText(/^Nom$/i), {
    target: { value: lastName, name: "lastName" },
  });
  fireEvent.change(screen.getByLabelText(/utilisateur/i), {
    target: { value: username, name: "username" },
  });
  fireEvent.change(screen.getByLabelText(/Email/i), {
    target: { value: email, name: "email" },
  });
  fireEvent.change(screen.getByLabelText(/Mot de passe/i), {
    target: { value: password, name: "password" },
  });
}

// Helper qui wrappe le submit dans act() pour absorber les setState async
async function submitForm() {
  const form = screen
    .getByRole("button", { name: /Créer le compte/i })
    .closest("form");
  await act(async () => {
    fireEvent.submit(form);
  });
}

describe("RegisterPage", () => {
  beforeEach(() => {
    mockRegisterUser.mockReset();
    mockRedirect.mockClear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    // Nettoie les fake timers laissés en suspens par certains tests
    // (sinon un setTimeout planifié dans un test précédent peut firer
    // pendant le test suivant et polluer les mocks).
    if (jest.isMockFunction(setTimeout)) {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
    cleanup();
  });

  it("affiche tous les champs obligatoires", () => {
    renderRegister();
    expect(screen.getByLabelText(/Prénom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nom$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Créer le compte/i }),
    ).toBeInTheDocument();
  });

  it('le clic sur "Connexion" déclenche la redirection vers Keycloak', () => {
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: /^Connexion$/i }));
    expect(mockRedirect).toHaveBeenCalledTimes(1);
  });

  it("submit appelle registerUser avec un FormData complet", async () => {
    mockRegisterUser.mockResolvedValue({ message: "ok" });
    renderRegister();

    fillForm();
    await submitForm();

    await waitFor(() => expect(mockRegisterUser).toHaveBeenCalledTimes(1));
    const formData = mockRegisterUser.mock.calls[0][0];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("username")).toBe("ahmedf");
    expect(formData.get("email")).toBe("ahmed@maestro.dev");
    expect(formData.get("password")).toBe("S3cret123!");
    expect(formData.get("firstName")).toBe("Ahmed");
    expect(formData.get("lastName")).toBe("El Fassi");
  });

it("après succès, redirige vers /workspace/dashboard", async () => {
    mockRegisterUser.mockResolvedValue({ message: "ok" });
    renderRegister();
    fillForm();
    await submitForm();

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/workspace/dashboard"),
    );
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("affiche le message d'erreur si registerUser throw", async () => {
    mockRegisterUser.mockRejectedValue(new Error("Email déjà pris"));
    renderRegister();
    fillForm();
    await submitForm();

    await waitFor(() =>
      expect(screen.getByText(/Email déjà pris/i)).toBeInTheDocument(),
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("le bouton submit passe à 'Création en cours' pendant l'appel", async () => {
    let resolveRegister;
    mockRegisterUser.mockImplementation(
      () => new Promise((res) => (resolveRegister = res)),
    );
    renderRegister();
    fillForm();

    const form = screen
      .getByRole("button", { name: /Créer le compte/i })
      .closest("form");
    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Création en cours/i }),
      ).toBeDisabled(),
    );

    await act(async () => {
      resolveRegister({ message: "ok" });
    });
  });
});