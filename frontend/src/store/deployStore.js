import { create } from 'zustand';
import { deployProject, getDeployStatus } from '../services/deployService';

export const useDeployStore = create((set, get) => ({
  isDeploying: false,
  deployedUrl: null,
  serviceId: null,
  status: 'idle', // idle | deploying | live | failed
  error: null,

  deploy: async ({ repoUrl, branch, serviceName, railwayToken, buildCommand, startCommand, userId }) => {
    set({ isDeploying: true, error: null, status: 'deploying', deployedUrl: null, serviceId: null });
    try {
      const result = await deployProject({ repoUrl, branch, serviceName, railwayToken, buildCommand, startCommand, userId });
      set({ serviceId: result.serviceId, deployedUrl: result.serviceUrl, isDeploying: false });
      // Start polling status
      get().pollStatus(result.serviceId, railwayToken);
    } catch (err) {
      set({ isDeploying: false, status: 'failed', error: err.response?.data?.error ?? err.message });
    }
  },

  pollStatus: (serviceId, railwayToken) => {
    let attempts = 0;
    const maxAttempts = 60; // 8 min max (60 × 8s)
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        set({ status: 'failed', error: 'Deployment timed out after 8 minutes.' });
        clearInterval(interval);
        return;
      }
      try {
        const { status, url } = await getDeployStatus(serviceId, railwayToken);
        if (status === 'success') {
          set({ status: 'live', deployedUrl: url ?? get().deployedUrl });
          clearInterval(interval);
        } else if (status === 'failed' || status === 'crashed') {
          set({ status: 'failed', error: `Railway reported: ${status}` });
          clearInterval(interval);
        }
        // else still deploying → keep polling
      } catch {
        clearInterval(interval);
      }
    }, 8000);
  },

  reset: () => set({ isDeploying: false, deployedUrl: null, serviceId: null, status: 'idle', error: null }),
}));