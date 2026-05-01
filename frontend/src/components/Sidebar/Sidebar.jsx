import React from "react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { getMe } from "../../services/authService";
import "./Sidebar.css";
import logoImage from "../../assets/logo.png";

const items = [
  { path: "/workspace/dashboard", label: "Tableau de bord" },
  { path: "/workspace/projects", label: "Projets" },
  { path: "/workspace/ai-generator", label: "AI Generator" }, // ← AJOUT
  { path: "/workspace/deployments", label: "Déploiements" },
  { path: "/workspace/infrastructure", label: "Infrastructure" },
  { path: "/workspace/monitoring", label: "Supervision" },
];

export default function Sidebar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("maestro_access_token");
      if (token) {
        try {
          const data = await getMe(token);
          setUser(data);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchUser();
  }, []);

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

      {/* USER */}
      <div className="sidebarV2__user">
        <div className="avatar">{user ? user.firstName?.charAt(0) : "?"}</div>
        <div>
          <strong>
            {user ? `${user.firstName} ${user.lastName}` : "Connecté"}
          </strong>
          <span>{user ? user.username : "Chargement..."}</span>
        </div>
      </div>
    </aside>
  );
}
