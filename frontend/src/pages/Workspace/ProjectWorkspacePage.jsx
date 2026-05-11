import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAiStore } from '../../store/useAiStore';
import AiFileTree from '../../components/Sidebar/AiFileTree';
import CodeEditor from '../../components/Workspace/CodeEditor';
import ChatBox from '../../components/Workspace/ChatBox';

const ProjectWorkspacePage = () => {
  const { projectId } = useParams();
  const navigate      = useNavigate();
  const [project, setProject] = useState(null);
  const { resetProject } = useAiStore();  // ← vide le store au montage

  useEffect(() => {
    // Vide le contenu AI précédent pour ne pas afficher
    // le dernier projet généré dans l'AI Generator
    resetProject();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    api.get(`/api/projects/${projectId}`)
      .then(r => setProject(r.data))
      .catch(console.error);
  }, [projectId]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr 360px',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#0f1923',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      {/* Barre de contexte */}
      <div style={{
        gridColumn: '1 / -1', height: '36px',
        background: '#0a1520',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center',
        padding: '0 1rem', gap: '0.75rem', flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/workspace/projects')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px', padding: '2px 6px', borderRadius: '4px', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
          onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
        >
          ← Projets
        </button>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>/</span>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', fontFamily: 'monospace' }}>
          {project?.name || `Projet #${projectId}`}
        </span>
        {project?.type && (
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(100,181,246,0.1)', color: '#64b5f6', fontWeight: '600' }}>
            {project.type}
          </span>
        )}
      </div>

      <aside style={{
        background: 'linear-gradient(180deg, #0d1f2d 0%, #0f1923 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflowY: 'auto', height: 'calc(100vh - 36px)',
      }}>
        <AiFileTree projectType={project?.type} />
      </aside>

      <main style={{
        display: 'flex', flexDirection: 'column',
        background: '#111d27', height: 'calc(100vh - 36px)', overflow: 'hidden',
      }}>
        <CodeEditor />
      </main>

      <section style={{
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        background: '#0d1a24', height: 'calc(100vh - 36px)', overflow: 'hidden',
      }}>
        <ChatBox />
      </section>
    </div>
  );
};

export default ProjectWorkspacePage;
