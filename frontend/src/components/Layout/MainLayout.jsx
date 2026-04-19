import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from './Topbar';
import './MainLayout.css';

export default function MainLayout() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const location = useLocation();

  // Déterminer le titre en fonction de la route
  const pageTitles = {
    '/workspace/dashboard': 'Tableau de bord',
    '/workspace/projects': 'Mes Projets',
  };
  const currentTitle = pageTitles[location.pathname] || 'Maestro';
  const isProjectsPage = location.pathname === '/workspace/projects';

  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-layout__content">
        <Topbar 
          title={currentTitle} 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          showCreateButton={isProjectsPage}
          onCreateClick={() => setIsFormVisible(true)}
        />
        <div className="page-wrapper">
          <Outlet context={{ searchTerm, isFormVisible, setIsFormVisible }} />
        </div>
      </main>
    </div>
  );
}