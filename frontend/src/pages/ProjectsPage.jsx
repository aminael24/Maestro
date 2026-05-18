import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { ProjectForm } from '../components/Projects/ProjectForm';
import { ProjectList } from '../components/Projects/ProjectList';
import './ProjectsPage.css';

const TYPE_FILTERS = [
  { value: 'Tous',      label: 'Tous'     },
  { value: 'Fullstack', label: 'Fullstack' },
  { value: 'Frontend',  label: 'Frontend'  },
  { value: 'Backend',   label: 'Backend'   },
];

export default function ProjectsPage() {
  const { projects, loading, error, createProject, deleteProject } = useProjects();

  const {
    searchTerm   = '',
    activeStatus = 'all',
    isFormVisible = false,
    setIsFormVisible,
  } = useOutletContext();

  // Type filter managed locally in the page
  const [activeType, setActiveType] = useState('Tous');

  const handleCreateProject = async (data) => {
    try {
      await createProject(data);
      setIsFormVisible(false);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = activeStatus === 'all' || p.status === activeStatus;
    const matchType   = activeType === 'Tous'  || p.type   === activeType;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="projects-page">

      {/* ── Barre filtres type de projet ── */}
      <div className="projects-page__type-bar">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            className={[
              'type-filter-btn',
              `type-filter-btn--${f.value.toLowerCase()}`,
              activeType === f.value ? 'type-filter-btn--active' : '',
            ].join(' ')}
            onClick={() => setActiveType(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Grille de projets ── */}
      <ProjectList
        projects={filteredProjects}
        loading={loading}
        error={error}
        onDelete={deleteProject}
      />

      {/* ── Modal création ── */}
      {isFormVisible &&
        createPortal(
          <div className="modal-overlay" onClick={() => setIsFormVisible(false)}>
            <div className="projects-page__form-container" onClick={(e) => e.stopPropagation()}>
              <ProjectForm
                onSubmit={handleCreateProject}
                onCancel={() => setIsFormVisible(false)}
                loading={loading}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
