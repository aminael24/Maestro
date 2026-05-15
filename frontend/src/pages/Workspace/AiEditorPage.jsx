import React from 'react';
import AiFileTree from '../../components/Sidebar/AiFileTree';
import CodeEditor from '../../components/Workspace/CodeEditor';
import ChatBox from '../../components/Workspace/ChatBox';
import RepoGate from '../../components/repository/RepoGate';
import RepoTopBar from '../../components/repository/RepoTopBar';
import { useGitHubStore } from '../../store/gitHubStore';

const AiEditorPage = () => {
  const { isConnected } = useGitHubStore();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr 360px',
      gridTemplateRows: isConnected ? 'auto 1fr' : '1fr',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#0f1923',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      {/* GitHub Gate - shows when not connected */}
      <RepoGate />

      {/* GitHub Top Bar - shows when connected */}
      {isConnected && (
        <div style={{ gridColumn: '1 / -1', zIndex: 10 }}>
          <RepoTopBar />
        </div>
      )}

      {/* Sidebar gauche */}
      <aside style={{
        background: 'linear-gradient(180deg, #0d1f2d 0%, #0f1923 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflowY: 'auto',
        height: isConnected ? 'calc(100vh - 80px)' : '100vh',
        gridColumn: '1',
        gridRow: isConnected ? '2' : '1',
      }}>
        <AiFileTree />
      </aside>

      {/* Éditeur central */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#111d27',
        height: isConnected ? 'calc(100vh - 80px)' : '100vh',
        overflow: 'hidden',
        gridColumn: '2',
        gridRow: isConnected ? '2' : '1',
      }}>
        <CodeEditor />
      </main>

      {/* Chat droit */}
      <section style={{
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        background: '#0d1a24',
        height: isConnected ? 'calc(100vh - 80px)' : '100vh',
        overflow: 'hidden',
        gridColumn: '3',
        gridRow: isConnected ? '2' : '1',
      }}>
        <ChatBox />
      </section>
    </div>
  );
};

export default AiEditorPage;