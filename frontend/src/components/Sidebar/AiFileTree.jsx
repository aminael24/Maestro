import React from 'react';
import { useAiStore } from '../../store/useAiStore';

const fileIcons = {
  sql: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64b5f6" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  js: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffd54f" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9v8m6-4a2 2 0 1 0-4 0v4"/>
    </svg>
  ),
  jsx: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/>
    </svg>
  ),
};

const structure = [
  { folder: 'db', icon: '🗄️', files: [{ name: 'schema.sql', key: 'sql', type: 'sql' }] },
  {
    folder: 'backend', icon: '⚙️', files: [
      { name: 'model.js', key: 'model', type: 'js' },
      { name: 'controller.js', key: 'controller', type: 'js' },
      { name: 'routes.js', key: 'routes', type: 'js' },
    ]
  },
  { folder: 'frontend', icon: '🎨', files: [{ name: 'App.jsx', key: 'frontend', type: 'jsx' }] },
];

const AiFileTree = () => {
  const { files, activeFile, setActiveFile } = useAiStore();

  return (
    <div style={{ padding: '20px 12px', color: '#cdd9e5', fontSize: '13px', height: '100%' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        padding: '0 8px',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          Explorer
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>
          Projet généré
        </div>
      </div>

      {structure.map((group) => (
        <div key={group.folder} style={{ marginBottom: '20px' }}>
          {/* Folder */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            marginBottom: '4px',
            color: 'rgba(255,255,255,0.55)',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            <span style={{ fontSize: '13px' }}>{group.icon}</span>
            {group.folder}
          </div>

          {/* Files */}
          <div style={{ marginLeft: '8px' }}>
            {group.files.map((file) => {
              const isActive = activeFile === file.key;
              const hasContent = !!files[file.key];
              return (
                <div
                  key={file.key}
                  onClick={() => setActiveFile(file.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    marginBottom: '2px',
                    backgroundColor: isActive
                      ? 'rgba(100, 181, 246, 0.12)'
                      : 'transparent',
                    borderLeft: isActive
                      ? '2px solid #64b5f6'
                      : '2px solid transparent',
                    color: isActive ? '#e8f4fd' : 'rgba(255,255,255,0.45)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {fileIcons[file.type] || fileIcons.js}
                  <span style={{ flex: 1, fontSize: '13px' }}>{file.name}</span>
                  {hasContent && (
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      backgroundColor: '#4caf50', flexShrink: 0,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AiFileTree;