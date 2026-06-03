import { create } from 'zustand';
import { api } from '../services/api';

export const useRailwayStore = create((set) => ({
  isConnected: false,
  token: null,
  isLoading: false,
  error: null,

  connect: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/api/railway/auth-url');
      const { authUrl, state } = res.data;
      sessionStorage.setItem('railway_oauth_state', state);
      window.location.href = authUrl;
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  finishCallback: async (code, state) => {
    const expected = sessionStorage.getItem('railway_oauth_state');
    if (expected !== state) throw new Error('Railway OAuth state mismatch');
    set({ isLoading: true });
    const res = await api.post('/api/railway/token', { code });
    const token = res.data.access_token;
    sessionStorage.removeItem('railway_oauth_state');
    set({ isConnected: true, token, isLoading: false });
    return token;
  },

  disconnect: () => {
    sessionStorage.removeItem('railway_oauth_state');
    set({ isConnected: false, token: null });
  },
}));