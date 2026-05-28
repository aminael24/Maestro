/** @vitest-environment jsdom */
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useAiStore } from "../../store/useAiStore";
import Terminal from "../../components/Workspace/Terminal";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);

// ─── Mock useAiStore ───────────────────────────────────────────────────────────

vi.mock("../../store/useAiStore", () => ({
  useAiStore: vi.fn(),
}));

// ─── Mock global fetch ─────────────────────────────────────────────────────────

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ─── Mock scrollIntoView (non supporté par jsdom) ──────────────────────────────

window.HTMLElement.prototype.scrollIntoView = vi.fn();

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Terminal", () => {
  beforeEach(() => {
    useAiStore.mockReturnValue({ files: {} });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // 1. Affichage initial
  it("affiche le placeholder quand aucun log n'est présent", () => {
    render(<Terminal projectId="proj-1" />);

    expect(
      screen.getByText(/Cliquez sur "Exécuter" pour lancer le projet généré/i),
    ).toBeInTheDocument();
  });

  // 2. Header visible
  it("affiche le header du terminal avec le titre", () => {
    render(<Terminal projectId="proj-1" />);

    expect(screen.getByText(/Terminal — Runner Service/i)).toBeInTheDocument();
  });

  // 3. Bouton Exécuter présent et actif
  it("affiche le bouton Exécuter et il est actif au montage", () => {
    render(<Terminal projectId="proj-1" />);

    const btn = screen.getByRole("button", { name: /Exécuter/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  // 4. Erreur si aucun code généré
  it("affiche une erreur si on clique Exécuter sans code généré", async () => {
    render(<Terminal projectId="proj-1" />);

    fireEvent.click(screen.getByRole("button", { name: /Exécuter/i }));

    expect(await screen.findByText(/Aucun code généré/i)).toBeInTheDocument();
  });

  // 5. Erreur de connexion au Runner Service
  it("affiche une erreur si le Runner Service est injoignable", async () => {
    useAiStore.mockReturnValue({
      files: {
        model: "const x = 1; // code suffisamment long pour passer le check",
      },
    });

    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    render(<Terminal projectId="proj-1" />);
    fireEvent.click(screen.getByRole("button", { name: /Exécuter/i }));

    expect(
      await screen.findByText(/Erreur de connexion au Runner Service/i),
    ).toBeInTheDocument();
  });

  // 6. Le bouton passe en "Exécution..." pendant le fetch
  it('désactive le bouton et affiche "Exécution..." pendant le fetch', async () => {
    useAiStore.mockReturnValue({
      files: {
        model: "const x = 1; // code suffisamment long pour passer le check",
      },
    });

    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    render(<Terminal projectId="proj-1" />);
    fireEvent.click(screen.getByRole("button", { name: /Exécuter/i }));

    const btn = await screen.findByRole("button", { name: /Exécution/i });
    expect(btn).toBeDisabled();
  });

  // 7. Le log de connexion apparaît au lancement
  it("affiche le log de connexion au Runner Service au démarrage", async () => {
    useAiStore.mockReturnValue({
      files: {
        model: "const x = 1; // code suffisamment long pour passer le check",
      },
    });

    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    render(<Terminal projectId="proj-1" />);
    fireEvent.click(screen.getByRole("button", { name: /Exécuter/i }));

    expect(
      await screen.findByText(/Connexion au Runner Service/i),
    ).toBeInTheDocument();
  });

  // 8. Les URLs backend/frontend ne sont pas visibles au montage
  it("n'affiche pas les URLs backend/frontend au montage", () => {
    render(<Terminal projectId="proj-1" />);

    expect(screen.queryByText(/Backend:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Frontend:/i)).not.toBeInTheDocument();
  });
});
