const events = [
  { event: 'Snapshot completed', source: 'Production-Cluster-01', status: 'success', label: 'SUCCESS',    time: 'Today, 10:42 AM' },
  { event: 'Scaling initiated',  source: 'Edge-Gateway-East',     status: 'warning', label: 'IN PROGRESS', time: 'Today, 09:15 AM' },
  { event: 'Intrusion attempt blocked', source: 'External-Firewall-3', status: 'danger', label: 'HIGH ALERT', time: 'Today, 04:30 AM' },
  { event: 'Kernel update deployed',    source: 'System-Core',        status: 'success', label: 'COMPLETED',  time: 'Yesterday, 11:58 PM' },
];

const icons = {
  success: '☁',
  warning: '⇄',
  danger:  '⚠',
};

export default function DashboardTable() {
  return (
    <div className="table">
      <div className="table-header">
        <h3>Recent System Activity</h3>
        <div>
          <button className="active">All Events</button>
          <button>Alerts Only</button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Event Type</th>
            <th>Source Node</th>
            <th>Status</th>
            <th>Timestamp</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((row, i) => (
            <tr key={i}>
              <td>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: row.status === 'danger' ? '#fde8e8' : row.status === 'warning' ? '#fff4e0' : '#e3f5ec',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, flexShrink: 0
                  }}>{icons[row.status]}</span>
                  {row.event}
                </span>
              </td>
              <td style={{ color: 'var(--text-light)' }}>{row.source}</td>
              <td><span className={`badge ${row.status}`}>{row.label}</span></td>
              <td style={{ color: 'var(--text-hint)', fontSize: 12.5 }}>{row.time}</td>
              <td>
                <button style={{
                  background: 'none', border: '1px solid var(--border-mid)',
                  borderRadius: 6, padding: '4px 8px', fontSize: 16,
                  color: 'var(--text-hint)', cursor: 'pointer'
                }}>⋯</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
        <button style={{
          background: 'none', border: 'none', fontSize: 12.5,
          fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--text-hint)', cursor: 'pointer'
        }}>Load Older History</button>
      </div>
    </div>
  );
}
