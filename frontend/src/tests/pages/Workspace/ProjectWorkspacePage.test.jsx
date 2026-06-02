/** @vitest-environment jsdom */
import React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProjectWorkspacePage from "../../../pages/Workspace/ProjectWorkspacePage";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);

// ─── Mock des composants enfants ──────────────────────────────────────────────

vi.mock("../../../components/Sidebar/AiFileTree", () => ({
  default: ({ projectType }) => (
    <div data-testid="ai-file-tree">AiFileTree - {projectType}</div>
  ),
}));

vi.mock("../../../components/Workspace/CodeEditor", () => ({
  default: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("../../../components/Workspace/ChatBox", () => ({
  default: ({ projectId, projectType }) => (
    <div data-testid="chat-box">
      ChatBox - {projectId} - {projectType}
    </div>
  ),
}));

vi.mock("../../../components/Workspace/Terminal", () => ({
  default: ({ projectId }) => (
    <div data-testid="terminal">Terminal - {projectId}</div>
  ),
}));

// ─── Mock useAiStore ──────────────────────────────────────────────────────────

vi.mock("../../../store/useAiStore", () => {
  const useAiStore = vi.fn(() => ({
    resetProject: vi.fn(),
    setFiles: vi.fn(),
  }));
  useAiStore.setState = vi.fn();
  useAiStore.getState = vi.fn(() => ({ files: {} }));
  return { useAiStore };
});

// ─── Mock API ─────────────────────────────────────────────────────────────────

vi.mock("../../../services/api", () => ({
  api: {
    get: vi.fn((url) => {
      if (url.includes("/files/content")) {
        return Promise.resolve({ data: { content: null } });
      }
      return Promise.resolve({
        data: { id: "proj-1", name: "Mon Projet", type: "fullstack" },
      });
    }),
  },
}));

// ─── Imports des mocks pour assertions ───────────────────────────────────────
// Ces imports sont après les vi.mock(), donc safe
import { useAiStore } from "../../../store/useAiStore";
import { api } from "../../../services/api";

// ─── Helper ───────────────────────────────────────────────────────────────────

const renderWithRouter = (projectId = "proj-1") => {
  return render(
    <MemoryRouter initialEntries={[`/workspace/${projectId}`]}>
      <Routes>
        <Route
          path="/workspace/:projectId"
          element={<ProjectWorkspacePage />}
        />
      </Routes>
    </MemoryRouter>,
  );
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ProjectWorkspacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAiStore.getState.mockReturnValue({ files: {} });
    useAiStore.mockReturnValue({
      resetProject: vi.fn(),
      setFiles: vi.fn(),
    });
  });

  afterEach(cleanup);

  // 1. Rendu des composants enfants
  it("rend les 4 composants principaux de la workspace", () => {
    renderWithRouter("proj-1");

    expect(screen.getByTestId("ai-file-tree")).toBeInTheDocument();
    expect(screen.getByTestId("code-editor")).toBeInTheDocument();
    expect(screen.getByTestId("chat-box")).toBeInTheDocument();
    expect(screen.getByTestId("terminal")).toBeInTheDocument();
  });

  // 2. Le projectId est bien transmis au Terminal
  it("transmet le projectId au composant Terminal", () => {
    renderWithRouter("proj-42");

    expect(screen.getByTestId("terminal")).toHaveTextContent("proj-42");
  });

  // 3. Le projectId est bien transmis au ChatBox
  it("transmet le projectId au composant ChatBox", () => {
    renderWithRouter("proj-42");

    expect(screen.getByTestId("chat-box")).toHaveTextContent("proj-42");
  });

  // 4. resetProject est appelé au montage
  it("appelle resetProject au montage du composant", () => {
    const mockResetProject = vi.fn();
    useAiStore.mockReturnValue({
      resetProject: mockResetProject,
      setFiles: vi.fn(),
    });

    renderWithRouter("proj-1");

    expect(mockResetProject).toHaveBeenCalledTimes(1);
  });

  // 5. L'API projet est appelée avec le bon projectId
  it("appelle l'API pour charger les données du projet", async () => {
    renderWithRouter("proj-99");

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/projects/proj-99");
    });
  });

  // 6. L'API fichiers est appelée pour chaque fichier du mapping
  it("appelle l'API pour charger les fichiers du projet", async () => {
    renderWithRouter("proj-1");

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/api/projects/proj-1/files/content",
        expect.objectContaining({ params: { path: "db/schema.sql" } }),
      );
      expect(api.get).toHaveBeenCalledWith(
        "/api/projects/proj-1/files/content",
        expect.objectContaining({ params: { path: "frontend/App.jsx" } }),
      );
    });
  });

  // 7. Le projectType est transmis à ChatBox après chargement
  it("transmet le projectType au ChatBox après chargement de l'API", async () => {
    renderWithRouter("proj-1");

    await waitFor(() => {
      expect(screen.getByTestId("chat-box")).toHaveTextContent("fullstack");
    });
  });

  // 8. Le projectType est transmis à AiFileTree après chargement
  it("transmet le projectType à AiFileTree après chargement de l'API", async () => {
    renderWithRouter("proj-1");

    await waitFor(() => {
      expect(screen.getByTestId("ai-file-tree")).toHaveTextContent("fullstack");
    });
  });
});
