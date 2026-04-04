import { useState } from 'react';
import './ProjectCard.css';
import { createPortal } from 'react-dom';

export function ProjectCard({ project, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  return (
    <>
      <div className="project-card">
        <div className="project-card__header">
          <div className="project-card__icon">📁</div>

          <div style={{ flex: 1 }}>
            <h4 className="project-card__title">{project.name}</h4>
          </div>

          {/* 🔥 bouton delete */}
          <button
            className="project-card__delete"
            onClick={() => setShowConfirm(true)}
            title="Delete"
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

          {project.status && (
            <span
              className={`project-card__status project-card__status--${project.status}`}
            >
              {project.status}
            </span>
          )}
        </div>
      </div>

      {/* 🔥 MODAL CONFIRMATION */}
     {showConfirm &&
  createPortal(
    <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
      <div
        className="confirm-box"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Delete Project</h3>
        <p>
          Are you sure you want to delete "<strong>{project.name}</strong>"?
        </p>

        <div className="confirm-actions">
          <button onClick={() => setShowConfirm(false)}>
            Cancel
          </button>

            <button
            className="danger"
            onClick={() => {
              onDelete(project.id);
              setShowConfirm(false);
            }}
          >
            Delete
          </button>
            </div>
          </div>
        </div>,
    document.body
      )}
    </>
  );
}