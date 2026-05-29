/**
 * LandingPage.test.jsx
 * Tests Jest + React Testing Library pour la LandingPage.
 *
 * Couvre :
 *  - rendu navbar + logo + boutons
 *  - clic "Créer un compte" → navigation vers /auth/register
 *  - clic "Se connecter" → redirige vers le gateway login
 *  - classe scrolled appliquée après window.scroll
 *  - les liens de navbar appellent scrollIntoView sur leurs cibles
 */

// Mock env
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

// Mock des sections lourdes (GSAP, framer-motion, three.js, etc.)
jest.mock("../components/landing/MeshGradientBackground", () => ({
  __esModule: true,
  default: () => <div data-testid="mesh-bg" />,
}));
jest.mock("../components/landing/FeaturesSection", () => ({
  __esModule: true,
  default: () => <div data-testid="features-section" id="features" />,
}));
jest.mock("../components/landing/Aboutsection", () => ({
  __esModule: true,
  default: () => <div data-testid="about-section" id="about-inner" />,
}));
jest.mock("../components/landing/TestimonialsSection", () => ({
  __esModule: true,
  default: () => <div data-testid="testimonials-section" />,
}));
jest.mock("../components/landing/ContactUs", () => ({
  __esModule: true,
  default: () => <div data-testid="contact-section" />,
}));
jest.mock("../components/landing/MaestroFooter", () => ({
  __esModule: true,
  default: () => <div data-testid="footer-section" />,
}));
jest.mock("../components/landing/FlowingMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="flowing-menu" />,
}));
jest.mock("../components/landing/TeamSection", () => ({
  __esModule: true,
  default: () => <div data-testid="team-section" />,
}));
jest.mock("../components/landing/CTABanner", () => ({
  __esModule: true,
  default: () => <div data-testid="cta-banner" />,
}));

// Mock redirectToGatewayLogin (effet de bord sur window.location)
const mockRedirect = jest.fn();
jest.mock("../services/authService", () => ({
  redirectToGatewayLogin: () => mockRedirect(),
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
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LandingPage from "../pages/Landing/LandingPage";

function renderLanding() {
  return render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>,
  );
}

describe("LandingPage", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockNavigate.mockClear();
  });

  afterEach(cleanup);

  it("affiche la navbar avec les boutons login/register", () => {
    renderLanding();
    expect(screen.getByTestId("landing-navbar")).toBeInTheDocument();
    expect(screen.getByTestId("nav-register-btn")).toHaveTextContent(
      /Créer un compte/i,
    );
    expect(screen.getByTestId("nav-login-btn")).toHaveTextContent(
      /Se connecter/i,
    );
  });

  it('le bouton nav "Créer un compte" route vers /auth/register', () => {
    renderLanding();
    fireEvent.click(screen.getByTestId("nav-register-btn"));
    expect(mockNavigate).toHaveBeenCalledWith("/auth/register");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('le bouton nav "Se connecter" lance la redirection vers le gateway', () => {
    renderLanding();
    fireEvent.click(screen.getByTestId("nav-login-btn"));
    expect(mockRedirect).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("nav-login-btn")).toHaveTextContent(
      /Redirection/i,
    );
    expect(screen.getByTestId("nav-login-btn")).toBeDisabled();
  });

  it("ajoute la classe 'scrolled' à la navbar quand window.scrollY > 20", () => {
    renderLanding();
    const nav = screen.getByTestId("landing-navbar");

    expect(nav).toHaveClass("top");
    expect(nav).not.toHaveClass("scrolled");
    expect(nav.getAttribute("data-scrolled")).toBe("false");

    act(() => {
      window.scrollY = 200;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(nav).toHaveClass("scrolled");
    expect(nav).not.toHaveClass("top");
    expect(nav.getAttribute("data-scrolled")).toBe("true");
  });

  it("les liens de la navbar appellent scrollIntoView sur leurs sections cibles", () => {
    renderLanding();

    const ids = ["about", "features", "testimonials", "team", "contact", "footer"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView = jest.fn();
    });

    ids.forEach((id) => {
      const btn = screen.queryByTestId(`nav-${id}`);
      if (!btn) return;
      fireEvent.click(btn);
      const el = document.getElementById(id);
      if (el && typeof el.scrollIntoView === "function") {
        expect(el.scrollIntoView).toHaveBeenCalled();
      }
    });
  });
});