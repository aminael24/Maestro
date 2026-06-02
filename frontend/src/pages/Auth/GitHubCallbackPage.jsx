import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGitHubStore } from '../../store/gitHubStore';

export default function GitHubCallbackPage() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const finishOAuthCallback = useGitHubStore((state) => state.finishOAuthCallback);

  useEffect(() => {
    let cancelled = false;
    const query = new URLSearchParams(location.search);
    const code = query.get('code');
    const state = query.get('state');

    if (!code || !state) {
      setError('Missing OAuth code or state. Please retry GitHub connection.');
      return;
    }

    (async () => {
      try {
        await finishOAuthCallback(code, state);
        if (!cancelled) navigate('/workspace/ai-generator', { replace: true });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to complete GitHub authentication.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [finishOAuthCallback, location.search, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.spinner} />
        <h2 style={styles.title}>Completing GitHub connection…</h2>
        <p style={styles.hint}>{error ?? 'Please wait while Maestro finishes authorization.'}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, #0b1020 0%, #1a1040 100%)',
    color: '#fff',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  card: {
    padding: '40px',
    borderRadius: '24px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    textAlign: 'center',
    maxWidth: '480px',
    width: '100%',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#7c3aed',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 20px',
  },
  title: { margin: '0 0 8px', fontSize: '20px', fontWeight: 600 },
  hint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '14px',
    margin: '12px 0 0',
  },
};
