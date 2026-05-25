import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAiAssistant } from '../../hooks/useAiAssistant';
import { useAiStore } from '../../store/useAiStore';

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const BotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64b5f6" strokeWidth="2">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4M8 15h.01M16 15h.01"/>
  </svg>
);

const fileLabels = {
  sql: 'schema.sql', model: 'model.js',
  controller: 'controller.js', routes: 'routes.js', frontend: 'App.jsx',
};

const ChatBox = ({ projectId }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = projectId ? localStorage.getItem(`chat_history_${projectId}`) : null;
    return saved ? JSON.parse(saved) : [
      { role: 'ai', text: "Bonjour ! Quel projet CRUD souhaitez-vous créer aujourd'hui ?" }
    ];
  });

  const { generateNewProject, askModification, isLoading, error } = useAiAssistant();
  const { explanation, files, selectedCode, selectedFile, activeFile, clearSelectedCode } = useAiStore();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatHistory, isLoading]);

  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`chat_history_${projectId}`, JSON.stringify(chatHistory));
    }
  }, [chatHistory, projectId]);

  useEffect(() => {
    if (explanation)
      setChatHistory(prev => [...prev, { role: 'ai', text: explanation }]);
  }, [explanation]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMsg = message;
    const snap = { code: selectedCode, file: selectedFile };
    setMessage('');
    clearSelectedCode();

    const displayText = snap.code
      ? `[${fileLabels[snap.file] || snap.file}]\n${userMsg}`
      : userMsg;

    setChatHistory(prev => [...prev, { role: 'user', text: displayText }]);

    // ✅ Vérifie si un vrai projet a déjà été généré
    const hasGeneratedFiles = Object.values(files).some(
      f => f && f.trim() !== '' && !f.startsWith('//') && !f.startsWith('--')
    );

    if (!hasGeneratedFiles && !snap.code) {
      // Aucun projet généré → génération complète
      await generateNewProject(userMsg);

      // ✅ LIAISON RÉELLE : Persister tous les fichiers générés sur le WorkspaceService
      if (projectId) {
        const generatedFiles = useAiStore.getState().files;
        const mapping = {
          sql: "db/schema.sql",
          model: "backend/model.js",
          controller: "backend/controller.js",
          routes: "backend/routes.js",
          frontend: "frontend/App.jsx",
        };

        Object.entries(mapping).forEach(([key, path]) => {
          if (generatedFiles[key]) {
            api.put(`/api/projects/${projectId}/files/content`, {
              path,
              content: generatedFiles[key]
            }).catch(err => console.error(`Erreur de synchro initiale pour ${path}:`, err));
          }
        });
      }
    } else {
      // Modification : si pas de sélection, on cible le fichier actif
      if (!snap.file) {
        snap.file = files[activeFile] ? activeFile : null;
        snap.code = null;
      }

      const response = await askModification(userMsg, files, snap.code, snap.file);
      const aiReply = response?.explanation
        || response?.message
        || `✅ ${fileLabels[snap.file] || 'Fichier'} mis à jour avec succès.`;

      // ✅ LIAISON RÉELLE : Si on est dans un projet existant, on sauvegarde sur le WorkspaceService
      if (projectId && snap.file && response?.updatedFile) {
        try {
          const filePath = snap.file === 'sql' ? 'db/schema.sql' : snap.file === 'frontend' ? 'frontend/App.jsx' : 'backend/' + fileLabels[snap.file];
          await api.put(`/api/projects/${projectId}/files/content`, {
            path: filePath,
            content: response.updatedFile
          });
        } catch (err) {
          console.error("Erreur lors de la persistance automatique:", err);
        }
      }

      setChatHistory(prev => [...prev, { role: 'ai', text: aiReply }]);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      backgroundColor: '#0d1a24', fontFamily: "'DM Sans', 'Segoe UI', sans-serif"
    }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #1a3a5c, #0d5ea3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BotIcon />
        </div>
        <div>
          <div style={{ color: '#e8f4fd', fontSize: '13px', fontWeight: '600' }}>Assistant IA Maestro</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Génération & modification de code</div>
        </div>
        <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4caf50', boxShadow: '0 0 6px #4caf50' }} />
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {chatHistory.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #1565c0, #0d47a1)' : 'rgba(255,255,255,0.05)',
              border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.08)' : 'none',
              color: msg.role === 'user' ? '#fff' : '#cdd9e5',
              fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap',
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', gap: '4px', padding: '8px 14px', alignItems: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: '7px', height: '7px', borderRadius: '50%',
                backgroundColor: '#64b5f6',
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
            <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-8px);opacity:1} }`}</style>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.2)', color: '#ef9a9a', fontSize: '12px' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Snippet sélectionné */}
      {selectedCode && (
        <div style={{ margin: '0 16px', padding: '10px 12px', backgroundColor: 'rgba(100,181,246,0.08)', border: '1px solid rgba(100,181,246,0.2)', borderRadius: '8px', fontSize: '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ color: '#64b5f6', fontWeight: '600' }}>
              📎 {fileLabels[selectedFile] || selectedFile}
            </span>
            <span
              onClick={clearSelectedCode}
              style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
            >✕</span>
          </div>
          <pre style={{
            margin: 0, color: 'rgba(255,255,255,0.5)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
            overflow: 'hidden', maxHeight: '60px', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
          }}>
            {selectedCode.slice(0, 150)}{selectedCode.length > 150 ? '…' : ''}
          </pre>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'flex-end',
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '10px 12px',
        }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={selectedCode ? `Que faire avec ce code ? (ex: ajoute la validation)` : `ex: Crée une gestion de bibliothèque...`}
            rows={2}
            style={{
              flex: 1, backgroundColor: 'transparent', color: '#cdd9e5',
              border: 'none', outline: 'none', resize: 'none',
              fontSize: '13px', lineHeight: '1.5', fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
            style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: isLoading || !message.trim() ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #1565c0, #0d47a1)',
              border: 'none', cursor: isLoading || !message.trim() ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isLoading || !message.trim() ? 'rgba(255,255,255,0.3)' : '#fff',
              flexShrink: 0, transition: 'all 0.2s',
            }}
          >
            <SendIcon />
          </button>
        </div>
        <div style={{ marginTop: '8px', color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center' }}>
          Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
        </div>
      </div>
    </div>
  );
};

export default ChatBox;