import { create } from 'zustand';
import { deployProject, getDeployStatus } from '../services/deployService';

export const useDeployStore = create((set, get) => ({
  isDeploying: false,
  deployedUrl: null,
  serviceId: null,
  status: 'idle', // idle | deploying | live | failed
  error: null,
  notifications: [],

  deploy: async ({ repoUrl, branch, serviceName, railwayToken, buildCommand, startCommand, userId }) => {
    set({ isDeploying: true, error: null, status: 'deploying', deployedUrl: null });
    try {
      const result = await deployProject({ repoUrl, branch, serviceName, railwayToken, buildCommand, startCommand, userId });
      set({ serviceId: result.serviceId, deployedUrl: result.serviceUrl, isDeploying: false, status: 'deploying' });
      get().pollStatus(result.serviceId, railwayToken);
    } catch (err) {
      set({ isDeploying: false, status: 'failed', error: err.response?.data?.error ?? err.message });
    }
  },

  pollStatus: (serviceId, railwayToken) => {
    const interval = setInterval(async () => {
      try {
        const { status, url } = await getDeployStatus(serviceId, railwayToken);
        if (status === 'success') {
          set({ status: 'live', deployedUrl: url ?? get().deployedUrl });
          clearInterval(interval);
        } else if (status === 'failed' || status === 'crashed') {
          set({ status: 'failed', error: `Railway: ${status}` });
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 8000);
  },

  addNotification: (msg) => set(s => ({ notifications: [msg, ...s.notifications].slice(0, 20) })),
  setStatus: (status) => set({ status }),
  setDeployedUrl: (url) => set({ deployedUrl: url }),

  reset: () => set({ isDeploying: false, deployedUrl: null, serviceId: null, status: 'idle', error: null }),
}));