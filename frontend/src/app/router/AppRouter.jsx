import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import DashboardPage from "../../pages/DashboardPage";
import ProjectsPage from "../../pages/ProjectsPage";
import AiEditorPage from "../../pages/Workspace/AiEditorPage";
import ProjectWorkspacePage from "../../pages/Workspace/ProjectWorkspacePage";
import RegisterPage from "../../pages/Auth/RegisterPage";
import ForgotPasswordPage from "../../pages/Auth/ForgotPasswordPage";
import AuthCallbackPage from "../../pages/Auth/AuthCallbackPage";
import GitHubCallbackPage from "../../pages/Auth/GitHubCallbackPage";
import LandingPage from "../../pages/Landing/LandingPage";
import { isDevMode, env } from "../../utils/env";
import { getMe } from "../../services/authService";
import DeploymentsPage from "../../components/Workspace/DeploymentsPage";
import RailwayCallbackPage from '../../pages/Auth/RailwayCallbackPage';

// ═══════════════════════════════════════════════════════════════
//  WorkspacePage – wrapper du layout principal pour les routes
//                  protégées /workspace/*
// ═══════════════════════════════════════════════════════════════
function WorkspacePage() {
  return <MainLayout />;
}

// ═══════════════════════════════════════════════════════════════
//  GatewayLoginRedirect
//
//  La page de login Maestro est servie DIRECTEMENT par Keycloak
//  via le thème "maestro" (login.ftl). Cette route /auth/login
//  côté React redirige donc immédiatement vers le gateway, qui
//  enchaîne sur Keycloak.
//
//  On utilise window.location.replace pour ne pas garder cette
//  étape dans l'historique du navigateur (sinon le bouton "back"
//  ramène ici en boucle).
// ═══════════════════════════════════════════════════════════════
function GatewayLoginRedirect() {
  useEffect(() => {
    window.location.replace(`${env.apiGatewayUrl}/auth/login`);
  }, []);
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
      Redirection vers la page de connexion…
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ProtectedRoute
//
//  On ne peut pas lire l'access token (cookie HttpOnly). On ping
//  donc /auth/me :
//    - 200 → session vivante, on rend les enfants
//    - 401 → pas de session, redirection vers /auth/login
//            (qui redirige lui-même vers Keycloak)
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
//  son workspace.
// ═══════════════════════════════════════════════════════════════
function LandingOrRedirect() {
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

  if (authed === null) return null;
  if (authed) return <Navigate to="/workspace/dashboard" replace />;
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
            <Route path="/auth/forgot-password" element={<Navigate to="/workspace/ai-generator" replace />} />
            <Route path="/auth/callback" element={<Navigate to="/workspace/ai-generator" replace />} />
            <Route path="/github/callback" element={<Navigate to="/workspace/ai-generator" replace />} />
          </>
        ) : (
          <>
            {/* Page d'entrée publique */}
            <Route path="/" element={<LandingOrRedirect />} />

            {/* /auth/login → redirige vers Keycloak (page servie par Keycloak via login.ftl) */}
            <Route path="/auth/login" element={<GatewayLoginRedirect />} />

            {/* Register et forgot password gardent leurs pages React */}
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

            {/* Callback OIDC – le gateway le gère mais on garde une route défensive */}
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/github/callback" element={<GitHubCallbackPage />} />
            <Route path="/railway/callback" element={<RailwayCallbackPage />} />

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
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="ai-generator" element={<AiEditorPage />} />
          <Route path="projects/:projectId" element={<ProjectWorkspacePage />} />
          <Route path="deployments" element={<DeploymentsPage />} />
        </Route>

        {/* Catch-all : tout chemin inconnu retourne sur la landing. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
