import React, { useState } from 'react';
import './Topbar.css';

const TYPE_OPTIONS = ['Tous', 'Fullstack', 'Frontend', 'Backend'];
const STATUS_OPTIONS = [
  { value: 'all',         label: 'Tous les statuts' },
  { value: 'in_progress', label: 'En cours'         },
  { value: 'completed',   label: 'Terminé'          },
  { value: 'pending',     label: 'En attente'       },
  { value: 'overdue',     label: 'En retard'        },
];

export default function Topbar({
  title,
  searchTerm,
  onSearchChange,
  showCreateButton,
  onCreateClick,
  /* filter props — optional; pass only on ProjectsPage */
  activeStatus,
  onStatusChange,
  activeType,
  onTypeChange,
}) {
  const showFilters = onStatusChange || onTypeChange;

  return (
    <header className="topbar">
      {/* LEFT — title block */}
      <div className="topbar__left">
        <h2 className="topbar__title">{title}</h2>
        {showFilters && (
          <p className="topbar__subtitle">
            Gérez et suivez tous vos projets
          </p>
        )}
      </div>

      {/* CENTER — search */}
      <div className="topbar__center">
        <div className="topbar__search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* RIGHT — filters + action */}
      <div className="topbar__right">
        {showFilters && (
          <div className="topbar__filters">
            {/* Status filter */}
            {onStatusChange && (
              <div className="topbar__filter-wrap">
                <select
                  className="topbar__filter-select"
                  value={activeStatus ?? 'all'}
                  onChange={(e) => onStatusChange(e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <span className="topbar__filter-arrow">▾</span>
              </div>
            )}

            {/* Type filter */}
            {onTypeChange && (
              <div className="topbar__filter-wrap">
                <select
                  className="topbar__filter-select"
                  value={activeType ?? 'Tous'}
                  onChange={(e) => onTypeChange(e.target.value)}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <span className="topbar__filter-arrow">▾</span>
              </div>
            )}
          </div>
        )}

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
