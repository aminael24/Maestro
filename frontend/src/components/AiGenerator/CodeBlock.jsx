import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        background: "rgba(5,35,48,0.8)",
        border: "1px solid rgba(192,213,214,0.1)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* Header de la code block */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.65rem 1rem",
          background: "rgba(192,213,214,0.05)",
          borderBottom: "1px solid rgba(192,213,214,0.08)",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.62rem",
            color: "#A58D66",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {lang}
        </span>
        <button
          onClick={copy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: copied
              ? "rgba(111,207,151,0.1)"
              : "rgba(64,126,140,0.15)",
            border: `1px solid ${copied ? "rgba(111,207,151,0.3)" : "rgba(64,126,140,0.25)"}`,
            borderRadius: 5,
            padding: "0.3rem 0.75rem",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.62rem",
            color: copied ? "#6fcf97" : "#5a9baa",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>

      {/* Contenu du code */}
      <div
        style={{
          padding: "1.25rem 1.5rem",
          overflowX: "auto",
          maxHeight: 420,
          overflowY: "auto",
        }}
      >
        <pre
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.78rem",
            lineHeight: 1.7,
            color: "#c8dce4",
            whiteSpace: "pre",
            margin: 0,
          }}
        >
          {code}
        </pre>
      </div>
    </div>
  );
}
