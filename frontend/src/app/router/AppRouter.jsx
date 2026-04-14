import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";

import LoginPage from "../../pages/Auth/LoginPage";
import RegisterPage from "../../pages/Auth/RegisterPage";
import AuthCallbackPage from "../../pages/Auth/AuthCallbackPage";
import TheArchive from "../../pages/TheArchive";
// auth utils
import {
  getAccessToken,
  clearTokens,
  getTimeUntilExpiry,
} from "../../features/auth/authStorage";

import { logout, refreshAccessToken } from "../../services/authService";



/* =========================
   WORKSPACE PAGE
========================= */
function WorkspacePage() {
  async function handleLogout() {
    await logout();
    clearTokens();
    window.location.href = "/auth/login";
  }

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
    scheduleRefresh();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleRefresh]);

  return (
    <div style={workspaceStyles.page}>
      <header style={workspaceStyles.header}>
        <h1 style={workspaceStyles.title}>🎼 Workspace Maestro</h1>
        <button onClick={handleLogout} style={workspaceStyles.logoutBtn}>
          Déconnexion
        </button>
      </header>

      <main style={workspaceStyles.main}>
        <div style={workspaceStyles.card}>
          <h2>Bienvenue !</h2>
          <p>Vous êtes connecté avec succès via Keycloak OIDC + PKCE.</p>
        </div>
      </main>
    </div>
  );
}

/* =========================
   PROTECTED ROUTE
========================= */
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
    return <div style={{ color: "#fff" }}>Vérification de la session...</div>;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

/* =========================
   ROUTER
========================= */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TheArchive  />} />

        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

/* =========================
   STYLES
========================= */
const workspaceStyles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0b1020 0%, #1a1040 100%)",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px 32px",
  },
  title: { fontSize: "24px", fontWeight: 700 },
  logoutBtn: {
    padding: "10px 20px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    cursor: "pointer",
  },
  main: {
    display: "grid",
    placeItems: "center",
    padding: "60px 32px",
  },
  card: {
    padding: "40px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.06)",
  },
};