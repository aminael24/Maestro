import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRailwayStore } from '../../store/railwayStore';

export default function RailwayCallbackPage() {
  const navigate = useNavigate();
  const { finishCallback } = useRailwayStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code  = params.get('code');
    const state = params.get('state');
    if (!code || !state) { navigate('/workspace/deployments'); return; }

    finishCallback(code, state)
      .then(() => navigate('/workspace/deployments'))
      .catch(() => navigate('/workspace/deployments'));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b1020', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(64,126,140,0.2)', borderTopColor: '#407E8C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p>Connexion Railway en cours…</p>
      </div>
    </div>
  );
}