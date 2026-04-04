import { api, apiUtils } from './api';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

const mockProjects = [
  { id: '1', name: 'App React Native', description: 'Mobile application development', dueDate: '2026-05-15', status: 'active' },
];

export const projectService = {
  async getProjects() {
    if (MOCK_MODE) return mockProjects;
    try {
      const response = await api.get('/api/projects');
      return response.data;
    } catch (error) { throw apiUtils.handleError(error); }
  },

  async createProject(projectData) {
    if (MOCK_MODE) return { id: Date.now().toString(), ...projectData };
    try {
      const response = await api.post('/api/projects', projectData);
      return response.data;
    } catch (error) { throw apiUtils.handleError(error); }
  },

  async deleteProject(projectId) {
    if (MOCK_MODE) return true;
    try {
      await api.delete(`/api/projects/${projectId}`);
      return true;
    } catch (error) { throw apiUtils.handleError(error); }
  }
};