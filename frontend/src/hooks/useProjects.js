import { useState, useEffect, useCallback } from 'react';
import { projectService } from '../services/projectService';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectService.getProjects();
      setProjects(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = useCallback(async (projectData) => {
    setLoading(true);
    setError(null);
    try {
      const newProject = await projectService.createProject(projectData);
      setProjects((prev) => [...prev, newProject]);
      return newProject;
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du projet');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (projectId) => {
    setLoading(true);
    setError(null);
    try {
      await projectService.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression du projet');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { projects, loading, error, createProject, deleteProject, refetch: fetchProjects };
}