import { isDevMode } from '../utils/env';

/**
 * GitHub Service Mock for Dev Mode
 * Simulates real API behavior with delays and realistic responses
 */

export const gitHubServiceMock = {
  /**
   * List available providers
   */
  async getAvailableProviders() {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(300);
    return ['github', 'gitlab'];
  },

  /**
   * Get OAuth authorization URL
   */
  async getAuthorizationUrl(provider, redirectUri, state) {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(200);
    return {
      authUrl: `https://github.com/login/oauth/authorize?client_id=demo&redirect_uri=${redirectUri}&state=${state}&scope=repo`,
    };
  },

  /**
   * Exchange OAuth code for token
   */
  async exchangeCode(provider, code, redirectUri) {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(500);
    return {
      accessToken: `mock_token_${Date.now()}`,
      tokenType: 'bearer',
      scope: 'repo',
    };
  },

  /**
   * List user repositories
   */
  async listRepositories(provider, accessToken) {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(800);
    return [
      {
        id: 'repo-1',
        name: 'maestro-frontend',
        description: 'Maestro frontend application',
        url: 'https://github.com/user/maestro-frontend',
        private: false,
        cloneUrl: 'https://github.com/user/maestro-frontend.git',
      },
      {
        id: 'repo-2',
        name: 'maestro-backend',
        description: 'Maestro backend services',
        url: 'https://github.com/user/maestro-backend',
        private: true,
        cloneUrl: 'git@github.com:user/maestro-backend.git',
      },
      {
        id: 'repo-3',
        name: 'maestro-infra',
        description: 'Infrastructure as code',
        url: 'https://github.com/user/maestro-infra',
        private: false,
        cloneUrl: 'https://github.com/user/maestro-infra.git',
      },
    ];
  },

  /**
   * Get repository metadata
   */
  async getRepositoryMetadata(provider, accessToken, owner, repoName) {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(400);
    return {
      id: 'repo-1',
      name: repoName,
      owner,
      description: `Repository: ${owner}/${repoName}`,
      url: `https://github.com/${owner}/${repoName}`,
      private: false,
      cloneUrl: `https://github.com/${owner}/${repoName}.git`,
      defaultBranch: 'main',
    };
  },

  /**
   * Create repository
   */
  async createRepository(provider, projectId, accessToken, name, description, isPrivate) {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(1000);
    return {
      id: `repo-${Date.now()}`,
      name,
      description,
      private: isPrivate,
      url: `https://github.com/user/${name}`,
      cloneUrl: `https://github.com/user/${name}.git`,
      defaultBranch: 'main',
    };
  },

  /**
   * Initialize repository locally
   */
  async initRepository(repositoryId, localPath) {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(600);
    return {
      success: true,
      message: 'Repository initialized',
      path: localPath,
    };
  },

  /**
   * Create branch
   */
  async createBranch(repositoryId, branchName) {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(400);
    return {
      success: true,
      branch: branchName,
      message: `Branch '${branchName}' created`,
    };
  },

  /**
   * Commit changes
   */
  async commit(repositoryId, message) {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(800);
    return {
      success: true,
      commitSha: `mock_sha_${Date.now().toString(36)}`,
      message: message,
      author: 'Dev User',
    };
  },

  /**
   * Push changes
   */
  async push(repositoryId, branchName) {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(1200);
    return {
      success: true,
      branch: branchName,
      message: `Pushed to ${branchName}`,
    };
  },

  /**
   * Fetch updates
   */
  async fetch(repositoryId) {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(700);
    return {
      success: true,
      message: 'Fetched latest changes',
      updates: 2,
    };
  },

  /**
   * Get repository status
   */
  async getStatus(repositoryId) {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(300);
    return {
      branch: 'main',
      isClean: true,
      unstagedChanges: 0,
      stagedChanges: 0,
      untrackedFiles: 0,
    };
  },

  /**
   * Sync repository
   */
  async sync(repositoryId) {
    if (!isDevMode) throw new Error('[DEV MODE] API call blocked');
    await this._delay(1500);
    return {
      success: true,
      message: 'Repository synced',
      lastSync: new Date().toISOString(),
    };
  },

  /**
   * Helper: Simulate network delay
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};
