import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getMe, logout } from "../../services/authService";
import logoImage from "../../assets/logo.png";
import "./Sidebar.css";

const NAV_ITEMS = [
  {
    path: "/workspace/dashboard",
    label: "Tableau de bord",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    path: "/workspace/projects",
    label: "Projets",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      </svg>
    ),
  },
  {
    path: "/workspace/ai-generator",
    label: "AI Generator",
    badge: "IA",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    path: "/workspace/deployments",
    label: "Déploiements",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12A10 10 0 1 1 12 2"/>
        <polyline points="22 2 12 12"/>
        <polyline points="15 2 22 2 22 9"/>
      </svg>
    ),
  },
  {
    path: "/workspace/infrastructure",
    label: "Infrastructure",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="5" rx="1.5"/>
        <rect x="2" y="11" width="20" height="5" rx="1.5"/>
        <rect x="2" y="19" width="20" height="2" rx="1"/>
        <circle cx="6" cy="5.5" r="1" fill="currentColor"/>
        <circle cx="6" cy="13.5" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    path: "/workspace/monitoring",
    label: "Supervision",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
];

function NavItem({ item, collapsed, isActive }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    if (collapsed) {
      timerRef.current = setTimeout(() => setTooltipVisible(true), 100);
    }
  };

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setTooltipVisible(false);
  };

  return (
    <NavLink
      to={item.path}
      className={`sb__link ${isActive ? "sb__link--active" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="sb__link-icon">{item.icon}</span>
      <span className={`sb__link-label ${collapsed ? "sb__link-label--hidden" : ""}`}>
        {item.label}
      </span>
      {item.badge && !collapsed && <span className="sb__badge">{item.badge}</span>}
      {isActive && <span className="sb__link-indicator" />}
      {collapsed && tooltipVisible && (
        <div className="sb__tooltip">
          {item.label}
          {item.badge && <span className="sb__tooltip-badge">{item.badge}</span>}
        </div>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toggleTooltipVisible, setToggleTooltipVisible] = useState(false);
  const location = useLocation();
  const toggleTimerRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });

  // ✅ Synchronise la largeur de la sidebar avec une CSS variable sur :root
  // Cela permet au MainLayout (et tout autre composant) de réagir dynamiquement
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sb-current-width",
      collapsed ? "var(--sb-width-closed)" : "var(--sb-width-open)"
    );
  }, [collapsed]);

  useEffect(() => {
    getMe().then(setUser).catch(console.error);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
  };

  const handleToggleMouseEnter = () => {
    if (toggleButtonRef.current) {
      const rect = toggleButtonRef.current.getBoundingClientRect();
      setTooltipPosition({
        left: rect.right + 6,
        top: rect.top + rect.height / 2,
      });
    }
    toggleTimerRef.current = setTimeout(() => setToggleTooltipVisible(true), 100);
  };

  const handleToggleMouseLeave = () => {
    clearTimeout(toggleTimerRef.current);
    setToggleTooltipVisible(false);
  };

  const tooltipText = collapsed ? "Ouvrir la sidebar" : "Fermer la sidebar";

  return (
    <aside className={`sb ${collapsed ? "sb--collapsed" : ""}`}>
      {/* Bouton Toggle */}
      <button
        ref={toggleButtonRef}
        className="sb__toggle"
        onClick={() => setCollapsed(!collapsed)}
        onMouseEnter={handleToggleMouseEnter}
        onMouseLeave={handleToggleMouseLeave}
        aria-label={tooltipText}
      >
        {collapsed ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <polyline points="15 9 18 12 15 15"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
            <polyline points="9 9 6 12 9 15"/>
          </svg>
        )}
      </button>

      {/* Tooltip pour le toggle - positionné à droite de l'icône */}
      {toggleTooltipVisible && (
        <div
          className="sb__toggle-tooltip"
          style={{
            position: "fixed",
            left: tooltipPosition.left,
            top: tooltipPosition.top,
            transform: "translateY(-50%)",
          }}
        >
          {tooltipText}
        </div>
      )}

      {/* Logo */}
      <div className="sb__logo">
        <img src={logoImage} alt="Maestro" className="sb__logo-img" />
        <div className="sb__logo-text">
          <strong>Maestro</strong>
          <span>DevSecOps</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sb__nav">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            collapsed={collapsed}
            isActive={location.pathname === item.path}
          />
        ))}
      </nav>

      <div className="sb__divider" />

      {/* Section Utilisateur */}
      <div className="sb__user">
        <div className="sb__user-row">
          <div className="sb__avatar">
            {user ? user.firstName?.charAt(0)?.toUpperCase() : "?"}
          </div>
          <div className={`sb__user-info ${collapsed ? "sb__user-info--hidden" : ""}`}>
            <strong>{user ? `${user.firstName} ${user.lastName || ""}`.trim() : "Utilisateur"}</strong>
            <span>{user?.username || user?.email || "Chargement..."}</span>
          </div>
        </div>

        <button
          className={`sb__logout ${collapsed ? "sb__logout--icon-only" : ""}`}
          onClick={handleLogout}
          disabled={loggingOut}
          title="Se déconnecter"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 14, height: 14, flexShrink: 0 }}
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!collapsed && <span>{loggingOut ? "Déconnexion…" : "Se déconnecter"}</span>}
        </button>
      </div>
    </aside>
  );
}
