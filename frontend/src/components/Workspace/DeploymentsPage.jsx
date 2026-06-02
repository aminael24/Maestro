import { useState } from 'react';
import DeployModal from '../../components/Deploy/DeployModal';
import { useDeployStore } from '../../store/deployStore';
import { useGitHubStore } from '../../store/gitHubStore';

export default function DeploymentsPage() {
  const [showModal, setShowModal] = useState(false);
  const { selectedRepository } = useGitHubStore();
  const { status, deployedUrl, reset } = useDeployStore();

  return (
    <div style={{ padding: 32, color: '#fff' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>🚀 Déploiements</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>
        Déployez votre workspace sur Render via GitHub.
      </p>

      {/* Current deploy status */}
      {status !== 'idle' && (
        <div style={statusCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {status === 'deploying' && '⏳ Déploiement en cours…'}
                {status === 'live'      && '✅ En ligne'}
                {status === 'failed'    && '❌ Échec du déploiement'}
              </p>
              {deployedUrl && (
                <a href={deployedUrl} target="_blank" rel="noreferrer"
                  style={{ color: '#a78bfa', fontSize: 13, marginTop: 4, display: 'block' }}>
                  {deployedUrl}
                </a>
              )}
            </div>
            <button onClick={reset} style={btnGhost}>Réinitialiser</button>
          </div>
        </div>
      )}

      {/* Deploy card */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Nouveau déploiement</h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 20px' }}>
          {selectedRepository
            ? <>Dépôt sélectionné : <strong style={{ color: '#a78bfa' }}>{selectedRepository.name}</strong></>
            : 'Connectez GitHub et sélectionnez un dépôt dans le workspace.'}
        </p>
        <button
          style={selectedRepository ? btnPrimary : btnDisabled}
          disabled={!selectedRepository}
          onClick={() => setShowModal(true)}
        >
          🚀 Déployer sur Render
        </button>
      </div>

      {showModal && <DeployModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 24,
  maxWidth: 520,
};
const statusCard = {
  ...{
    background: 'rgba(124,58,237,0.08)',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 24,
    maxWidth: 520,
  }
};
const btnPrimary = {
  background: '#7c3aed', color: '#fff', border: 'none',
  borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600,
};
const btnDisabled = {
  ...{ background: 'rgba(255,255,255,0.05)', color: '#4b5563', border: '1px solid rgba(255,255,255,0.08)' },
  borderRadius: 8, padding: '10px 20px', cursor: 'not-allowed', fontWeight: 600,
};
const btnGhost = {
  background: 'transparent', color: '#6b7280',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13,
};