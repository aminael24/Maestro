import { create } from 'zustand';
import { isDevMode } from '../utils/env';
import { gitHubServiceMock } from '../services/gitHubServiceMock';
import * as gitHubApi from '../services/gitHubApi';

const deriveRepoName = (remoteUrl) => {
  if (!remoteUrl) return 'Untitled repository';
  const segments = remoteUrl.split('/').filter(Boolean);
  const candidate = segments[segments.length - 1] ?? remoteUrl;
  return candidate.replace(/\.git$/, '');
};

const normalizeRepository = (repo) => ({
  ...repo,
  name: repo.name || deriveRepoName(repo.remoteUrl),
  description: repo.description || `${repo.provider ?? 'GitHub'} repository`,
});

const getRedirectUri = () => `${window.location.origin}/github/callback`;

export const useGitHubStore = create((set, get) => ({
  isConnected: false,
  user: null,
  repositories: [],
  selectedRepository: null,
  currentBranch: 'main',
  syncStatus: 'idle',
  isLoading: false,
  error: null,
  accessToken: null,

  setConnected: (connected) => set({ isConnected: connected }),
  setUser: (user) => set({ user }),
  setRepositories: (repositories) => set({ repositories }),
  setSelectedRepository: (repo) => set({ selectedRepository: repo }),
  setCurrentBranch: (branch) => set({ currentBranch: branch }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setAccessToken: (token) => set({ accessToken: token }),

  connect: async () => {
    if (isDevMode) {
      set({ isLoading: true });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      set({
        isConnected: true,
        user: {
          id: 'user-123',
          name: 'Dev User',
          username: 'devuser',
          avatar: 'https://api.github.com/users/torvalds/avatar_url',
        },
        isLoading: false,
      });
      return null;
    }

    set({ isLoading: true, error: null });
    try {
      const state = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const redirectUri = getRedirectUri();
      sessionStorage.setItem('github_oauth_state', state);
      const authUrl = await gitHubApi.getAuthorizationUrl('github', redirectUri, state);
      set({ isLoading: false });
      return authUrl;
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  finishOAuthCallback: async (code, state) => {
    if (isDevMode) {
      set({ isConnected: true, isLoading: false });
      await get().fetchRepositories();
      return;
    }

    set({ isLoading: true, error: null });
    const expectedState = sessionStorage.getItem('github_oauth_state');
    if (!expectedState || expectedState !== state) {
      set({ isLoading: false, error: 'OAuth state validation failed.' });
      throw new Error('OAuth state validation failed.');
    }

    try {
      const redirectUri = getRedirectUri();
      const tokenResponse = await gitHubApi.exchangeCode('github', code, redirectUri);
      if (!tokenResponse?.accessToken) {
        throw new Error('GitHub did not return an access token.');
      }

      set({ accessToken: tokenResponse.accessToken, isConnected: true, isLoading: false });
      sessionStorage.removeItem('github_oauth_state');
      await get().fetchRepositories();
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  disconnect: () => {
    sessionStorage.removeItem('github_oauth_state');
    set({
      isConnected: false,
      user: null,
      repositories: [],
      selectedRepository: null,
      currentBranch: 'main',
      syncStatus: 'idle',
      accessToken: null,
    });
  },

  fetchRepositories: async () => {
    set({ isLoading: true, error: null });
    if (isDevMode) {
      await get().mockFetchRepositories();
      return;
    }

    try {
      const repositories = await gitHubApi.getSavedRepositories();
      set({
        repositories: (repositories || []).map(normalizeRepository),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : String(error) });
    }
  },

  selectRepository: (repo) => {
    set({ selectedRepository: repo, currentBranch: 'main', syncStatus: 'idle' });
  },

  createRepository: async ({ name, description, isPrivate }) => {
    set({ isLoading: true, error: null });

    if (isDevMode) {
      await gitHubServiceMock.createRepository('github', 'project-123', 'mock-token', name, description, isPrivate);
      await get().fetchRepositories();
      set({ isLoading: false });
      return;
    }

    try {
      const accessToken = get().accessToken;
      if (!accessToken) throw new Error('GitHub access token is required to create a repository.');

      const projectId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await gitHubApi.createRepository('github', projectId, accessToken, name.trim(), description.trim(), isPrivate);
      await get().fetchRepositories();
      const createdRepo = get().repositories.find((repo) => repo.name === name.trim() || repo.remoteUrl?.endsWith(`/${name.trim()}.git`));
      if (createdRepo) {
        get().setSelectedRepository(createdRepo);
      }
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  mockFetchRepositories: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({
      repositories: [
        {
          id: 'repo-1',
          name: 'maestro-frontend',
          description: 'Maestro frontend application',
          url: 'https://github.com/user/maestro-frontend',
          private: false,
        },
        {
          id: 'repo-2',
          name: 'maestro-backend',
          description: 'Maestro backend services',
          url: 'https://github.com/user/maestro-backend',
          private: true,
        },
      ],
      isLoading: false,
    });
  },

  mockSelectRepository: (repo) => {
    set({ selectedRepository: repo, currentBranch: 'main', syncStatus: 'idle' });
  },

  mockCreateBranch: async (branchName) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({ currentBranch: branchName, isLoading: false });
  },

  mockCommit: async (message) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set({ syncStatus: 'success', isLoading: false });
    setTimeout(() => set({ syncStatus: 'idle' }), 2000);
  },

  mockPush: async () => {
    set({ syncStatus: 'syncing' });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    set({ syncStatus: 'success' });
    setTimeout(() => set({ syncStatus: 'idle' }), 2000);
  },
}));
