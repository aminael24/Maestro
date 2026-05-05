import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import DashboardPage from "../../pages/DashboardPage";
import ProjectsPage from "../../pages/ProjectsPage";
import AiEditorPage from "../../pages/Workspace/AiEditorPage";
import ProjectWorkspacePage from "../../pages/Workspace/ProjectWorkspacePage";
import LoginPage from "../../pages/Auth/LoginPage";
import RegisterPage from "../../pages/Auth/RegisterPage";
import AuthCallbackPage from "../../pages/Auth/AuthCallbackPage";
import LandingPage from "../../pages/Landing/LandingPage";
import { isDevMode } from "../../utils/env";
import { getMe } from "../../services/authService";

// ═══════════════════════════════════════════════════════════════
//  WorkspacePage – wrapper du layout principal pour les routes
//                  protégées /workspace/*
// ═══════════════════════════════════════════════════════════════
function WorkspacePage() {
  return <MainLayout />;
}

// ═══════════════════════════════════════════════════════════════
//  ProtectedRoute
//
//  On ne peut pas lire l'access token (cookie HttpOnly). On ping
//  donc /auth/me :
//    - 200 → session vivante, on rend les enfants
//    - 401 → pas de session, redirection vers /auth/login
// ═══════════════════════════════════════════════════════════════
function ProtectedRoute({ children }) {
  const [authed, setAuthed] = useState(null); // null = en cours

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getMe();
        if (!cancelled) setAuthed(true);
      } catch {
        if (!cancelled) setAuthed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (authed === null) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0b1020",
          color: "rgba(255,255,255,0.6)",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 14,
        }}
      >
        Vérification de la session…
      </div>
    );
  }

  if (!authed) return <Navigate to="/auth/login" replace />;
  return children;
}

// ═══════════════════════════════════════════════════════════════
//  LandingOrRedirect
//
//  Pour la route "/", on affiche la LandingPage si l'utilisateur
//  n'est pas authentifié, sinon on le redirige directement vers
//  son workspace. Le ping /auth/me est silencieux.
// ═══════════════════════════════════════════════════════════════
function LandingOrRedirect() {
  // null = vérification, false = anonyme, true = authentifié
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getMe();
        if (!cancelled) setAuthed(true);
      } catch {
        if (!cancelled) setAuthed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Pendant la vérif on ne FLASH PAS la landing : on rend rien (très bref).
  if (authed === null) return null;
  if (authed) return <Navigate to="/workspace/projects" replace />;
  return <LandingPage />;
}

// ═══════════════════════════════════════════════════════════════
//  Guard – bypass ProtectedRoute en mode dev
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
            {/* Mode dev : tout redirige vers ai-generator */}
            <Route path="/" element={<Navigate to="/workspace/ai-generator" replace />} />
            <Route path="/auth/login" element={<Navigate to="/workspace/ai-generator" replace />} />
            <Route path="/auth/register" element={<Navigate to="/workspace/ai-generator" replace />} />
            <Route path="/auth/callback" element={<Navigate to="/workspace/ai-generator" replace />} />
          </>
        ) : (
          <>
            {/* Page d'entrée publique */}
            <Route path="/" element={<LandingOrRedirect />} />

            {/* Pages d'auth */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            {/* Legacy callback – le gateway gère OIDC, mais on le garde
                comme entrée défensive (anciens bookmarks). */}
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
          </>
        )}

        {/* App protégée */}
        <Route
          path="/workspace"
          element={
            <Guard>
              <WorkspacePage />
            </Guard>
          }
        >
          <Route index element={<Navigate to="projects" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="ai-generator" element={<AiEditorPage />} />
          <Route path="projects/:projectId" element={<ProjectWorkspacePage />} />
        </Route>

        {/* Catch-all : tout chemin inconnu retourne sur la landing. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
