/** @vitest-environment jsdom */
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useAiStore } from "../../store/useAiStore";
import CodeEditor from "../../components/Workspace/CodeEditor";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);

// ─── Mock useAiStore ───────────────────────────────────────────────────────────

const mockSetActiveFile = vi.fn();
const mockSetSelectedCode = vi.fn();
const mockClearSelectedCode = vi.fn();

vi.mock("../../store/useAiStore", () => ({
  useAiStore: vi.fn(),
}));

// Mock react-syntax-highlighter (lourd, inutile en test)
vi.mock("react-syntax-highlighter", () => ({
  Prism: ({ children, ...props }) => (
    <pre data-testid="syntax-highlighter" {...props}>
      {children}
    </pre>
  ),
}));
vi.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  vscDarkPlus: {},
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CodeEditor", () => {
  beforeEach(() => {
    useAiStore.mockReturnValue({
      files: {},
      activeFile: "model",
      setActiveFile: mockSetActiveFile,
      setSelectedCode: mockSetSelectedCode,
      clearSelectedCode: mockClearSelectedCode,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // 1. Aucun fichier ouvert
  it("affiche 'Aucun fichier ouvert' quand aucun fichier n'est disponible", () => {
    render(<CodeEditor />);
    expect(screen.getByText(/Aucun fichier ouvert/i)).toBeInTheDocument();
  });

  // 2. Affiche le contenu par défaut si le fichier actif est vide
  it("affiche le placeholder si le fichier actif n'a pas de contenu", () => {
    render(<CodeEditor />);
    expect(
      screen.getByText(/Aucun contenu généré pour ce fichier/i),
    ).toBeInTheDocument();
  });

  // 3. Affiche les onglets quand des fichiers sont présents
  it("affiche les onglets correspondant aux fichiers disponibles", () => {
    useAiStore.mockReturnValue({
      files: { sql: "SELECT 1;", model: "const x = 1;" },
      activeFile: "sql",
      setActiveFile: mockSetActiveFile,
      setSelectedCode: mockSetSelectedCode,
      clearSelectedCode: mockClearSelectedCode,
    });

    render(<CodeEditor />);

    expect(screen.getByText("schema.sql")).toBeInTheDocument();
    expect(screen.getByText("model.js")).toBeInTheDocument();
  });

  // 4. Cliquer sur un onglet appelle setActiveFile
  it("appelle setActiveFile avec la bonne clé au clic sur un onglet", () => {
    useAiStore.mockReturnValue({
      files: { sql: "SELECT 1;", model: "const x = 1;" },
      activeFile: "sql",
      setActiveFile: mockSetActiveFile,
      setSelectedCode: mockSetSelectedCode,
      clearSelectedCode: mockClearSelectedCode,
    });

    render(<CodeEditor />);
    fireEvent.click(screen.getByText("model.js"));

    expect(mockSetActiveFile).toHaveBeenCalledWith("model");
  });

  // 5. Affiche le contenu du fichier actif dans le highlighter
  it("affiche le contenu du fichier actif dans la zone de code", () => {
    useAiStore.mockReturnValue({
      files: { model: 'const hello = "world";' },
      activeFile: "model",
      setActiveFile: mockSetActiveFile,
      setSelectedCode: mockSetSelectedCode,
      clearSelectedCode: mockClearSelectedCode,
    });

    render(<CodeEditor />);
    expect(screen.getByText('const hello = "world";')).toBeInTheDocument();
  });

  // 6. Le bouton flottant n'est pas visible au montage
  it("n'affiche pas le bouton flottant 'Envoyer à l'IA' au montage", () => {
    render(<CodeEditor />);
    expect(screen.queryByText(/Envoyer à l'IA/i)).not.toBeInTheDocument();
  });

  // 7. clearSelectedCode est appelé au mouseDown hors bouton flottant
  it("appelle clearSelectedCode au clic dans la zone de code", () => {
    render(<CodeEditor />);
    const editor = screen.getByTestId("syntax-highlighter");
    fireEvent.mouseDown(editor);
    expect(mockClearSelectedCode).toHaveBeenCalled();
  });
});
