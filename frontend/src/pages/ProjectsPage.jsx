import { useState } from 'react';
import { createPortal } from 'react-dom'; // 🔥 IMPORTANT
import { useProjects } from '../hooks/useProjects';
import { ProjectForm } from '../components/Projects/ProjectForm';
import { ProjectList } from '../components/Projects/ProjectList';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const { projects, loading, error, createProject, deleteProject } = useProjects();
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleCreateProject = async (data) => {
    try {
      await createProject(data);
      setIsFormVisible(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="projects-page">
      <header className="projects-page__header">
        <h1>Projects</h1>
        {!isFormVisible && (
          <button
            className="btn-create-project"
            onClick={() => setIsFormVisible(true)}
          >
            + Create New Project
          </button>
        )}
      </header>

      <main className="projects-page__content">
        <div className="projects-page__list-container">
          <ProjectList
            projects={projects}
            loading={loading}
            error={error}
            onDelete={deleteProject}
          />
        </div>
      </main>

      {/* 🔥 MODAL AVEC PORTAL */}
      {isFormVisible &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setIsFormVisible(false)}
          >
            <div
              className="projects-page__form-container"
              onClick={(e) => e.stopPropagation()}
            >
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