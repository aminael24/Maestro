import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGitHubStore } from '../../store/gitHubStore';
import { useRailwayStore } from '../../store/railwayStore';
import { useDeployStore } from '../../store/deployStore';

const kf = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
`;

export default function DeployConfigPage() {
  const navigate = useNavigate();
  const { selectedRepository, currentBranch, repositories, selectRepository } = useGitHubStore();
  const { isConnected: railwayConnected, token: railwayToken, connect: connectRailway, isLoading: railwayLoading } = useRailwayStore();
  const { deploy, status, deployedUrl, error, reset } = useDeployStore();

  const [serviceName, setServiceName]     = useState('');
  const [buildCommand, setBuildCommand]   = useState('');
  const [startCommand, setStartCommand]   = useState('');
  const [envVars, setEnvVars]             = useState([{ key: '', value: '' }]);
  const [selectedBranch, setSelectedBranch] = useState(currentBranch || 'main');

  useEffect(() => {
    if (selectedRepository?.name) setServiceName(selectedRepository.name);
  }, [selectedRepository]);

  useEffect(() => {
    setSelectedBranch(currentBranch || 'main');
  }, [currentBranch]);

  const addEnvVar = () => setEnvVars(v => [...v, { key: '', value: '' }]);
  const removeEnvVar = (i) => setEnvVars(v => v.filter((_, idx) => idx !== i));
  const updateEnvVar = (i, field, val) => setEnvVars(v => v.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  const handleDeploy = () => {
    if (!railwayToken || !serviceName || !selectedRepository) return;
    const repoUrl = selectedRepository.remoteUrl || selectedRepository.url || selectedRepository.cloneUrl;
    deploy({
      repoUrl,
      branch: selectedBranch,
      serviceName: serviceName.trim(),
      railwayToken,
      buildCommand: buildCommand.trim() || undefined,
      startCommand: startCommand.trim() || undefined,
    });
  };

  const canDeploy = railwayConnected && !!selectedRepository && !!serviceName.trim();

  return (
    <>
      <style>{kf}</style>
      <div style={{ minHeight: '100vh', background: '#080e1a', color: '#e5e7eb', fontFamily: "'DM Sans',sans-serif", overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '32px 40px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}>← Back</button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg,#fff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🚀 Deploy Configuration</h1>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>Configure and launch your app on Railway</p>
          </div>
        </div>

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp .4s ease' }}>

          {/* Status banner */}
          {status === 'deploying' && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 20, height: 20, border: '2px solid rgba(245,158,11,.2)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#f59e0b' }}>Deploying on Railway…</p>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: 12 }}>This usually takes 2–5 minutes. You can close this page.</p>
              </div>
            </div>
          )}
          {status === 'live' && (
            <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 12, padding: '14px 20px' }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#34d399', fontSize: 16 }}>✅ Live!</p>
              <a href={deployedUrl} target="_blank" rel="noreferrer" style={{ color: '#a78bfa', fontSize: 13, wordBreak: 'break-all' }}>{deployedUrl}</a>
              <br />
              <button onClick={reset} style={{ marginTop: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 16px', color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}>Reset</button>
            </div>
          )}
          {status === 'failed' && (
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: '14px 20px' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#f87171' }}>❌ Deployment failed</p>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 13 }}>{error}</p>
              <button onClick={reset} style={{ marginTop: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 16px', color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}>Try again</button>
            </div>
          )}

          {/* Step 1: Railway */}
          <Section title="1 · Connect Railway" done={railwayConnected}>
            {railwayConnected
              ? <p style={{ color: '#34d399', fontSize: 13, margin: 0 }}>✓ Railway account connected</p>
              : <button onClick={connectRailway} disabled={railwayLoading} style={btnPrimary}>
                  {railwayLoading ? 'Redirecting…' : 'Connect Railway account'}
                </button>
            }
          </Section>

          {/* Step 2: Repo */}
          <Section title="2 · Select repository" done={!!selectedRepository}>
            {repositories.length === 0
              ? <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>No repositories found. Connect GitHub first from the workspace.</p>
              : <select
                  value={selectedRepository?.id ?? ''}
                  onChange={e => {
                    const r = repositories.find(r => r.id === e.target.value);
                    if (r) selectRepository(r);
                  }}
                  style={selectStyle}
                >
                  <option value="">— choose a repository —</option>
                  {repositories.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
            }
            {selectedRepository && (
              <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 12 }}>
                📦 {selectedRepository.remoteUrl || selectedRepository.url}
              </p>
            )}
          </Section>

          {/* Step 3: Branch */}
          <Section title="3 · Branch" done={!!selectedBranch}>
            <input
              style={inputStyle}
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              placeholder="main"
            />
          </Section>

          {/* Step 4: Service config */}
          <Section title="4 · Service configuration" done={!!serviceName.trim()}>
            <label style={labelStyle}>Service name *</label>
            <input style={inputStyle} value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="my-app" />

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Build command <Opt /></label>
                <input style={inputStyle} value={buildCommand} onChange={e => setBuildCommand(e.target.value)} placeholder="npm run build" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Start command <Opt /></label>
                <input style={inputStyle} value={startCommand} onChange={e => setStartCommand(e.target.value)} placeholder="npm start" />
              </div>
            </div>
          </Section>

          {/* Step 5: Env vars */}
          <Section title="5 · Environment variables" done={false} optional>
            {envVars.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="KEY" value={e.key} onChange={v => updateEnvVar(i, 'key', v.target.value)} />
                <input style={{ ...inputStyle, flex: 2 }} placeholder="value" value={e.value} onChange={v => updateEnvVar(i, 'value', v.target.value)} />
                <button onClick={() => removeEnvVar(i)} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '0 10px', color: '#f87171', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            ))}
            <button onClick={addEnvVar} style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}>+ Add variable</button>
          </Section>

          {/* Deploy button */}
          <button
            disabled={!canDeploy || status === 'deploying'}
            onClick={handleDeploy}
            style={{
              padding: '14px 0',
              background: canDeploy && status !== 'deploying'
                ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                : 'rgba(255,255,255,0.06)',
              color: canDeploy && status !== 'deploying' ? '#fff' : '#4b5563',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 15,
              cursor: canDeploy && status !== 'deploying' ? 'pointer' : 'not-allowed',
              boxShadow: canDeploy ? '0 4px 20px rgba(124,58,237,.35)' : 'none',
              transition: 'all .2s',
            }}
          >
            {status === 'deploying' ? '⏳ Deploying…' : '🚀 Deploy on Railway'}
          </button>

          {!railwayConnected && <p style={{ textAlign: 'center', color: '#4b5563', fontSize: 12 }}>Connect Railway first to enable deployment.</p>}
          {railwayConnected && !selectedRepository && <p style={{ textAlign: 'center', color: '#4b5563', fontSize: 12 }}>Select a repository to continue.</p>}

        </div>
      </div>
    </>
  );
}

// ── Small helpers ─────────────────────────────────────────────
function Section({ title, done, optional, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${done ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: 20 }}>
      <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 14, color: done ? '#34d399' : '#e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
        {done ? '✓ ' : ''}{title}{optional && <span style={{ color: '#4b5563', fontWeight: 400, fontSize: 12 }}>(optional)</span>}
      </p>
      {children}
    </div>
  );
}
function Opt() { return <span style={{ color: '#4b5563', fontWeight: 400, fontSize: 11 }}>(optional)</span>; }

const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: '#e5e7eb', fontSize: 13, boxSizing: 'border-box', outline: 'none' };
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const labelStyle  = { display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 5 };
const btnPrimary  = { padding: '10px 20px', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 };