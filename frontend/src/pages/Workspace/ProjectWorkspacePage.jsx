import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AiFileTree from '../../components/Sidebar/AiFileTree';
import CodeEditor from '../../components/Workspace/CodeEditor';
import ChatBox from '../../components/Workspace/ChatBox';

/**
 * ProjectWorkspacePage
 *
 * Wrapper de l'éditeur lié à un projet existant.
 * Récupère le projectId depuis l'URL et le passe en prop
 * à chaque composant de l'éditeur (FileTree, CodeEditor, ChatBox).
 *
 * Route : /workspace/projects/:projectId
 */
const ProjectWorkspacePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

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
      {/* Barre de contexte projet (en haut, sur toute la largeur) */}
      <div style={{
        gridColumn: '1 / -1',
        height: '36px',
        background: '#0a1520',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        gap: '0.75rem',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/workspace/projects')}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '2px 6px',
            borderRadius: '4px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
          onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
          title="Retour aux projets"
        >
          ← Projets
        </button>

        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>/</span>

        <span style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}>
          Projet #{projectId}
        </span>
      </div>

      {/* Sidebar gauche — arbre de fichiers */}
      <aside style={{
        background: 'linear-gradient(180deg, #0d1f2d 0%, #0f1923 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflowY: 'auto',
        height: 'calc(100vh - 36px)',
      }}>
        <AiFileTree projectId={projectId} />
      </aside>

      {/* Éditeur central */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#111d27',
        height: 'calc(100vh - 36px)',
        overflow: 'hidden',
      }}>
        <CodeEditor projectId={projectId} />
      </main>

      {/* Chat IA droit */}
      <section style={{
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        background: '#0d1a24',
        height: 'calc(100vh - 36px)',
        overflow: 'hidden',
      }}>
        <ChatBox projectId={projectId} />
      </section>
    </div>
  );
};

export default ProjectWorkspacePage;
