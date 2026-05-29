import React from 'react';
import { useState } from 'react';
import './ProjectForm.css';

export function ProjectForm({ onSubmit, onCancel, loading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    type: 'Fullstack',
    frontendFramework: 'React',
    backendFramework: 'Express',
    database: 'PostgreSQL',
    isDockerEnabled: true,
  });
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name.trim()) {
      setFormError('Le nom du projet est obligatoire');
      return;
    }
    try {
      await onSubmit(formData);
      setFormData({
        name: '',
        description: '',
        dueDate: '',
        type: 'Fullstack',
        frontendFramework: 'React',
        backendFramework: 'Express',
        database: 'PostgreSQL',
        isDockerEnabled: true,
      });
    } catch (err) {
      setFormError(err.message || 'Échec de la création du projet. Veuillez vérifier votre session.');
    }
  };

  const showDatabase = formData.type === 'Backend' || formData.type === 'Fullstack';

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <h2 className="project-form__title">Nouveau Projet</h2>
      {formError && <div className="project-form__error">{formError}</div>}

      {/* Nom */}
      <div className="project-form__group">
        <label htmlFor="name" className="project-form__label">Nom du Projet</label>
        <input
          id="name"
          type="text"
          name="name"
          className="project-form__input"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: Migration Cloud"
          required
        />
      </div>

      {/* Description */}
      <div className="project-form__group">
        <label htmlFor="description" className="project-form__label">Description</label>
        <textarea
          id="description"
          name="description"
          className="project-form__textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder="Décrivez les objectifs de votre projet..."
          rows="3"
        />
      </div>

      {/* Date + Type */}
      <div className="project-form__row">
        <div className="project-form__group">
          <label htmlFor="dueDate" className="project-form__label">Date d'échéance</label>
          <input
            id="dueDate"
            type="date"
            name="dueDate"
            className="project-form__input"
            value={formData.dueDate}
            onChange={handleChange}
          />
        </div>
        <div className="project-form__group">
          <label htmlFor="type" className="project-form__label">Type de Projet</label>
          <select
            id="type"
            name="type"
            className="project-form__input"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="Fullstack">Fullstack (Web)</option>
            <option value="Frontend">Interface Seule</option>
            <option value="Backend">API Service</option>
          </select>
        </div>
      </div>

      {/* Framework Frontend — Frontend & Fullstack uniquement */}
      {(formData.type === 'Frontend' || formData.type === 'Fullstack') && (
        <div className="project-form__group">
          <label className="project-form__label">Framework Frontend</label>
          <div className="project-form__fixed-value">React</div>
        </div>
      )}

      {/* Framework Backend — Backend & Fullstack uniquement */}
      {(formData.type === 'Backend' || formData.type === 'Fullstack') && (
        <div className="project-form__group">
          <label className="project-form__label">Framework Backend</label>
          <div className="project-form__fixed-value">Express (Node.js)</div>
        </div>
      )}

      {/* PostgreSQL + Docker — Backend & Fullstack uniquement */}
      {showDatabase && (
        <div className="project-form__row">
          <div className="project-form__group">
            <label className="project-form__label">Base de données</label>
            <div className="project-form__fixed-value">PostgreSQL</div>
          </div>
          <div className="project-form__group" style={{ justifyContent: 'center' }}>
            <label className="project-form__checkbox">
              <input
                type="checkbox"
                name="isDockerEnabled"
                checked={formData.isDockerEnabled}
                onChange={handleChange}
              />
              Activer la conteneurisation Docker
            </label>
          </div>
        </div>
      )}

      {/* Docker seul pour Frontend (pas de BDD) */}
      {formData.type === 'Frontend' && (
        <div className="project-form__group">
          <label className="project-form__checkbox">
            <input
              type="checkbox"
              name="isDockerEnabled"
              checked={formData.isDockerEnabled}
              onChange={handleChange}
            />
            Activer la conteneurisation Docker
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="project-form__actions">
        <button
          type="button"
          className="project-form__button project-form__button--cancel"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </button>
        <button type="submit" className="project-form__button" disabled={loading}>
          {loading ? 'Création...' : 'Créer le projet'}
        </button>
      </div>
    </form>
  );
}
