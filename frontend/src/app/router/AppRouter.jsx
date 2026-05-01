import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import DashboardPage from "../../pages/DashboardPage";
import ProjectsPage from "../../pages/ProjectsPage";
import AiEditorPage from "../../pages/Workspace/AiEditorPage";
import ProjectWorkspacePage from "../../pages/Workspace/ProjectWorkspacePage";
import LoginPage from "../../pages/Auth/LoginPage";
import RegisterPage from "../../pages/Auth/RegisterPage";
import AuthCallbackPage from "../../pages/Auth/AuthCallbackPage";
import { isDevMode } from "../../utils/env";
import {
  getAccessToken,
  clearTokens,
  getTimeUntilExpiry,
} from "../../features/auth/authStorage";
import { logout, refreshAccessToken } from "../../services/authService";

// ═══════════════════════════════════════════════════════════════
//  WorkspacePage
// ═══════════════════════════════════════════════════════════════
function WorkspacePage() {
  return <MainLayout />;
}

// ═══════════════════════════════════════════════════════════════
//  Guard – bypass ProtectedRoute in dev mode
// ═══════════════════════════════════════════════════════════════

const Guard = isDevMode ? ({ children }) => children : ProtectedRoute;
// ═══════════════════════════════════════════════════════════════
//  ProtectedRoute – tente un silent refresh si le token mémoire
//  est absent (ex : rechargement de page / nouvel onglet).

// ═══════════════════════════════════════════════════════════════
function ProtectedRoute({ children }) {
  const token = getAccessToken();
  if (!token) {
    // Si pas de token, direction la page de login
    return <Navigate to="/auth/login" replace />;
  }
  return children;
}

// ═══════════════════════════════════════════════════════════════
//  Router
// ═══════════════════════════════════════════════════════════════
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {isDevMode ? (
          <>
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
          </>
        ) : (
          <>
            {/* Mode intégré : redirige vers le tableau de bord par défaut */}
            <Route path="/" element={<Navigate to="/workspace/dashboard" replace />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
          </>
        )}

        <Route
          path="/workspace"
          element={
            <Guard>
              <WorkspacePage />
            </Guard>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="ai-generator" element={<AiEditorPage />} />
          <Route path="projects/:projectId" element={<ProjectWorkspacePage />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/workspace/ai-generator" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
