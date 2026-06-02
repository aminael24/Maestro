/** @vitest-environment jsdom */
import React from "react";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import ChatBox from "../../components/Workspace/ChatBox";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);

// ─── Mocks des dépendances externes ───────────────────────────────────────────

vi.mock("../../services/api", () => ({
  api: {
    put: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock("../../hooks/useAiAssistant", () => ({
  useAiAssistant: vi.fn(() => ({
    generateNewProject: vi.fn(() => Promise.resolve()),
    askModification: vi.fn(() =>
      Promise.resolve({
        explanation: "Fichier mis à jour.",
        updatedFile: "code...",
      }),
    ),
    isLoading: false,
    error: null,
  })),
}));

vi.mock("../../store/useAiStore", () => {
  const mockStore = {
    explanation: null,
    files: {},
    selectedCode: null,
    selectedFile: null,
    activeFile: "model",
    clearSelectedCode: vi.fn(),
  };
  const useAiStore = vi.fn(() => mockStore);
  useAiStore.getState = vi.fn(() => ({ files: {} }));
  return { useAiStore };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ChatBox", () => {
  afterEach(cleanup);
  beforeEach(() => localStorage.clear());

  // 1. Affichage initial
  it("affiche le message de bienvenue de l'IA au montage", async () => {
    render(<ChatBox projectId="proj-1" projectType="fullstack" />);

    expect(
      await screen.findByText(/Quel projet CRUD souhaitez-vous créer/i),
    ).toBeInTheDocument();
  });

  // 2. Header
  it("affiche le header avec le nom de l'assistant", () => {
    render(<ChatBox projectId="proj-1" projectType="fullstack" />);

    expect(screen.getByText(/Assistant IA Maestro/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Génération & modification de code/i),
    ).toBeInTheDocument();
  });

  // 3. Bouton Send désactivé si champ vide
  it("désactive le bouton Send quand le champ est vide", () => {
    render(<ChatBox projectId="proj-1" projectType="fullstack" />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  // 4. Bouton Send actif quand texte saisi
  it("active le bouton Send quand un texte est saisi", async () => {
    render(<ChatBox projectId="proj-1" projectType="fullstack" />);

    const textarea = screen.getByPlaceholderText(
      /Crée une gestion de bibliothèque/i,
    );
    fireEvent.change(textarea, { target: { value: "Mon projet" } });

    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });

  // 5. Le message utilisateur apparaît dans le chat
  it("affiche le message utilisateur dans le chat après envoi", async () => {
    render(<ChatBox projectId="proj-1" projectType="fullstack" />);

    const textarea = screen.getByPlaceholderText(
      /Crée une gestion de bibliothèque/i,
    );
    fireEvent.change(textarea, {
      target: { value: "Crée une gestion de livres" },
    });
    fireEvent.click(screen.getByRole("button"));

    expect(
      await screen.findByText(/Crée une gestion de livres/i),
    ).toBeInTheDocument();
  });

  // 6. Persistance localStorage
  it("sauvegarde l'historique dans le localStorage", async () => {
    render(<ChatBox projectId="proj-42" projectType="fullstack" />);

    await waitFor(() => {
      const stored = localStorage.getItem("chat_history_proj-42");
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored);
      expect(parsed[0].role).toBe("ai");
    });
  });

  // 7. Restauration depuis le localStorage
  it("restaure l'historique depuis le localStorage si disponible", () => {
    const history = [
      { role: "ai", text: "Message restauré depuis le cache" },
      { role: "user", text: "Ma question précédente" },
    ];
    localStorage.setItem("chat_history_proj-99", JSON.stringify(history));

    render(<ChatBox projectId="proj-99" projectType="fullstack" />);

    expect(
      screen.getByText(/Message restauré depuis le cache/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ma question précédente/i)).toBeInTheDocument();
  });
});
