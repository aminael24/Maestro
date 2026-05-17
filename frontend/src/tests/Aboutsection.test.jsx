/**
 * Aboutsection.test.jsx
 * Vérifie le rendu des 6 services Maestro RÉELS et le bouton Commencer.
 */

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AboutSection from "../components/landing/Aboutsection";

function renderAbout() {
  return render(
    <BrowserRouter>
      <AboutSection />
    </BrowserRouter>,
  );
}

describe("Aboutsection — 6 services Maestro réels", () => {
  beforeEach(() => mockNavigate.mockClear());
  afterEach(cleanup);

  it("rend les 6 services Maestro", () => {
    renderAbout();
    expect(screen.getByText("ApiGateway")).toBeInTheDocument();
    expect(screen.getByText("Auth OIDC")).toBeInTheDocument();
    expect(screen.getByText("WorkspaceService")).toBeInTheDocument();
    expect(screen.getByText("Sécurité tokens")).toBeInTheDocument();
    expect(screen.getByText("AIService + RunnerService")).toBeInTheDocument();
    expect(screen.getByText("Infrastructure Docker")).toBeInTheDocument();
  });

  it("affiche le badge '6 SERVICES MAESTRO'", () => {
    renderAbout();
    expect(screen.getByText(/6 SERVICES MAESTRO/i)).toBeInTheDocument();
  });

  it('au moins un bouton "Commencer" est rendu', () => {
    renderAbout();
    const buttons = screen.getAllByRole("button", { name: /Commencer/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('le clic sur "Commencer" route vers /auth/register', () => {
    renderAbout();
    const buttons = screen.getAllByRole("button", { name: /Commencer/i });
    fireEvent.click(buttons[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/auth/register");
  });
});
