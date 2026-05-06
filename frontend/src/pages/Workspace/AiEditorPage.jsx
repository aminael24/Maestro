import React from "react";
import AiFileTree from "../../components/Sidebar/AiFileTree";
import CodeEditor from "../../components/Workspace/CodeEditor";
import ChatBox from "../../components/Workspace/ChatBox";
import Terminal from "../../components/Workspace/Terminal";

const AiEditorPage = () => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 360px",
        gridTemplateRows: "1fr 250px",
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "#0f1923",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      {/* Sidebar gauche - occupe les 2 lignes */}
      <aside
        style={{
          gridColumn: "1",
          gridRow: "1 / 3",
          background: "linear-gradient(180deg, #0d1f2d 0%, #0f1923 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          overflowY: "auto",
        }}
      >
        <AiFileTree />
      </aside>

      {/* Éditeur central - ligne 1 */}
      <main
        style={{
          gridColumn: "2",
          gridRow: "1",
          display: "flex",
          flexDirection: "column",
          background: "#111d27",
          overflow: "hidden",
        }}
      >
        <CodeEditor />
      </main>

      {/* Terminal - ligne 2 milieu */}
      <div
        style={{
          gridColumn: "2",
          gridRow: "2",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "8px",
          background: "#0d1117",
        }}
      >
        <Terminal />
      </div>

      {/* Chat droit - occupe les 2 lignes */}
      <section
        style={{
          gridColumn: "3",
          gridRow: "1 / 3",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          background: "#0d1a24",
          overflow: "hidden",
        }}
      >
        <ChatBox />
      </section>
    </div>
  );
};

export default AiEditorPage;
