import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const items = [
  { path: '/workspace/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/workspace/projects', label: 'Projects', icon: '📁' },
  { path: '/workspace/deployments', label: 'Deployments', icon: '🚀' },
  { path: '/workspace/infrastructure', label: 'Infrastructure', icon: '🧱' },
  { path: '/workspace/monitoring', label: 'Monitoring', icon: '📈' },
  { path: '/workspace/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  return (
    <aside className="sidebarV2">

      {/* LOGO */}
      <div className="sidebarV2__logo">
        <div className="logo-box">A</div>
        <div>
          <strong>The Archive</strong>
          <span>Security Hub</span>
        </div>
      </div>

      {/* MENU */}
      <nav className="sidebarV2__nav">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? 'sidebarV2__link active' : 'sidebarV2__link'
            }
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* PRO CARD */}
      <div className="sidebarV2__pro">
        <p>Unlock advanced features</p>
        <button>Upgrade Plan</button>
      </div>

      {/* USER */}
      <div className="sidebarV2__user">
        <div className="avatar">J</div>
        <div>
          <strong>Julian Thorne</strong>
          <span>Principal Architect</span>
        </div>
      </div>

    </aside>
  );
}