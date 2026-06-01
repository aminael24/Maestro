import React, { useState, useEffect, useRef } from "react";
import { useAiStore } from "../../store/useAiStore";

const Terminal = ({ projectId, projectType }) => {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [backendUrl, setBackendUrl] = useState(null);
  const [frontendUrl, setFrontendUrl] = useState(null);
  const logsEndRef = useRef(null);
  const { files } = useAiStore();

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message, type = "info") => {
    setLogs((prev) => [
      ...prev,
      { message, type, time: new Date().toLocaleTimeString() },
    ]);
  };

  const runProject = () => {
    const hasCode = Object.values(files).some((f) => f && f.trim().length > 20);
    if (!hasCode) {
      addLog(
        "❌ Aucun code généré. Générez d'abord un projet avec l'agent IA.",
        "error",
      );
      return;
    }

    setIsRunning(true);
    setBackendUrl(null);
    setFrontendUrl(null);
    setLogs([]);
    addLog("🚀 Connexion au Runner Service...", "info");

    fetch("http://localhost:6001/api/runner/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // ✅ MODIFIÉ : on envoie projectType + tous les fichiers générés
      body: JSON.stringify({
        projectId: projectId,
        projectType: (projectType || "fullstack").toLowerCase(),
        sql: files.sql || "",
        model: files.model || "",
        controller: files.controller || "",
        routes: files.routes || "",
        frontend: files.frontend || "",
      }),
    })
      .then((response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const read = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              setIsRunning(false);
              return;
            }
            const text = decoder.decode(value);
            const lines = text
              .split("\n")
              .filter((l) => l.startsWith("data: "));
            lines.forEach((line) => {
              const msg = line.replace("data: ", "").trim();
              if (msg.startsWith("BACKEND_URL:")) {
                setBackendUrl(msg.replace("BACKEND_URL:", ""));
              } else if (msg.startsWith("FRONTEND_URL:")) {
                setFrontendUrl(msg.replace("FRONTEND_URL:", ""));
              } else if (msg === "DONE") {
                addLog("✅ Projet lancé avec succès !", "success");
                setIsRunning(false);
              } else if (msg.startsWith("ERROR:")) {
                addLog(msg, "error");
                setIsRunning(false);
              } else if (msg) {
                addLog(msg, "info");
              }
            });
            read();
          });
        };
        read();
      })
      .catch(() => {
        addLog("❌ Erreur de connexion au Runner Service", "error");
        setIsRunning(false);
      });
  };

  const getLogColor = (type) => {
    switch (type) {
      case "error":
        return "#f44336";
      case "success":
        return "#4caf50";
      default:
        return "#80cbc4";
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#0d1117",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#161b22",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#f44336", fontSize: "12px" }}>●</span>
          <span style={{ color: "#ffeb3b", fontSize: "12px" }}>●</span>
          <span style={{ color: "#4caf50", fontSize: "12px" }}>●</span>
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "12px",
              marginLeft: "8px",
            }}
          >
            Terminal — Runner Service
          </span>
        </div>
        <button
          onClick={runProject}
          disabled={isRunning}
          style={{
            padding: "6px 16px",
            borderRadius: "6px",
            border: "none",
            background: isRunning
              ? "rgba(255,255,255,0.1)"
              : "linear-gradient(135deg, #1565c0, #0d47a1)",
            color: isRunning ? "rgba(255,255,255,0.3)" : "#fff",
            cursor: isRunning ? "default" : "pointer",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          {isRunning ? "⏳ Exécution..." : "▶ Exécuter"}
        </button>
      </div>

      {/* Logs */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "12px",
          lineHeight: "1.8",
        }}
      >
        {logs.length === 0 && (
          <span style={{ color: "rgba(255,255,255,0.2)" }}>
            Cliquez sur "Exécuter" pour lancer le projet généré...
          </span>
        )}
        {logs.map((log, i) => (
          <div key={i} style={{ color: getLogColor(log.type) }}>
            <span
              style={{ color: "rgba(255,255,255,0.2)", marginRight: "8px" }}
            >
              [{log.time}]
            </span>
            {log.message}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* URLs */}
      {(backendUrl || frontendUrl) && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "#161b22",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {backendUrl && (
            <a
              href={backendUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#64b5f6",
                fontSize: "12px",
                textDecoration: "none",
                padding: "4px 10px",
                borderRadius: "4px",
                backgroundColor: "rgba(100,181,246,0.1)",
                border: "1px solid rgba(100,181,246,0.2)",
              }}
            >
              🔧 Backend: {backendUrl}
            </a>
          )}
          {frontendUrl && (
            <a
              href={frontendUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#81c784",
                fontSize: "12px",
                textDecoration: "none",
                padding: "4px 10px",
                borderRadius: "4px",
                backgroundColor: "rgba(129,199,132,0.1)",
                border: "1px solid rgba(129,199,132,0.2)",
              }}
            >
              🌐 Frontend: {frontendUrl}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default Terminal;
