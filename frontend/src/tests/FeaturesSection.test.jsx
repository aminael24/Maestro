/**
 * FeaturesSection.test.jsx
 * Vérifie que les 4 slides Maestro RÉELLES sont rendues.
 */

// Mock GSAP et ses plugins qui n'aiment pas jsdom
jest.mock("gsap", () => {
  const fn = jest.fn();
  return {
    __esModule: true,
    default: {
      registerPlugin: fn,
      set: fn,
      to: jest.fn(() => ({ scrollTrigger: null })),
    },
    registerPlugin: fn,
    set: fn,
    to: jest.fn(() => ({ scrollTrigger: null })),
  };
});
jest.mock("gsap/ScrollTrigger", () => ({
  __esModule: true,
  default: { create: jest.fn(), refresh: jest.fn() },
}));
jest.mock("@gsap/react", () => ({
  useGSAP: (fn) => {
    // n'exécute pas le hook GSAP en test
  },
}));

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import FeaturesSection from "../components/landing/FeaturesSection";

describe("FeaturesSection — 4 slides Maestro réelles", () => {
  afterEach(cleanup);

  it("rend exactement 4 sections (aria-label)", () => {
    render(<FeaturesSection />);
    const slides = document.querySelectorAll("[data-flow-section]");
    expect(slides.length).toBe(4);
  });

  it("slide 01 mentionne ApiGateway & Auth OIDC Keycloak", () => {
    render(<FeaturesSection />);
    expect(
      screen.getByLabelText(/ApiGateway & Auth OIDC Keycloak/i),
    ).toBeInTheDocument();
  });

  it("slide 02 mentionne WorkspaceService + Monaco Editor", () => {
    render(<FeaturesSection />);
    expect(
      screen.getByLabelText(/WorkspaceService \+ Monaco Editor/i),
    ).toBeInTheDocument();
  });

  it("slide 03 mentionne AIService LLaMA 3.1 + RunnerService Docker", () => {
    render(<FeaturesSection />);
    expect(
      screen.getByLabelText(
        /AIService LLaMA 3\.1 \+ RunnerService Docker/i,
      ),
    ).toBeInTheDocument();
  });

  it("slide 04 mentionne Infrastructure Docker Compose + Kafka", () => {
    render(<FeaturesSection />);
    expect(
      screen.getByLabelText(/Infrastructure Docker Compose \+ Kafka/i),
    ).toBeInTheDocument();
  });

  it("affiche les stats clés des slides (Authorization Code, Monaco, etc.)", () => {
    render(<FeaturesSection />);
    // "Authorization Code" présent dans la slide 01 (stats label)
    expect(screen.getAllByText(/Authorization Code/i).length).toBeGreaterThan(0);
    // "Éditeur intégré" dans la slide 02
    expect(screen.getAllByText(/Éditeur intégré/i).length).toBeGreaterThan(0);
    // "LLaMA version" dans la slide 03
    expect(screen.getAllByText(/LLaMA version/i).length).toBeGreaterThan(0);
    // "Event bus" dans la slide 04
    expect(screen.getAllByText(/Event bus/i).length).toBeGreaterThan(0);
  });
});
