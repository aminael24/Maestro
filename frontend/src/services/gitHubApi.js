import { api, apiUtils } from './api';

const GITHUB_PREFIX = '/api/github';

export async function getAuthorizationUrl(provider, redirectUri, state) {
  try {
    const response = await api.get(`${GITHUB_PREFIX}/providers/${provider}/auth-url`, {
      params: { redirectUri, state },
    });
    return response.data.authUrl;
  } catch (error) {
    apiUtils.handleError(error);
  }
}

export async function exchangeCode(provider, code, redirectUri) {
  try {
    const response = await api.post(`${GITHUB_PREFIX}/providers/${provider}/token`, {
      code,
      redirectUri,
    });
    return response.data;
  } catch (error) {
    apiUtils.handleError(error);
  }
}

export async function createRepository(provider, projectId, accessToken, name, description, isPrivate) {
  try {
    const response = await api.post(`${GITHUB_PREFIX}/providers/${provider}/repositories`, {
      projectId,
      accessToken,
      name,
      description,
      isPrivate,
    });
    return response.data;
  } catch (error) {
    apiUtils.handleError(error);
  }
}

export async function getSavedRepositories() {
  try {
    const response = await api.get(`${GITHUB_PREFIX}/repositories`);
    return response.data;
  } catch (error) {
    apiUtils.handleError(error);
  }
}

export async function getSavedRepository(projectId) {
  try {
    const response = await api.get(`${GITHUB_PREFIX}/repositories/${projectId}`);
    return response.data;
  } catch (error) {
    apiUtils.handleError(error);
  }
}

// ── Real commit & push ──────────────────────────────────────────
export async function commitRepository(projectId, message) {
  try {
    const response = await api.post(`${GITHUB_PREFIX}/repositories/${projectId}/commit`, { message });
    return response.data;
  } catch (error) {
    apiUtils.handleError(error);
  }
}

export async function pushRepository(projectId) {
  try {
    const response = await api.post(`${GITHUB_PREFIX}/repositories/${projectId}/push`);
    return response.data;
  } catch (error) {
    apiUtils.handleError(error);
  }
}