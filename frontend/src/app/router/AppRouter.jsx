import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import LoginPage from "../../pages/Auth/LoginPage";
import RegisterPage from "../../pages/Auth/RegisterPage";
import AuthCallbackPage from "../../pages/Auth/AuthCallbackPage";
import MainLayout from "../../components/Layout/MainLayout";
import DashboardPage from "../../pages/DashboardPage";
import ProjectsPage from "../../pages/ProjectsPage";
import ProjectWorkspacePage from "../../pages/Workspace/ProjectWorkspacePage";
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
  async function handleLogout() {
    await logout(); // supprime le cookie HttpOnly côté backend
    clearTokens(); // vide la mémoire côté frontend
    window.location.href = "/auth/login";
  }

  // ── Silent refresh proactif ────────────────────────────────
  // Programme un refresh à ~80 % de la durée de vie du token.
  const timerRef = useRef(null);

  const scheduleRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const ms = getTimeUntilExpiry();
    if (ms <= 0) return;

    // Rafraîchir quand il reste 20 % de la durée
    const delay = Math.max(ms * 0.8, 5000); // minimum 5 s

    timerRef.current = setTimeout(async () => {
      try {
        await refreshAccessToken();
        scheduleRefresh(); // re-programmer avec le nouveau token
      } catch {
        // refresh échoué → session morte, déconnecter
        clearTokens();
        window.location.href = "/auth/login";
      }
    }, delay);
  }, []);

  useEffect(() => {
    scheduleRefresh();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleRefresh]);

  return (
    <MainLayout />
  );
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
  const [status, setStatus] = useState(() =>
    getAccessToken() ? "ready" : "checking"
  );

  useEffect(() => {
    if (status !== "checking") return;

    let cancelled = false;

    refreshAccessToken()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "checking") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0b1020",
          color: "#fff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <p style={{ opacity: 0.6 }}>Verifying session...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
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
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        
        <Route
  path="/workspace"
  element={
    isDevMode ? (
      <WorkspacePage />
    ) : (
      <ProtectedRoute>
        <WorkspacePage />
      </ProtectedRoute>
    )
  }
>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<ProjectWorkspacePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Routes>
    </BrowserRouter>
  );
}