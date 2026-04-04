import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './MainLayout.css';

export default function MainLayout() {
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-layout__content">
        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}