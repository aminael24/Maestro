import { useState, useEffect } from 'react';
import DeployModal from '../Deploy/DeployModal';
import { useDeployStore } from '../../store/deployStore';
import { useGitHubStore } from '../../store/gitHubStore';

const floatKeyframes = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes pulse-ring {
    0% { box-shadow: 0 0 0 0 rgba(168,85,247,0.4); }
    70% { box-shadow: 0 0 0 12px rgba(168,85,247,0); }
    100% { box-shadow: 0 0 0 0 rgba(168,85,247,0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes statusPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`;

export default function DeploymentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [hovering, setHovering] = useState(false);
  const { selectedRepository } = useGitHubStore();
  const { status, deployedUrl, reset } = useDeployStore();

  const statusConfig = {
    deploying: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', icon: '⏳', label: 'Déploiement en cours…', anim: 'statusPulse 1.5s ease-in-out infinite' },
    live:      { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.3)',  icon: '✅', label: 'En ligne !', anim: 'none' },
    failed:    { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.3)', icon: '❌', label: 'Échec du déploiement', anim: 'none' },
  };
  const cfg = statusConfig[status];

  const steps = [
    { n: '1', icon: '🔗', title: 'Connectez GitHub', desc: 'Liez votre compte GitHub depuis le workspace AI Generator.' },
    { n: '2', icon: '📦', title: 'Sélectionnez un dépôt', desc: 'Choisissez le dépôt contenant votre code généré.' },
    { n: '3', icon: '🚀', title: 'Connectez Railway et déployez', desc: 'Autorisez Railway en un clic et votre app est en ligne.' },
  ];

  return (
    <>
      <style>{floatKeyframes}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#080e1a', color: '#fff', overflowY: 'auto' }}>

        {/* ── Hero header ── */}
        <div style={{
          padding: '48px 40px 32px',
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 70%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          animation: 'fadeInUp 0.5s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div style={{
              fontSize: 36,
              animation: 'float 3s ease-in-out infinite',
              display: 'inline-block',
            }}>🚀</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Déploiements</h1>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 14, marginTop: 4 }}>
                Publiez votre application en quelques clics via Railway
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '36px 40px', maxWidth: 860, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

          {/* ── Status banner ── */}
          {status !== 'idle' && cfg && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              borderRadius: 14, padding: '16px 22px', marginBottom: 32,
              animation: cfg.anim,
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: cfg.color, fontSize: 15 }}>
                  {cfg.icon} {cfg.label}
                </p>
                {deployedUrl && (
                  <a href={deployedUrl} target="_blank" rel="noreferrer"
                    style={{ color: '#a78bfa', fontSize: 13, marginTop: 6, display: 'block' }}>
                    🔗 {deployedUrl}
                  </a>
                )}
              </div>
              <button onClick={reset} style={btnGhost}>Réinitialiser</button>
            </div>
          )}

          {/* ── Railway card ── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.07) 0%, rgba(124,58,237,0.04) 100%)',
            border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: 20, padding: 28,
            marginBottom: 32,
            animation: 'fadeInUp 0.5s ease 0.1s both',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: hovering ? '0 0 32px rgba(124,58,237,0.15)' : '0 4px 24px rgba(0,0,0,0.3)',
          }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: 'rgba(168,85,247,0.15)',
                border: '1px solid rgba(168,85,247,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse-ring 2.5s ease-out infinite',
              }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <path d="M3 11.5C3 7.36 6.36 4 10.5 4H14v2h-3.5C7.46 6 5 8.46 5 11.5S7.46 17 10.5 17H14v2h-3.5C6.36 19 3 15.64 3 11.5Z" fill="#a855f7"/>
                  <path d="M21 11.5C21 15.64 17.64 19 13.5 19H10v-2h3.5c3.04 0 5.5-2.46 5.5-5.5S16.54 6 13.5 6H10V4h3.5C17.64 4 21 7.36 21 11.5Z" fill="#a855f7"/>
                  <line x1="8" y1="11.5" x2="16" y2="11.5" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 17 }}>Railway</p>
                <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>railway.app · Déploiement instantané</p>
              </div>
              <span style={{
                background: 'rgba(168,85,247,0.15)', color: '#a855f7',
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                border: '1px solid rgba(168,85,247,0.3)',
                letterSpacing: '0.05em',
              }}>
                ● DISPONIBLE
              </span>
            </div>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {['⚡ Déploiement rapide', '🗄️ Base de données intégrée', '🔄 Auto-deploy sur push', '🌍 CDN global'].map(f => (
                <span key={f} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#9ca3af',
                }}>{f}</span>
              ))}
            </div>

            {/* Repo pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              background: selectedRepository ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selectedRepository ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 10, padding: '10px 14px',
            }}>
              <span style={{ fontSize: 16 }}>{selectedRepository ? '📦' : '⚠️'}</span>
              <div>
                <p style={{ margin: 0, color: selectedRepository ? '#e5e7eb' : '#4b5563', fontSize: 13, fontWeight: 600 }}>
                  {selectedRepository ? selectedRepository.name : 'Aucun dépôt sélectionné'}
                </p>
                {selectedRepository && (
                  <p style={{ margin: 0, color: '#6b7280', fontSize: 11 }}>Prêt à déployer</p>
                )}
              </div>
            </div>

            <button
              style={{
                width: '100%', padding: '13px 20px',
                background: selectedRepository
                  ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                  : 'rgba(255,255,255,0.04)',
                color: selectedRepository ? '#fff' : '#4b5563',
                border: selectedRepository ? 'none' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, cursor: selectedRepository ? 'pointer' : 'not-allowed',
                fontWeight: 700, fontSize: 15,
                backgroundSize: '200% auto',
                transition: 'background-position 0.4s ease, transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: selectedRepository ? '0 4px 16px rgba(124,58,237,0.35)' : 'none',
              }}
              disabled={!selectedRepository}
              onClick={() => setShowModal(true)}
              onMouseEnter={e => { if (selectedRepository) { e.target.style.transform = 'translateY(-1px)'; e.target.style.backgroundPosition = 'right center'; } }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.backgroundPosition = 'left center'; }}
            >
              🚀 Déployer sur Railway
            </button>
          </div>

          {/* ── How it works ── */}
          <div style={{ animation: 'fadeInUp 0.5s ease 0.2s both' }}>
            <p style={{ color: '#4b5563', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
              Comment ça marche
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {steps.map(({ n, icon, title, desc }, i) => (
                <div key={n} style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                  {/* Timeline */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 16 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.15))',
                      border: '1px solid rgba(124,58,237,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#a78bfa', fontSize: 14, fontWeight: 800,
                    }}>{n}</div>
                    {i < steps.length - 1 && (
                      <div style={{ width: 1, flex: 1, minHeight: 24, background: 'linear-gradient(to bottom, rgba(124,58,237,0.3), transparent)', margin: '4px 0' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < steps.length - 1 ? 24 : 0, paddingTop: 6 }}>
                    <p style={{ margin: 0, color: '#e5e7eb', fontSize: 14, fontWeight: 700 }}>
                      {icon} {title}
                    </p>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {showModal && <DeployModal onClose={() => setShowModal(false)} />}
      </div>
    </>
  );
}

const btnGhost = {
  background: 'transparent', color: '#6b7280',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
  transition: 'border-color 0.2s',
};