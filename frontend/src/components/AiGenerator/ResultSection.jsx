import { useState } from "react";
import CodeBlock from "./CodeBlock";

export default function ResultSection({
  backend,
  frontend,
  explanation,
  language,
}) {
  const [tab, setTab] = useState("backend");

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        animation: "fadeUp 0.4s ease forwards",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "1.3rem",
            color: "#f9f7f5",
            margin: 0,
          }}
        >
          Code généré
        </h2>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.65rem",
            color: "#407E8C",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {language?.toUpperCase()}
        </span>
      </div>

      {/* Explication */}
      <div
        style={{
          background: "rgba(64,126,140,0.1)",
          border: "1px solid rgba(64,126,140,0.2)",
          borderLeft: "3px solid #407E8C",
          borderRadius: "0 8px 8px 0",
          padding: "1rem 1.25rem",
        }}
      >
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.14em",
            color: "#407E8C",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Explication
        </div>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 300,
            color: "rgba(229,225,221,0.8)",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {explanation}
        </p>
      </div>

      {/* Onglets Backend / Frontend */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(192,213,214,0.12)",
        }}
      >
        {["backend", "frontend"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.6rem 1.2rem",
              fontSize: "0.8rem",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.05em",
              color: tab === t ? "#A58D66" : "rgba(229,225,221,0.45)",
              borderBottom:
                tab === t ? "2px solid #A58D66" : "2px solid transparent",
              marginBottom: -1,
              background: "none",
              border: "none",
              borderBottomStyle: "solid",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t === "backend" ? "Backend · Express" : "Frontend · React"}
          </button>
        ))}
      </div>

      {/* Affichage du code selon l'onglet actif */}
      {tab === "backend" ? (
        <CodeBlock code={backend} lang="JavaScript · Express" />
      ) : (
        <CodeBlock code={frontend} lang="JSX · React" />
      )}
    </section>
  );
}
