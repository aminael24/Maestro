import React from 'react';
import './Topbar.css';

export default function Topbar({ title, searchTerm, onSearchChange, showCreateButton, onCreateClick }) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <h2 className="topbar__title">{title}</h2>
      </div>

      <div className="topbar__center">
        <div className="topbar__search">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Rechercher partout..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="topbar__right">
        {showCreateButton ? (
          <button className="topbar__create-btn" onClick={onCreateClick}>
            + Nouveau Projet
          </button>
        ) : (
          <button className="topbar__notif">🔔</button>
        )}
      </div>
    </header>
  );
}