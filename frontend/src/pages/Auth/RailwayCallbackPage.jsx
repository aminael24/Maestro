import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRailwayStore } from '../../store/railwayStore';

export default function RailwayCallbackPage() {
  const navigate = useNavigate();
  const { finishCallback } = useRailwayStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code  = params.get('code');
    const state = params.get('state');
    const err   = params.get('error');

    if (err) { setError(err); return; }
    if (!code || !state) { setError('Missing code or state'); return; }

    finishCallback(code, state)
      .then(() => navigate('/workspace/deploy-config'))
      .catch(e => setError(e.message));
  }, []);

  if (error) return (
    <div style={page}>
      <p style={{ color: '#ef4444', fontWeight: 600 }}>❌ Erreur : {error}</p>
      <button onClick={() => navigate('/workspace/deploy-config')} style={btn}>Retour</button>
    </div>
  );

  return (
    <div style={page}>
      <div style={spinner} />
      <p style={{ color: '#083A4F', fontWeight: 600, marginTop: 16 }}>Connexion Railway en cours…</p>
    </div>
  );
}

const page = { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fff', fontFamily: 'DM Sans, sans-serif', textAlign: 'center' };
const btn = { marginTop: 16, padding: '10px 24px', background: '#083A4F', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' };
const spinner = { width: 40, height: 40, border: '3px solid rgba(64,126,140,0.2)', borderTopColor: '#407E8C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' };