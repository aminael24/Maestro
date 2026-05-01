import React from 'react';
import AiFileTree from '../../components/Sidebar/AiFileTree';
import CodeEditor from '../../components/Workspace/CodeEditor';
import ChatBox from '../../components/Workspace/ChatBox';

const AiEditorPage = () => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr 360px',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',       // ✅ empêche le scroll global
      backgroundColor: '#0f1923',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      {/* Sidebar gauche */}
      <aside style={{
        background: 'linear-gradient(180deg, #0d1f2d 0%, #0f1923 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflowY: 'auto',      // ✅ scroll indépendant
        height: '100vh',
      }}>
        <AiFileTree />
      </aside>

      {/* Éditeur central */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#111d27',
        height: '100vh',
        overflow: 'hidden',     // ✅ le scroll est géré dans CodeEditor
      }}>
        <CodeEditor />
      </main>

      {/* Chat droit */}
      <section style={{
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        background: '#0d1a24',
        height: '100vh',
        overflow: 'hidden',     // ✅ le scroll est géré dans ChatBox
      }}>
        <ChatBox />
      </section>
    </div>
  );
};

export default AiEditorPage;