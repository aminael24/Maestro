import { create } from 'zustand';
import { deployProject, getDeployStatus } from '../services/deployService';

export const useDeployStore = create((set, get) => ({
  isDeploying: false,
  deployedUrl: null,
  serviceId: null,
  status: 'idle', // idle | deploying | live | failed
  error: null,

  deploy: async ({ repoUrl, branch, serviceName, renderApiKey, buildCommand, startCommand }) => {
    set({ isDeploying: true, error: null, status: 'deploying', deployedUrl: null });
    try {
      const result = await deployProject({ repoUrl, branch, serviceName, renderApiKey, buildCommand, startCommand });
      set({ serviceId: result.serviceId, deployedUrl: result.serviceUrl, isDeploying: false, status: 'deploying' });
      get().pollStatus(result.serviceId, renderApiKey);
    } catch (err) {
      set({ isDeploying: false, status: 'failed', error: err.message });
    }
  },

  pollStatus: (serviceId, renderApiKey) => {
    const interval = setInterval(async () => {
      try {
        const status = await getDeployStatus(serviceId, renderApiKey);
        // Render statuses: build_in_progress, update_in_progress, live, deactivated, build_failed
        if (status === 'live') {
          set({ status: 'live' });
          clearInterval(interval);
        } else if (status === 'build_failed' || status === 'deactivated') {
          set({ status: 'failed', error: `Render: ${status}` });
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 8000);
  },

  reset: () => set({ isDeploying: false, deployedUrl: null, serviceId: null, status: 'idle', error: null }),
}));