import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom'; 
import { useProjects } from '../hooks/useProjects';
import { ProjectForm } from '../components/Projects/ProjectForm';
import { ProjectList } from '../components/Projects/ProjectList';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const { projects, loading, error, createProject, deleteProject } = useProjects();
  const { searchTerm, isFormVisible, setIsFormVisible } = useOutletContext();

  const handleCreateProject = async (data) => {
    try {
      await createProject(data);
      setIsFormVisible(false);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="projects-page">
      <header className="projects-page__header">
       
      </header>

      <main className="projects-page__content">
        <div className="projects-page__list-container">
          <ProjectList
            projects={filteredProjects}
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