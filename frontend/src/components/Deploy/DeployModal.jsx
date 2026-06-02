import { useState } from 'react';
import { useDeployStore } from '../../store/deployStore';
import { useGitHubStore } from '../../store/gitHubStore';

export default function DeployModal({ onClose }) {
  const { selectedRepository, currentBranch } = useGitHubStore();
  const { deploy, isDeploying, status, deployedUrl, error } = useDeployStore();

  const [renderApiKey, setRenderApiKey] = useState('');
  const [serviceName, setServiceName] = useState(selectedRepository?.name ?? '');
  const [buildCommand, setBuildCommand] = useState('');
  const [startCommand, setStartCommand] = useState('');

  const handleDeploy = () => {
    if (!renderApiKey || !serviceName || !selectedRepository) return;
    deploy({
      repoUrl: selectedRepository.url ?? selectedRepository.cloneUrl,
      branch: currentBranch,
      serviceName,
      renderApiKey,
      buildCommand: buildCommand || undefined,
      startCommand: startCommand || undefined,
    });
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#fff' }}>Deploy to Render</h2>

        {status === 'idle' || status === 'failed' ? (
          <>
            <label style={label}>Render API Key</label>
            <input style={input} type="password" placeholder="rnd_xxxx..."
              value={renderApiKey} onChange={e => setRenderApiKey(e.target.value)} />

            <label style={label}>Service Name</label>
            <input style={input} value={serviceName} onChange={e => setServiceName(e.target.value)} />

            <label style={label}>Build Command (optional)</label>
            <input style={input} placeholder="npm run build" value={buildCommand}
              onChange={e => setBuildCommand(e.target.value)} />

            <label style={label}>Start Command (optional)</label>
            <input style={input} placeholder="npm start" value={startCommand}
              onChange={e => setStartCommand(e.target.value)} />

            {error && <p style={{ color: '#f87171', fontSize: 13, margin: '8px 0' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button style={btnSecondary} onClick={onClose}>Cancel</button>
              <button style={btnPrimary} onClick={handleDeploy} disabled={isDeploying}>
                {isDeploying ? 'Deploying…' : 'Deploy'}
              </button>
            </div>
          </>
        ) : status === 'deploying' ? (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <div style={spinner} />
            <p style={{ color: '#a78bfa', marginTop: 16 }}>Building on Render…</p>
            <p style={{ color: '#6b7280', fontSize: 13 }}>This can take 2-5 minutes</p>
          </div>
        ) : status === 'live' ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p style={{ fontSize: 32 }}>🚀</p>
            <p style={{ color: '#34d399', fontWeight: 600, margin: '8px 0' }}>Live!</p>
            <a href={deployedUrl} target="_blank" rel="noreferrer"
              style={{ color: '#7c3aed', wordBreak: 'break-all' }}>{deployedUrl}</a>
            <br />
            <button style={{ ...btnSecondary, marginTop: 20 }} onClick={onClose}>Close</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'grid', placeItems: 'center', zIndex: 1000,
};
const modal = {
  background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 16, padding: 32, width: 420, maxWidth: '90vw',
};
const label = { display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 4, marginTop: 12 };
const input = {
  width: '100%', background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, boxSizing: 'border-box',
};
const btnPrimary = {
  flex: 1, padding: '10px 0', background: '#7c3aed', color: '#fff',
  border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
};
const btnSecondary = {
  flex: 1, padding: '10px 0', background: 'transparent',
  color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, cursor: 'pointer',
};
const spinner = {
  width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)',
  borderTopColor: '#7c3aed', borderRadius: '50%',
  animation: 'spin 0.8s linear infinite', margin: '0 auto',
};