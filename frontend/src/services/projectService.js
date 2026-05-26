import { api, apiUtils } from './api';

// Mode mock — activable en dev via VITE_MOCK_MODE=true dans .env.local
// Lecture indirecte de la variable d'env pour éviter import.meta dans le
// parser Jest (qui le rejette à la lecture). Vite remplace
// import.meta.env.VITE_MOCK_MODE au build, donc côté browser ça marche.
// Côté Jest, on tombe sur process.env qui retourne undefined → false.
const MOCK_MODE = (() => {
  try {
    // eslint-disable-next-line no-new-func
    const viteEnv = new Function('try { return import.meta.env; } catch { return undefined; }')();
    if (viteEnv) return viteEnv.VITE_MOCK_MODE === 'true';
  } catch {
    // ignore
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_MOCK_MODE === 'true';
  }
  return false;
})();

const mockProjects = [
  { id: '1', name: 'App React Native',  description: 'Mobile application development', dueDate: '2026-05-15', status: 'active' },
  { id: '2', name: 'Maestro Dashboard', description: 'Interface de pilotage',          dueDate: '2026-05-20', status: 'active' },
];

export const projectService = {
  async getProjects() {
    if (MOCK_MODE) return mockProjects;
    try {
      const { data } = await api.get('/api/projects');
      return data;
    } catch (err) {
      apiUtils.handleError(err);
      throw err;
    }
  },
};