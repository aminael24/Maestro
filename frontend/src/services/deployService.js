import { api, apiUtils } from './api';

export async function deployProject({ repoUrl, branch, serviceName, renderApiKey, buildCommand, startCommand }) {
  try {
    const response = await api.post('/api/deploy', {
      repoUrl, branch, serviceName, renderApiKey, buildCommand, startCommand
    });
    return response.data; // { serviceId, serviceUrl, status }
  } catch (error) {
    apiUtils.handleError(error);
  }
}

export async function getDeployStatus(serviceId, renderApiKey) {
  try {
    const response = await api.get(`/api/deploy/${serviceId}/status`, {
      params: { renderApiKey }
    });
    return response.data.status;
  } catch (error) {
    apiUtils.handleError(error);
  }
}