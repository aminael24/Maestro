import './DashboardTopbar.css';

export default function DashboardTopbar() {
  return (
    <div className="topbar">
      <h2 className="topbar__brand">DevSecOps Control</h2>

      <div className="topbar__right">
        <div className="topbar__search">
          <svg className="search-icon" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input placeholder="Search resources, models, logs..." />
        </div>

        <button className="topbar__icon-btn" title="Notifications">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M8 15.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <button className="topbar__icon-btn" title="Help">
          <svg viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7.5 7.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="10" cy="14.5" r="0.75" fill="currentColor"/>
          </svg>
        </button>

        <button className="topbar__create-btn">
          + Create New Project
        </button>
      </div>
    </div>
  );
}
