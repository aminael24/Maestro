import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useCallback, useRef } from "react";

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
//  WorkspacePage (uses AI layout)
// ═══════════════════════════════════════════════════════════════
function WorkspacePage() {
  return <MainLayout />;
}


// ═══════════════════════════════════════════════════════════════
//  ProtectedRoute (with token refresh 🔥)
// ═══════════════════════════════════════════════════════════════
function ProtectedRoute({ children }) {
  const timerRef = useRef(null);

  const scheduleRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const ms = getTimeUntilExpiry();
    if (ms <= 0) return;

    const delay = Math.max(ms * 0.8, 5000);

    timerRef.current = setTimeout(async () => {
      try {
        await refreshAccessToken();
        scheduleRefresh();
      } catch {
        clearTokens();
        window.location.href = "/auth/login";
      }
    }, delay);
  }, []);

  useEffect(() => {
    if (!getAccessToken()) return;

    scheduleRefresh();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleRefresh]);

  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}


// ═══════════════════════════════════════════════════════════════
//  Guard (dev mode bypass)
// ═══════════════════════════════════════════════════════════════
const Guard = isDevMode ? ({ children }) => children : ProtectedRoute;


// ═══════════════════════════════════════════════════════════════
//  Router
// ═══════════════════════════════════════════════════════════════
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {isDevMode ? (
          <>
            <Route path="/" element={<Navigate to="/workspace/ai-generator" replace />} />
            <Route path="/auth/login" element={<Navigate to="/workspace/ai-generator" replace />} />
            <Route path="/auth/register" element={<Navigate to="/workspace/ai-generator" replace />} />
            <Route path="/auth/callback" element={<Navigate to="/workspace/ai-generator" replace />} />
          </>
        ) : (
          <>
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

        <Route path="*" element={<Navigate to="/workspace/ai-generator" replace />} />
      </Routes>
    </BrowserRouter>
  );
}