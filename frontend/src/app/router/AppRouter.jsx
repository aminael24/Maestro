import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import LoginPage from "../../pages/Auth/LoginPage";
import RegisterPage from "../../pages/Auth/RegisterPage";
import AuthCallbackPage from "../../pages/Auth/AuthCallbackPage";
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
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "14px",
              marginTop: "12px",
            }}
          >
            🔒 Token en mémoire — refresh_token en cookie HttpOnly.
          </p>
        </div>
      </main>
    </div>
  );
}

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
    alignItems: "center",
    padding: "20px 32px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  title: { margin: 0, fontSize: "24px", fontWeight: 700 },
  logoutBtn: {
    padding: "10px 20px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
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
    border: "1px solid rgba(255,255,255,0.10)",
    textAlign: "center",
    maxWidth: "500px",
  },
};

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
        <p style={{ opacity: 0.6 }}>Vérification de la session...</p>
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
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
