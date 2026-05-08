// frontend/src/pages/DashboardPage.jsx

import React, { useEffect, useState } from "react";
import { projectService } from "../services/projectService";
import { getMe } from "../services/authService";
import "./DashboardPage.css";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, projectsData] = await Promise.all([
          getMe(),
          projectService.getProjects()
        ]);
        setUser(userData);
        setProjects(projectsData || []);
      } catch (error) {
        console.error("Erreur chargement dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Statistiques calculées
  const activeProjects = projects.filter(p => p.status === "active").length;
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  
  // CPU Utilisation basée sur le nombre de projets
  const cpuUtilization = totalProjects > 0 ? Math.min(94, 50 + totalProjects * 2) : 0;
  
  // Nombre de régions simulé
  const regionsCount = Math.max(1, totalProjects * 3);
  
  // Uptime simulé
  const uptime = totalProjects > 0 ? "99.99%" : "0%";
  
  // Activité récente à partir des projets
  const recentActivity = projects.slice(0, 5).map(p => ({
    type: p.type || "Projet",
    name: p.name,
    status: p.status || "active",
    updatedAt: p.updatedAt || p.createdAt || new Date().toISOString(),
    icon: getProjectIcon(p.type)
  }));

  function getProjectIcon(type) {
    const icons = {
      web: "🌐",
      mobile: "📱",
      api: "🔌",
      devops: "⚙️",
      default: "📁"
    };
    return icons[type?.toLowerCase()] || icons.default;
  }

  function getStatusBadge(status) {
    switch(status?.toLowerCase()) {
      case "active": return "running";
      case "completed": return "success";
      case "archived": return "warning";
      default: return "running";
    }
  }

  // ⭐ MODIFICATION ICI : TOUJOURS "EN COURS"
  function getStatusText(status) {
    return "EN COURS";  // ← Peu importe le status, affiche EN COURS
  }

  if (loading) {
    return (
      <div className="dashboard" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div>Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* HEADER */}
      <div className="dashboard__header">
        <div>
          <h1>Centre de Contrôle</h1>  {/* ← FRANÇAIS */}
          <p>
            Bon retour, <strong>{user?.firstName || user?.username || "Utilisateur"}</strong>. 
            Votre infrastructure neuronale fonctionne actuellement à <strong>{totalProjects > 0 ? "98.4" : "0"}</strong>% 
            d'efficacité sur <strong>{totalProjects}</strong> cluster{totalProjects !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="dashboard__stats">
          <div className="stat">
            <span>SERVICES ACTIFS</span>  {/* ← FRANÇAIS */}
            <strong>{activeProjects}</strong>
          </div>
          <div className="stat">
            <span>PARAMÈTRES</span>  {/* ← FRANÇAIS */}
            <strong>{completedProjects}</strong>
          </div>
        </div>
      </div>

      {/* GRID CARDS */}
      <div className="grid">
        {/* Neural Processor Card */}
        <div className="card card--big">
          <div className="card__header">
            <div className="icon-box">⚙️</div>
            <div className="badge running">EN DIRECT</div>  {/* ← FRANÇAIS */}
          </div>
          <h2>Processeur Neural</h2>  {/* ← FRANÇAIS */}
          <p>
            Moteur de détection de menaces en temps réel et d'analyse comportementale utilisant les protocoles GPT-4o-Turbo.
          </p>
          <div className="prog-row">
            <span className="prog-label">UTILISATION CPU</span>  {/* ← FRANÇAIS */}
            <span className="prog-val">{cpuUtilization}%</span>
          </div>
          <div className="progress">
            <div className="progress__bar" style={{ width: `${cpuUtilization}%` }}></div>
          </div>
          <div className="card-footer-row">
            <div className="avatars">
              <div className="mini-av">M</div>
              <div className="mini-av">A</div>
              <div className="mini-av mini-av--extra">+{Math.min(3, totalProjects)}</div>
            </div>
            <div className="card-ver">v2.4.0-Stable</div>
          </div>
        </div>

        {/* Data Lake Card */}
        <div className="card">
          <div className="card__header">
            <div className="icon-box">🗄️</div>
            <div className="badge success">ACTIF</div>  {/* ← FRANÇAIS */}
          </div>
          <h2>Lac de Données</h2>  {/* ← FRANÇAIS */}
          <p>Agrégation de télémétrie depuis {regionsCount} régions avec indexation sémantique activée.</p>
          <div className="uptime-block">
            <span className="uptime-label">DISPONIBILITÉ</span>  {/* ← FRANÇAIS */}
            <span className="uptime-val">{uptime}</span>
          </div>
        </div>

        {/* Network Sentry Card */}
        <div className="card">
          <div className="live-badge">
            <span className="live-dot"></span> EN DIRECT  {/* ← FRANÇAIS */}
          </div>
          <div className="icon-box" style={{ marginBottom: "16px" }}>🛡️</div>
          <h2>Sentinelle Réseau</h2>  {/* ← FRANÇAIS */}
          <p>Inspection continue des paquets et audit du chiffrement sur tous les clouds privés virtuels.</p>
          <button className="btn-audit" onClick={() => console.log("Audit lancé")}>
            LANCER L'AUDIT →  {/* ← FRANÇAIS */}
          </button>
        </div>
      </div>

      {/* RECENT SYSTEM ACTIVITY TABLE */}
      <div className="table">
        <div className="table-header">
          <h3>ACTIVITÉ RÉCENTE</h3>  {/* ← FRANÇAIS */}
          <div>
            <button 
              className={activeTab === "all" ? "active" : ""} 
              onClick={() => setActiveTab("all")}
            >
              Tous  {/* ← FRANÇAIS */}
            </button>
            <button 
              className={activeTab === "pipelines" ? "active" : ""} 
              onClick={() => setActiveTab("pipelines")}
            >
              Pipelines  {/* ← FRANÇAIS */}
            </button>
            <button 
              className={activeTab === "security" ? "active" : ""} 
              onClick={() => setActiveTab("security")}
            >
              Sécurité  {/* ← FRANÇAIS */}
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>TYPE D'ÉVÉNEMENT</th>  {/* ← FRANÇAIS */}
              <th>NŒUD SOURCE</th>  {/* ← FRANÇAIS */}
              <th>STATUT</th>  {/* ← FRANÇAIS */}
              <th>DATE</th>  {/* ← FRANÇAIS */}
              <th>ACTIONS</th>  {/* ← FRANÇAIS */}
            </tr>
          </thead>
          <tbody>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="evt-cell">
                      <div className="evt-icon">{activity.icon}</div>
                      {activity.type}
                    </div>
                  </td>
                  <td>{activity.name}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(activity.status)}`}>
                      EN COURS  {/* ← TOUJOURS "EN COURS" */}
                    </span>
                  </td>
                  <td>{new Date(activity.updatedAt).toLocaleDateString()}</td>  {/* ← FRANÇAIS */}
                  <td><button className="more-btn">⋯</button></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
                  Aucune activité récente
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="load-more">
          <button>CHARGER L'HISTORIQUE →</button>  {/* ← FRANÇAIS */}
        </div>
      </div>
    </div>
  );
}