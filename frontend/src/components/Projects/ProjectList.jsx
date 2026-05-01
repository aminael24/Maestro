import { ProjectCard } from './ProjectCard';
import './ProjectList.css';

export function ProjectList({ projects, loading, error, onDelete }) {
  if (loading) {
    return <div className="project-list__spinner">Chargement des projets...</div>;
  }

  if (error) {
    return <div className="project-list__error">⚠️ {error}</div>;
  }

  if (!projects || projects.length === 0) {
    return <div className="project-list__empty">Aucun projet trouvé.</div>;
  }

  return (
    <div className="project-list">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onDelete={onDelete} />
      ))}
    </div>
  );
}