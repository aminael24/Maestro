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
      setFormError('Project name is required');
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({ // Reset form after success
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
      setFormError(err.message || 'Failed to create project. Please check your session.');
    }
  };

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <h2 className="project-form__title">New Project</h2>
      {formError && <div className="project-form__error">{formError}</div>}

      <div className="project-form__group">
        <label htmlFor="name" className="project-form__label">Project Name</label>
        <input
          id="name"
          type="text"
          name="name"
          className="project-form__input"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: Cloud Migration"
          required
        />
      </div>

      <div className="project-form__group">
        <label htmlFor="description" className="project-form__label">Description</label>
        <textarea
          id="description"
          name="description"
          className="project-form__textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your project goals..."
          rows="3"
        />
      </div>

      <div className="project-form__group">
        <label htmlFor="dueDate" className="project-form__label">Due Date</label>
        <input id="dueDate" type="date" name="dueDate" className="project-form__input" value={formData.dueDate} onChange={handleChange} />
      </div>

      <div className="project-form__group">
        <label htmlFor="type" className="project-form__label">Project Type</label>
        <select id="type" name="type" className="project-form__input" value={formData.type} onChange={handleChange}>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Fullstack">Fullstack</option>
        </select>
      </div>

      {(formData.type === 'Frontend' || formData.type === 'Fullstack') && (
        <div className="project-form__group">
          <label htmlFor="frontendFramework" className="project-form__label">Frontend Framework</label>
          <select id="frontendFramework" name="frontendFramework" className="project-form__input" value={formData.frontendFramework} onChange={handleChange}>
            <option value="React">React</option>
          </select>
        </div>
      )}

      {(formData.type === 'Backend' || formData.type === 'Fullstack') && (
        <div className="project-form__group">
          <label htmlFor="backendFramework" className="project-form__label">Backend Framework</label>
          <select id="backendFramework" name="backendFramework" className="project-form__input" value={formData.backendFramework} onChange={handleChange}>
            <option value="Express">Express (Node.js)</option>
          </select>
        </div>
      )}

      <div className="project-form__group">
        <label htmlFor="database" className="project-form__label">Database</label>
        <select id="database" name="database" className="project-form__input" value={formData.database} onChange={handleChange}>
          <option value="PostgreSQL">PostgreSQL</option>
        </select>
      </div>

     <div className="project-form__group">
  <label className="project-form__checkbox">
    <input
      type="checkbox"
      name="isDockerEnabled"
      checked={formData.isDockerEnabled}
      onChange={handleChange}
    />
    Enable Docker Containerization
  </label>
</div>

      <div className="project-form__actions">
        <button type="button" className="project-form__button project-form__button--cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="project-form__button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}