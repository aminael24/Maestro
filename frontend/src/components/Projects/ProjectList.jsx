import { ProjectCard } from './ProjectCard';
import './ProjectList.css';

export function ProjectList({ projects, loading, error, onDelete }) {
  if (loading) {
    return <div className="project-list__spinner">Loading...</div>;
  }

  if (error) {
    return <div className="project-list__error">⚠️ {error}</div>;
  }

  if (!projects || projects.length === 0) {
    return <div className="project-list__empty">No projects found.</div>;
  }

  return (
    <div className="project-list">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onDelete={onDelete} />
      ))}
    </div>
  );
}