import { useState } from 'react';
import { useDeployStore } from '../../store/deployStore';
import { useGitHubStore } from '../../store/gitHubStore';
import { useRailwayStore } from '../../store/railwayStore';

export default function DeployModal({ onClose }) {
  const { selectedRepository, currentBranch } = useGitHubStore();
  const { isConnected: railwayConnected, token: railwayToken, connect: connectRailway, isLoading: railwayLoading } = useRailwayStore();
  const { deploy, isDeploying, status, deployedUrl, error } = useDeployStore();

  const [serviceName, setServiceName]   = useState(selectedRepository?.name ?? '');
  const [buildCommand, setBuildCommand] = useState('');
  const [startCommand, setStartCommand] = useState('');

  const handleDeploy = () => {
    if (!railwayToken || !serviceName || !selectedRepository) return;
    deploy({
      repoUrl:      selectedRepository.url ?? selectedRepository.cloneUrl,
      branch:       currentBranch,
      serviceName,
      railwayToken,
      buildCommand: buildCommand || undefined,
      startCommand: startCommand || undefined,
    });
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={modalHeader}>
          <div>
            <p style={eyebrow}>Déploiement</p>
            <h2 style={title}>Déployer sur Railway</h2>
          </div>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Step 1 – Railway connect */}
        <div style={step}>
          <div style={stepNum(railwayConnected)}>1</div>
          <div style={{ flex: 1 }}>
            <p style={stepLabel}>Connecter Railway</p>
            {railwayConnected ? (
              <p style={{ color: '#22c55e', fontSize: '0.82rem' }}>✓ Compte Railway connecté</p>
            ) : (
              <button style={btnPrimary} onClick={connectRailway} disabled={railwayLoading}>
                {railwayLoading ? 'Redirection…' : 'Se connecter à Railway'}
              </button>
            )}
          </div>
        </div>

        {/* Step 2 – Config */}
        {railwayConnected && (status === 'idle' || status === 'failed') && (
          <>
            <div style={step}>
              <div style={stepNum(true)}>2</div>
              <div style={{ flex: 1 }}>
                <p style={stepLabel}>Configurer le service</p>
                <label style={label}>Nom du service</label>
                <input style={input} value={serviceName} onChange={e => setServiceName(e.target.value)} />
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={label}>Build command <span style={{ color: '#9AAFB8' }}>(optionnel)</span></label>
                    <input style={input} placeholder="npm run build" value={buildCommand} onChange={e => setBuildCommand(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={label}>Start command <span style={{ color: '#9AAFB8' }}>(optionnel)</span></label>
                    <input style={input} placeholder="npm start" value={startCommand} onChange={e => setStartCommand(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button style={btnSecondary} onClick={onClose}>Annuler</button>
              <button
                style={serviceName ? btnPrimary : btnDisabled}
                disabled={isDeploying || !serviceName}
                onClick={handleDeploy}
              >
                {isDeploying ? 'Déploiement…' : 'Déployer'}
              </button>
            </div>
          </>
        )}

        {/* Deploying */}
        {status === 'deploying' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={spinner} />
            <p style={{ color: '#083A4F', fontWeight: 600, marginTop: 16 }}>Build en cours sur Railway…</p>
            <p style={{ color: '#9AAFB8', fontSize: '0.82rem' }}>Vous recevrez une notification à la fin</p>
          </div>
        )}

        {/* Live */}
        {status === 'live' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 40 }}>🚀</p>
            <p style={{ fontWeight: 700, color: '#083A4F', fontSize: '1.1rem', margin: '12px 0 4px' }}>En ligne !</p>
            <a href={deployedUrl} target="_blank" rel="noreferrer" style={{ color: '#407E8C', fontSize: '0.85rem', wordBreak: 'break-all' }}>{deployedUrl}</a>
            <br />
            <button style={{ ...btnPrimary, marginTop: 20 }} onClick={onClose}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(8,28,38,0.45)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: '1rem' };
const modal = { background: '#fff', border: '1px solid rgba(8,58,79,0.08)', borderRadius: 20, padding: '28px', width: 460, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(8,58,79,0.15)', display: 'flex', flexDirection: 'column', gap: 16 };
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const eyebrow = { fontSize: '0.68rem', fontWeight: 700, color: '#407E8C', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' };
const title = { fontFamily: "'Syne', sans-serif", fontSize: '1.2rem', fontWeight: 800, color: '#083A4F', margin: 0 };
const closeBtn = { background: 'rgba(8,58,79,0.05)', border: '1px solid rgba(8,58,79,0.09)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#5A7A88' };
const step = { display: 'flex', gap: 12, alignItems: 'flex-start' };
const stepNum = (done) => ({ width: 28, height: 28, borderRadius: '50%', background: done ? 'rgba(64,126,140,0.15)' : 'rgba(8,58,79,0.06)', color: done ? '#407E8C' : '#9AAFB8', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 });
const stepLabel = { fontWeight: 600, color: '#083A4F', fontSize: '0.88rem', margin: '0 0 8px' };
const label = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#5A7A88', marginBottom: 4 };
const input = { width: '100%', background: '#fafafa', border: '1px solid rgba(8,58,79,0.12)', borderRadius: 8, padding: '8px 12px', color: '#1C2B36', fontSize: '0.85rem', boxSizing: 'border-box' };
const btnPrimary = { width: '100%', padding: '10px 0', background: '#083A4F', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.87rem' };
const btnDisabled = { ...{ width: '100%', padding: '10px 0', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.87rem' }, background: 'rgba(8,58,79,0.08)', color: '#9AAFB8', cursor: 'not-allowed' };
const btnSecondary = { flex: 1, padding: '10px 0', background: 'transparent', color: '#5A7A88', border: '1px solid rgba(8,58,79,0.12)', borderRadius: 10, cursor: 'pointer', fontSize: '0.87rem' };
const spinner = { width: 40, height: 40, border: '3px solid rgba(64,126,140,0.15)', borderTopColor: '#407E8C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' };