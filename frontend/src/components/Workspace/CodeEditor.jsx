import React, { useState, useRef, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAiStore } from '../../store/useAiStore';

const tabNames = {
  sql:        { label: 'schema.sql',    color: '#64b5f6' },
  model:      { label: 'model.js',      color: '#ffd54f' },
  controller: { label: 'controller.js', color: '#ffd54f' },
  routes:     { label: 'routes.js',     color: '#ffd54f' },
  frontend:   { label: 'App.jsx',       color: '#4fc3f7' },
};

const CodeEditor = () => {
  const { files, activeFile, setActiveFile, setSelectedCode, clearSelectedCode } = useAiStore();
  const [floatingBtn, setFloatingBtn] = useState(null); // { x, y }
  const editorRef = useRef(null);

  const getLanguage = (fileKey) => {
    switch (fileKey) {
      case 'sql':      return 'sql';
      case 'frontend': return 'jsx';
      default:         return 'javascript';
    }
  };

  const codeContent = files[activeFile] || '// Aucun contenu généré pour ce fichier.';
  const openTabs = Object.keys(files).filter(k => files[k]);

  const customTheme = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      background: 'transparent',
      margin: 0,
      padding: '24px',
      fontSize: '13.5px',
      lineHeight: '1.7',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
  };

  // ✅ Détecte la sélection et affiche le bouton flottant
  const handleMouseUp = useCallback((e) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (!selectedText || selectedText.length < 5) {
      setFloatingBtn(null);
      clearSelectedCode();
      return;
    }

    // Position du bouton : juste au-dessus de la sélection
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const editorRect = editorRef.current?.getBoundingClientRect();

    setFloatingBtn({
      x: rect.left - (editorRect?.left || 0) + rect.width / 2,
      y: rect.top  - (editorRect?.top  || 0) - 44,
    });

    setSelectedCode(selectedText, activeFile);
  }, [activeFile, setSelectedCode, clearSelectedCode]);

  // ✅ Annule si on clique ailleurs
  const handleMouseDown = useCallback((e) => {
    if (!e.target.closest('[data-send-btn]')) {
      setFloatingBtn(null);
      clearSelectedCode();
    }
  }, [clearSelectedCode]);

  const handleSendToAi = () => {
    setFloatingBtn(null);
    // Le ChatBox lira selectedCode/selectedFile depuis le store
  };

  return (
    <div
      style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#111d27' }}
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDown}
    >
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#0d1920',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        minHeight: '40px',
        paddingLeft: '8px',
        gap: '2px',
        overflowX: 'auto',
      }}>
        {openTabs.length === 0 ? (
          <div style={{ padding: '0 16px', color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
            Aucun fichier ouvert
          </div>
        ) : (
          openTabs.map((key) => {
            const tab = tabNames[key] || { label: `${key}.js`, color: '#ffd54f' };
            const isActive = activeFile === key;
            return (
              <div
                key={key}
                onClick={() => setActiveFile(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '0 16px', height: '40px', cursor: 'pointer',
                  fontSize: '12px', fontFamily: "'JetBrains Mono', monospace",
                  color: isActive ? '#e8f4fd' : 'rgba(255,255,255,0.35)',
                  backgroundColor: isActive ? '#111d27' : 'transparent',
                  borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                  borderRight: '1px solid rgba(255,255,255,0.04)',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}
              >
                <span style={{ color: tab.color, fontSize: '10px' }}>●</span>
                {tab.label}
              </div>
            );
          })
        )}
      </div>

      {/* Code area + bouton flottant */}
      <div ref={editorRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>

        {/* ✅ Bouton flottant */}
        {floatingBtn && (
          <div
            data-send-btn="true"
            onClick={handleSendToAi}
            style={{
              position: 'absolute',
              left: floatingBtn.x,
              top: Math.max(4, floatingBtn.y),
              transform: 'translateX(-50%)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
              color: '#fff',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(13,71,161,0.5)',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              animation: 'fadeInUp 0.15s ease',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Envoyer à l'IA
          </div>
        )}

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateX(-50%) translateY(6px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        <SyntaxHighlighter
          language={getLanguage(activeFile)}
          style={customTheme}
          customStyle={{ margin: 0, minHeight: '100%', backgroundColor: 'transparent' }}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: '3.5em', paddingRight: '1.5em',
            color: 'rgba(255,255,255,0.15)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px', userSelect: 'none',
          }}
        >
          {codeContent}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeEditor;