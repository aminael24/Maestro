import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import DashboardPage from "../../pages/DashboardPage";
import ProjectsPage from "../../pages/ProjectsPage";
import AiEditorPage from "../../pages/Workspace/AiEditorPage";

// ═══════════════════════════════════════════════════════════════
//  WorkspacePage
// ═══════════════════════════════════════════════════════════════
function WorkspacePage() {
  return <MainLayout />;
}

// ═══════════════════════════════════════════════════════════════
//  ProtectedRoute — BYPASSED en développement local
// ═══════════════════════════════════════════════════════════════
function ProtectedRoute({ children }) {
  // ⚡ MODE DEV : bypass complet de l'auth
  // Pour remettre l'auth, remplace "return children" par le vrai code
  return children;
}

// ═══════════════════════════════════════════════════════════════
//  Router
// ═══════════════════════════════════════════════════════════════
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mode dev : tout redirige vers ai-generator */}
        <Route
          path="/"
          element={<Navigate to="/workspace/ai-generator" replace />}
        />
        <Route
          path="/auth/login"
          element={<Navigate to="/workspace/ai-generator" replace />}
        />
        <Route
          path="/auth/register"
          element={<Navigate to="/workspace/ai-generator" replace />}
        />
        <Route
          path="/auth/callback"
          element={<Navigate to="/workspace/ai-generator" replace />}
        />

        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="ai-generator" element={<AiEditorPage />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/workspace/ai-generator" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
