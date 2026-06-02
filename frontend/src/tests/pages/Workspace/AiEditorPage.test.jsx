/** @vitest-environment jsdom */
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AiEditorPage from "../../../pages/Workspace/AiEditorPage";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);

// ─── Mock des composants enfants ──────────────────────────────────────────────

vi.mock("../../../components/Sidebar/AiFileTree", () => ({
  default: () => <div data-testid="ai-file-tree">AiFileTree</div>,
}));

vi.mock("../../../components/Workspace/CodeEditor", () => ({
  default: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("../../../components/Workspace/ChatBox", () => ({
  default: () => <div data-testid="chat-box">ChatBox</div>,
}));

vi.mock("../../../components/Workspace/Terminal", () => ({
  default: () => <div data-testid="terminal">Terminal</div>,
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AiEditorPage", () => {
  afterEach(cleanup);

  // 1. Rendu des 4 composants
  it("rend les 4 composants principaux de la page", () => {
    render(
      <MemoryRouter>
        <AiEditorPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("ai-file-tree")).toBeInTheDocument();
    expect(screen.getByTestId("code-editor")).toBeInTheDocument();
    expect(screen.getByTestId("chat-box")).toBeInTheDocument();
    expect(screen.getByTestId("terminal")).toBeInTheDocument();
  });

  // 2. AiFileTree sans props (page standalone)
  it("rend AiFileTree sans projectId ni projectType", () => {
    render(
      <MemoryRouter>
        <AiEditorPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("ai-file-tree")).toBeInTheDocument();
  });

  // 3. ChatBox sans projectId (page standalone)
  it("rend ChatBox sans projectId", () => {
    render(
      <MemoryRouter>
        <AiEditorPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("chat-box")).toBeInTheDocument();
  });

  // 4. Terminal sans projectId (page standalone)
  it("rend Terminal sans projectId", () => {
    render(
      <MemoryRouter>
        <AiEditorPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("terminal")).toBeInTheDocument();
  });
});
