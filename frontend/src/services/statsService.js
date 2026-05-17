// services/statsService.js
import { api } from './api';

export const statsService = {
  async getStats() {
    try {
      const response = await api.get('/api/projects/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      return null;
    }
  },
  
  async getActivityHistory() {
    try {
      const response = await api.get('/api/projects/activity');
      return response.data;
    } catch (error) {
      console.error('Erreur chargement activity:', error);
      return null;
    }
  },
  
  async getAiStats() {
    try {
      const response = await api.get('/api/ai/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur chargement AI stats:', error);
      return { data: [0, 0, 0, 0, 0, 0, 0] };
    }
  }
};