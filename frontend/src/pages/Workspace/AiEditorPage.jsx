import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useAiStore } from "../../store/useAiStore";
import AiFileTree from "../../components/Sidebar/AiFileTree";
import CodeEditor from "../../components/Workspace/CodeEditor";
import ChatBox from "../../components/Workspace/ChatBox";
import Terminal from "../../components/Workspace/Terminal";
import RepoGate from '../../components/repository/RepoGate';
import RepoTopBar from '../../components/repository/RepoTopBar';
import { useGitHubStore } from '../../store/gitHubStore';

const AI_SCRATCH_PROJECT_KEY = 'maestro_ai_scratch_project_id';

const AiEditorPage = () => {
  const { isConnected } = useGitHubStore();
  const [projectId, setProjectId] = useState(null);
  const { resetProject, setFiles } = useAiStore();

  // On mount: get or create the scratch project for the ai-generator
  useEffect(() => {
    const initScratchProject = async () => {
      // Try to reuse cached scratch project
      const cached = localStorage.getItem(AI_SCRATCH_PROJECT_KEY);
      if (cached) {
        setProjectId(parseInt(cached, 10));
        // Load existing files from the scratch project
        loadProjectFiles(parseInt(cached, 10));
        return;
      }

      try {
        // Create a new scratch project for this user's ai-generator session
        const res = await api.post('/api/projects', {
          name: 'AI Generator Workspace',
          description: 'Auto-created scratch project for the AI Generator',
          type: 'fullstack',
          frontendFramework: 'React',
          backendFramework: 'Express',
          database: 'PostgreSQL',
          isDockerEnabled: false,
        });
        const id = res.data.id;
        localStorage.setItem(AI_SCRATCH_PROJECT_KEY, String(id));
        setProjectId(id);
      } catch (err) {
        console.error('Failed to init scratch project:', err);
      }
    };

    resetProject();
    initScratchProject();
  }, []);

  const loadProjectFiles = async (id) => {
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
            .get(`/api/projects/${id}/files/content`, { params: { path: m.path } })
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
      console.error("Error loading scratch project files:", err);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr 360px',
      gridTemplateRows: isConnected ? 'auto 1fr' : '1fr',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#0f1923',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      {/* GitHub Gate - shows when not connected */}
      <RepoGate />

      {/* GitHub Top Bar - shows when connected */}
      {isConnected && (
        <div style={{ gridColumn: '1 / -1', zIndex: 10 }}>
          <RepoTopBar />
        </div>
      )}

      {/* Sidebar gauche */}
      <aside style={{
        background: 'linear-gradient(180deg, #0d1f2d 0%, #0f1923 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflowY: 'auto',
        height: isConnected ? 'calc(100vh - 80px)' : '100vh',
        gridColumn: '1',
        gridRow: isConnected ? '2' : '1',
      }}>
        <AiFileTree />
      </aside>

      {/* Éditeur central */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#111d27',
        height: isConnected ? 'calc(100vh - 80px)' : '100vh',
        overflow: 'hidden',
        gridColumn: '2',
        gridRow: isConnected ? '2' : '1',
      }}>
        <CodeEditor />
      </main>

      {/* Terminal */}
      <div style={{
        gridColumn: "2",
        gridRow: "2",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "8px",
        background: "#0d1117",
      }}>
        <Terminal projectId={projectId} />
      </div>

      {/* Chat droit */}
      <section style={{
        gridColumn: "3",
        gridRow: "1 / 3",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        background: "#0d1a24",
        overflow: "hidden",
      }}>
        {/* Pass projectId so ChatBox persists files via WorkspaceService → Kafka */}
        <ChatBox projectId={projectId} projectType="fullstack" />
      </section>
    </div>
  );
};

export default AiEditorPage;