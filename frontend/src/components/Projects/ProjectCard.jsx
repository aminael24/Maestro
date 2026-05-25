import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import './ProjectCard.css';

// Mapping des statuts (identique au dashboard)
const STATUS_MAP = {
  active:      { label: 'Actif',       cls: 'active'     },
  in_progress: { label: 'En cours',    cls: 'in_progress' },
  completed:   { label: 'Terminé',     cls: 'completed'  },
  pending:     { label: 'En attente',  cls: 'pending'    },
  overdue:     { label: 'En retard',   cls: 'overdue'    },
};

// Mapping des types avec couleurs (optionnel)
const TYPE_CONFIG = {
  Fullstack: { label: 'Fullstack', icon: '🧩', stripe: 'Fullstack' },
  Frontend:  { label: 'Frontend',  icon: '⚛️', stripe: 'Frontend'  },
  Backend:   { label: 'Backend',   icon: '⚙️', stripe: 'Backend'   },
};

export function ProjectCard({ project, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date)) return null;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    navigate(`/workspace/projects/${project.id}`);
  };

  // Récupérer les infos du statut
  const statusInfo = STATUS_MAP[project.status] || STATUS_MAP.pending;
  
  // Récupérer les infos du type
  const typeInfo = TYPE_CONFIG[project.type] || { label: project.type || 'Projet', icon: '📁', stripe: 'default' };

  const formattedDate = formatDate(project.dueDate);

  return (
    <>
      <div className="project-card">
        {/* Bandeau couleur selon le type */}
        <div className={`project-card__stripe project-card__stripe--${typeInfo.stripe}`} />

        <div className="project-card__body">
          {/* Ligne 1 : badge type + statut + boutons action */}
          <div className="project-card__toprow">
            <span className={`project-card__type project-card__type--${typeInfo.stripe}`}>
              <span className="project-card__type-icon">{typeInfo.icon}</span>
              {typeInfo.label}
            </span>

            {/* Badge de statut */}
            <span className={`project-card__status project-card__status--${statusInfo.cls}`}>
              {statusInfo.label}
            </span>

            <div className="project-card__actions">
              <button
                className="project-card__delete"
                onClick={() => setShowConfirm(true)}
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Titre */}
          <h4 className="project-card__title">{project.name}</h4>

          {/* Description */}
          {project.description && (
            <p className="project-card__description">{project.description}</p>
          )}

          {/* Date d'échéance */}
          {formattedDate && (
            <div className="project-card__date-row">
              <span className="project-card__date-icon">📅</span>
              <span>Échéance: {formattedDate}</span>
            </div>
          )}
        </div>

        {/* Footer avec bouton Ouvrir */}
        <div className="project-card__footer">
          <div className="project-card__tags">
            {/* Tags tech optionnels */}
            {project.frontendFramework && (
              <span className="project-card__tag">{project.frontendFramework}</span>
            )}
            {project.backendFramework && (
              <span className="project-card__tag">{project.backendFramework}</span>
            )}
            {project.database && (
              <span className="project-card__tag">{project.database}</span>
            )}
            {project.isDockerEnabled && (
              <span className="project-card__tag project-card__tag--docker">🐳 Docker</span>
            )}
          </div>
          <button className="project-card__open-btn" onClick={handleOpen}>
            Ouvrir →
          </button>
        </div>
      </div>

      {/* MODAL CONFIRMATION SUPPRESSION */}
      {showConfirm &&
        createPortal(
          <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
            <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
              <h3>Supprimer le projet</h3>
              <p>
                Êtes-vous sûr de vouloir supprimer "<strong>{project.name}</strong>" ?<br />
                Cette action est irréversible.
              </p>
              <div className="confirm-actions">
                <button onClick={() => setShowConfirm(false)}>Annuler</button>
                <button
                  className="danger"
                  onClick={() => {
                    onDelete(project.id);
                    setShowConfirm(false);
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
