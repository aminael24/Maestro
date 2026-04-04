export default function DashboardGrid() {
  return (
    <div className="grid">

      {/* ── Neural Processor (grande card teal) ── */}
      <div className="card card--big">
        <div className="card__header">
          <div className="icon-box">⚙️</div>
          <span className="badge running">RUNNING</span>
        </div>
        <h2>Neural Processor</h2>
        <p>Real-time threat detection and behavioral analysis engine utilizing GPT-4o-Turbo protocols.</p>
        <div className="prog-row">
          <span className="prog-label">Core CPU Utilization</span>
          <span className="prog-val">74%</span>
        </div>
        <div className="progress">
          <div className="progress__bar" style={{ width: '74%' }} />
        </div>
        <div className="card-footer-row">
          <div className="avatars">
            <div className="mini-av">#1</div>
            <div className="mini-av">#2</div>
            <div className="mini-av">#3</div>
            <div className="mini-av mini-av--extra">+2</div>
          </div>
          <span className="card-ver">v2.4.0-Stable</span>
        </div>
      </div>

      {/* ── Data Lake ── */}
      <div className="card">
        <div className="card__header">
          <div className="icon-box" style={{ background: 'var(--teal)' }}>🗄️</div>
          <span className="badge success">SUCCESS</span>
        </div>
        <h2>Data Lake</h2>
        <p>Aggregating telemetry from 14 regions with semantic indexing enabled.</p>
        <div className="uptime-block">
          <span className="uptime-label">Uptime</span>
          <span className="uptime-val">99.99%</span>
        </div>
      </div>

      {/* ── Model Trainer ── */}
      <div className="card">
        <div className="card__header">
          <div className="icon-box" style={{ background: 'var(--gold)' }}>🔁</div>
          <span className="badge warning">WARNING</span>
        </div>
        <h2>Model Trainer</h2>
        <p>Refining edge cases for zero-day exploit patterns. Epoch 4/10.</p>
        <div className="prog-row">
          <span className="prog-label">Training Progress</span>
          <span className="prog-val">42%</span>
        </div>
        <div className="progress">
          <div className="progress__bar" style={{ width: '42%', background: 'var(--gold)' }} />
        </div>
      </div>

      {/* ── Network Sentry ── */}
      <div className="card">
        <div className="live-badge">
          <span className="live-dot" />
          LIVE
        </div>
        <div style={{ marginTop: 8 }}>
          <div className="sec-label">🛡 Security Protocol</div>
          <h2>Network Sentry</h2>
          <p>Continuous deep-packet inspection and encryption auditing across all virtual private clouds.</p>
          <button className="btn-audit">LAUNCH AUDIT</button>
        </div>
      </div>

    </div>
  );
}
