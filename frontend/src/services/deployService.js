import { api } from './api';

export async function deployProject({ repoUrl, branch, serviceName, railwayToken, buildCommand, startCommand, userId }) {
  const res = await api.post('/api/deploy/railway', {
    repoUrl, branch, serviceName, railwayToken,
    buildCommand: buildCommand || undefined,
    startCommand: startCommand || undefined,
    userId: userId || 'unknown',
  });
  return res.data; // { serviceId, serviceUrl, status }
}

export async function getDeployStatus(serviceId, railwayToken) {
  const res = await api.get(`/api/deploy/railway/${serviceId}/status`, {
    params: { railwayToken }
  });
  return res.data; // { status, url }
}