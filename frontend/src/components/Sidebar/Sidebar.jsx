import React from "react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { getMe, logout } from "../../services/authService";
import "./Sidebar.css";
import logoImage from "../../assets/logo.png";

const items = [
  { path: "/workspace/dashboard", label: "Tableau de bord" },
  { path: "/workspace/projects", label: "Projets" },
  { path: "/workspace/ai-generator", label: "AI Generator" },
  { path: "/workspace/deployments", label: "Déploiements" },
  { path: "/workspace/infrastructure", label: "Infrastructure" },
  { path: "/workspace/monitoring", label: "Supervision" },
];

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe();
        setUser(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, []);

  /**
   * Logout COMPLET :
   *   1. POST /auth/logout au gateway
   *      → révoque la session côté Keycloak (back-channel)
   *      → clear nos cookies maestro_*
   *      → renvoie l'URL Keycloak end-session
   *   2. Redirection navigateur vers cette URL
   *      → Keycloak clear ses propres cookies SSO côté navigateur
   *      → redirige vers la landing page
   */
  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
  }

  return (
    <aside className="sidebarV2">
      {/* LOGO */}
      <div className="sidebarV2__logo">
        <img src={logoImage} alt="Maestro Logo" className="logo-img" />
        <div>
          <strong>Maestro</strong>
          <span>DevSecOps</span>
        </div>
      </div>

      {/* MENU */}
      <nav className="sidebarV2__nav">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "sidebarV2__link active" : "sidebarV2__link"
            }
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* USER + LOGOUT (logout BELOW user name) */}
      <div
        className="sidebarV2__user"
        style={{
          flexDirection: "column",
          alignItems: "stretch",
          gap: 10,
        }}
      >
        {/* Ligne 1 : avatar + nom/email */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div className="avatar">
            {user ? user.firstName?.charAt(0) : "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>
              {user ? `${user.firstName} ${user.lastName}` : "Connecté"}
            </strong>
            <span>{user ? user.username : "Chargement..."}</span>
          </div>
        </div>

        {/* Ligne 2 : bouton logout pleine largeur, en dessous */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Se déconnecter"
          style={{
            width: "100%",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "rgba(252, 165, 165, 0.95)",
            padding: "8px 12px",
            borderRadius: 8,
            cursor: loggingOut ? "wait" : "pointer",
            fontSize: 13,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!loggingOut) {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.40)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loggingOut) {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.25)";
            }
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>{loggingOut ? "Déconnexion…" : "Se déconnecter"}</span>
        </button>
      </div>
    </aside>
  );
}
