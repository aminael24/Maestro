import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProjectCard.css';
import { createPortal } from 'react-dom';

export function ProjectCard({ project, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/workspace/projects/${project.id}`);
  };

  return (
    <>
      <div className="project-card">
        <div className="project-card__header">
          <div className="project-card__icon">📁</div>

          <div style={{ flex: 1 }}>
            <h4 className="project-card__title">{project.name}</h4>
          </div>

          {/* Bouton Edit */}
          <button
            className="project-card__edit"
            onClick={handleEdit}
            title="Ouvrir l'éditeur"
          >
            ✎
          </button>

          {/* Bouton Delete */}
          <button
            className="project-card__delete"
            onClick={() => setShowConfirm(true)}
            title="Supprimer"
          >
            ✕
          </button>
        </div>

        {project.description && (
          <p className="project-card__description">
            {project.description}
          </p>
        )}

        <div className="project-card__footer">
          <span className="project-card__date">
            📅 {formatDate(project.dueDate)}
          </span>
          <span className="project-card__type-badge">
            {project.type}
          </span>
        </div>
      </div>

      {/* MODAL CONFIRMATION SUPPRESSION */}
      {showConfirm &&
        createPortal(
          <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
            <div
              className="confirm-box"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Supprimer le projet</h3>
              <p>
                Êtes-vous sûr de vouloir supprimer "<strong>{project.name}</strong>" ?
              </p>

              <div className="confirm-actions">
                <button onClick={() => setShowConfirm(false)}>
                  Annuler
                </button>

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
