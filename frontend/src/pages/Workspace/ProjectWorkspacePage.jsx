import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";
import { useAiStore } from "../../store/useAiStore";
import { useGitHubStore } from "../../store/gitHubStore";
import AiFileTree from "../../components/Sidebar/AiFileTree";
import CodeEditor from "../../components/Workspace/CodeEditor";
import ChatBox from "../../components/Workspace/ChatBox";
import Terminal from "../../components/Workspace/Terminal";
import RepoGate from "../../components/repository/RepoGate";
import RepoTopBar from "../../components/repository/RepoTopBar";

const ProjectWorkspacePage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const { resetProject } = useAiStore();
  const { isConnected } = useGitHubStore();

  useEffect(() => {
    resetProject();

    const loadProjectData = async () => {
      try {
        const mapping = [
          { key: "sql", path: "db/schema.sql" },
          { key: "model", path: "backend/model.js" },
          { key: "controller", path: "backend/controller.js" },
          { key: "routes", path: "backend/routes.js" },
          { key: "frontend", path: "frontend/App.jsx" },
        ];

        const results = await Promise.all(
          mapping.map((m) =>
            api
              .get(`/api/projects/${projectId}/files/content`, {
                params: { path: m.path },
              })
              .then((res) => ({ key: m.key, content: res.data?.content }))
              .catch(() => null),
          ),
        );

        const loadedFiles = {};
        results.forEach((r) => {
          if (r?.content) loadedFiles[r.key] = r.content;
        });

        if (Object.keys(loadedFiles).length > 0) {
          useAiStore.setState({
            files: { ...useAiStore.getState().files, ...loadedFiles },
            activeFile: Object.keys(loadedFiles).includes("frontend")
              ? "frontend"
              : Object.keys(loadedFiles)[0],
          });
        }
      } catch (err) {
        console.error("Erreur lors du chargement des fichiers du projet:", err);
      }
    };

    loadProjectData();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    api
      .get(`/api/projects/${projectId}`)
      .then((r) => setProject(r.data))
      .catch(console.error);
  }, [projectId]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 360px",
        gridTemplateRows: isConnected ? "auto 1fr 250px" : "1fr 250px",
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "#0f1923",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      {/* GitHub OAuth gate — shows connect modal when not connected */}
      <RepoGate />

      {/* GitHub TopBar — only visible when connected */}
      {isConnected && (
        <div style={{ gridColumn: "1 / -1", zIndex: 10 }}>
          <RepoTopBar />
        </div>
      )}

      {/* Sidebar */}
      <aside
        style={{
          gridColumn: "1",
          gridRow: isConnected ? "2 / 4" : "1 / 3",
          background: "linear-gradient(180deg, #0d1f2d 0%, #0f1923 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          overflowY: "auto",
        }}
      >
        <AiFileTree projectType={project?.type} />
      </aside>

      {/* Code editor */}
      <main
        style={{
          gridColumn: "2",
          gridRow: isConnected ? "2" : "1",
          display: "flex",
          flexDirection: "column",
          background: "#111d27",
          overflow: "hidden",
        }}
      >
        <CodeEditor />
      </main>

      {/* Terminal */}
      <div
        style={{
          gridColumn: "2",
          gridRow: isConnected ? "3" : "2",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "8px",
          background: "#0d1117",
        }}
      >
        <Terminal projectId={projectId} projectType={project?.type} />
      </div>

      {/* Chat */}
      <section
        style={{
          gridColumn: "3",
          gridRow: isConnected ? "2 / 4" : "1 / 3",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          background: "#0d1a24",
          overflow: "hidden",
        }}
      >
        <ChatBox projectId={projectId} projectType={project?.type} />
      </section>
    </div>
  );
};

export default ProjectWorkspacePage;