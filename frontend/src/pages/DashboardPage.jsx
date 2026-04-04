import './DashboardPage.css';
import DashboardTopbar from '../components/Dashboard/DashboardTopbar';
import DashboardGrid from '../components/Dashboard/DashboardGrid';
import DashboardTable from '../components/Dashboard/DashboardTable';

export default function DashboardPage() {
  return (
    <div className="dashboard">

      <DashboardTopbar />

      <div style={{ padding: '32px 40px' }}>

        <div className="dashboard__header">
          <div>
            <h1>Control Center</h1>
            <p>
              Welcome back, Julian. Your neural infrastructure is currently operating at{' '}
              <strong>98.4% efficiency</strong> across 3 core clusters.
            </p>
          </div>
          <div className="dashboard__stats">
            <div className="stat">
              <span>Active Nodes</span>
              <strong>12 / 12</strong>
            </div>
            <div className="stat">
              <span>Security Score</span>
              <strong>A+</strong>
            </div>
          </div>
        </div>

        <div className="section-title-row">
          <h4 className="section-title">Active Services</h4>
          <a href="#" className="section-link">View All Infrastructure →</a>
        </div>

        <DashboardGrid />

        <DashboardTable />

      </div>
    </div>
  );
}
