// src/components/landing/MeshGradientBackground.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// ─── Palette ────────────────────────────────────────────────────────────────
const P = {
  navy: "#083A4F",
  gold: "#A58D66",
  aqua: "#C0D5D6",
  teal: "#407E8C",
  sand: "#E5E1DD",
};

const BLOBS = [
  { color: P.teal, size: 700, left: "0%",  top: "-5%",  dur: 18, delay: 0,   opacity: 0.75 },
  { color: P.gold, size: 550, left: "55%", top: "35%",  dur: 22, delay: 1.2, opacity: 0.65 },
  { color: P.aqua, size: 500, left: "35%", top: "-15%", dur: 26, delay: 2.4, opacity: 0.7  },
  { color: P.sand, size: 450, left: "-5%", top: "50%",  dur: 20, delay: 3.6, opacity: 0.55 },
  { color: P.navy, size: 400, left: "75%", top: "0%",   dur: 15, delay: 4.8, opacity: 0.8  },
  { color: P.gold, size: 350, left: "20%", top: "60%",  dur: 24, delay: 1.8, opacity: 0.6  },
];

export default function MeshGradientBackground({
  loggingIn = false,
  onLogin,
  activeLogLine = 3,
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Garde-fou : si onLogin n'est pas passé, on log un avertissement
  const handleLoginClick = (e) => {
    if (typeof onLogin === "function") {
      onLogin(e);
    } else {
      console.warn(
        "[MeshGradientBackground] onLogin prop manquante — le bouton 'Se connecter' n'a aucune action."
      );
    }
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        background: P.navy,
      }}
    >
      {/* ── Blobs de fond ─────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {BLOBS.map((b, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: b.size,
              height: b.size,
              left: b.left,
              top: b.top,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${b.color} 0%, ${b.color}99 30%, transparent 70%)`,
              filter: "blur(55px)",
              opacity: b.opacity,
              mixBlendMode: "screen",
            }}
            animate={{
              x: [0, 50, -35, 25, 0],
              y: [0, -40, 50, -25, 0],
              scale: [1, 1.12, 0.92, 1.06, 1],
            }}
            transition={{
              duration: b.dur,
              repeat: Infinity,
              ease: "easeInOut",
              delay: b.delay,
            }}
          />
        ))}
      </div>

      {/* ── Contenu hero ──────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "48px",
          padding: "80px 64px 64px",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        {/* ── LEFT : texte ──────────────────────────────────────────── */}
        <motion.div
          style={{ flex: "0 0 auto", maxWidth: "520px" }}
          initial={{ opacity: 0, x: -40 }}
          animate={revealed ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge pill */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={revealed ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "999px",
              background: "rgba(64,126,140,0.15)",
              border: `1px solid rgba(192,213,214,0.25)`,
              backdropFilter: "blur(8px)",
              marginBottom: "32px",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 0,
                left: "8%",
                right: "8%",
                height: "1px",
                background: `linear-gradient(to right, transparent, ${P.aqua}80, transparent)`,
              }}
            />
            <motion.span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: P.teal,
                boxShadow: `0 0 8px ${P.teal}`,
                flexShrink: 0,
              }}
              animate={{ opacity: [1, 0.4, 1], scale: [1, 0.75, 1] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: `${P.sand}ee`,
              }}
            >
              Plateforme DevSecOps
            </span>
          </motion.div>

          {/* Titre 3 couches */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={revealed ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              margin: "0 0 24px",
              lineHeight: 1.05,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <motion.span
              style={{
                display: "block",
                fontSize: "clamp(2.6rem, 4.5vw, 4rem)",
                fontWeight: 300,
                letterSpacing: "0.06em",
                background: `linear-gradient(135deg, ${P.sand} 0%, ${P.aqua} 35%, ${P.gold} 70%, ${P.sand} 100%)`,
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              Orchestrez
            </motion.span>

            <span
              style={{
                display: "block",
                fontSize: "clamp(3.2rem, 6vw, 5rem)",
                fontWeight: 900,
                color: P.sand,
                letterSpacing: "-0.01em",
                textShadow: `0 2px 40px ${P.navy}99`,
              }}
            >
              vos projets
            </span>

            <span
              style={{
                display: "block",
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                fontWeight: 300,
                fontStyle: "italic",
                color: `${P.aqua}cc`,
                letterSpacing: "0.01em",
              }}
            >
              en toute sérénité.
            </span>
          </motion.h1>

          {/* Body */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={revealed ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            style={{
              fontSize: "1.05rem",
              fontWeight: 300,
              color: `${P.sand}99`,
              lineHeight: 1.7,
              maxWidth: "460px",
              margin: "0 0 36px",
            }}
          >
            Maestro automatise vos pipelines CI/CD, sécurise vos déploiements et
            pilote l'ensemble de votre workflow DevOps depuis un workspace
            unique.
          </motion.p>

          {/* Boutons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={revealed ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.0 }}
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: "32px",
            }}
          >
            {/* Glass — Découvrir */}
            <motion.button
              type="button"
              onClick={() => {
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              data-testid="hero-discover-btn"
              aria-label="Découvrir les fonctionnalités"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "14px 32px",
                borderRadius: "999px",
                background: "transparent",
                border: `2px solid rgba(192,213,214,0.30)`,
                color: P.aqua,
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Découvrir{" "}
              <span aria-hidden="true" style={{ display: "inline-block" }}>
                ↓
              </span>
            </motion.button>

            {/* Gradient — Se connecter */}
            <motion.button
              type="button"
              onClick={handleLoginClick}
              disabled={loggingIn}
              data-testid="hero-login-btn"
              aria-label="Se connecter"
              whileHover={!loggingIn ? { scale: 1.04 } : {}}
              whileTap={!loggingIn ? { scale: 0.97 } : {}}
              style={{
                padding: "14px 32px",
                borderRadius: "999px",
                border: "none",
                background: `linear-gradient(135deg, ${P.teal}, ${P.gold})`,
                color: P.sand,
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: loggingIn ? "not-allowed" : "pointer",
                boxShadow: `0 4px 20px ${P.teal}55`,
                opacity: loggingIn ? 0.55 : 1,
              }}
            >
              {loggingIn ? "Redirection…" : "Se connecter →"}
            </motion.button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={revealed ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.2 }}
            style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
          >
            {[
              "🔒 OIDC + Keycloak",
              "🍪 Cookies HttpOnly",
              "⚡ CI/CD intégré",
            ].map((badge) => (
              <span
                key={badge}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: `1px solid rgba(192,213,214,0.18)`,
                  background: "rgba(64,126,140,0.08)",
                  color: `${P.sand}bb`,
                  fontSize: "0.78rem",
                  fontWeight: 400,
                  backdropFilter: "blur(4px)",
                }}
              >
                {badge}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ── RIGHT : mockup code ───────────────────────────────────── */}
        <motion.div
          style={{ flex: "0 0 auto", width: "min(580px, 48%)" }}
          initial={{ opacity: 0, x: 40 }}
          animate={revealed ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)",
              border: `1px solid rgba(192,213,214,0.18)`,
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: `0 32px 80px rgba(8,58,79,0.5), 0 0 0 1px rgba(192,213,214,0.08)`,
            }}
          >
            {/* Titlebar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 20px",
                borderBottom: `1px solid rgba(192,213,214,0.10)`,
                background: "rgba(8,58,79,0.3)",
              }}
            >
              <div style={{ display: "flex", gap: "6px" }}>
                {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                  <span
                    key={c}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: c,
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  color: `${P.sand}66`,
                  flex: 1,
                  textAlign: "center",
                }}
              >
                maestro › pipeline › production
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#28c840",
                  letterSpacing: "0.05em",
                }}
              >
                ● LIVE
              </span>
            </div>

            {/* Pipeline track */}
            <div style={{ padding: "20px 24px 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0",
                  marginBottom: "20px",
                }}
              >
                {[
                  { label: "build", state: "done" },
                  { label: "test", state: "done" },
                  { label: "scan", state: "active" },
                  { label: "deploy", state: "pending" },
                ].map((step, idx) => (
                  <div
                    key={step.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flex: idx < 3 ? "1" : "0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <PipelineNode state={step.state} />
                      <span
                        style={{
                          fontSize: "11px",
                          color:
                            step.state === "active" ? P.aqua : `${P.sand}66`,
                          fontWeight: step.state === "active" ? 600 : 400,
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < 3 && (
                      <div
                        style={{
                          flex: 1,
                          height: "2px",
                          background: `rgba(192,213,214,0.15)`,
                          margin: "0 4px",
                          marginBottom: "18px",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {(step.state === "done" || step.state === "active") && (
                          <motion.div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background:
                                step.state === "done" ? P.teal : P.aqua,
                              transformOrigin: "left",
                            }}
                            initial={{ scaleX: 0 }}
                            animate={{
                              scaleX: step.state === "active" ? [0, 0.7] : 1,
                            }}
                            transition={{
                              duration: step.state === "active" ? 2 : 0.6,
                              delay: idx * 0.3,
                              repeat: step.state === "active" ? Infinity : 0,
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Security scan bar */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: `${P.sand}aa` }}>
                    Security Scan
                  </span>
                  <motion.span
                    style={{ fontSize: "12px", fontWeight: 700, color: P.aqua }}
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    68%
                  </motion.span>
                </div>
                <div
                  style={{
                    height: "6px",
                    background: "rgba(192,213,214,0.12)",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    style={{
                      height: "100%",
                      background: `linear-gradient(to right, ${P.teal}, ${P.aqua})`,
                      borderRadius: "999px",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: "68%" }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: `${P.sand}44`,
                      fontFamily: "monospace",
                    }}
                  >
                    a4f32c1
                  </span>
                  <motion.span
                    style={{
                      fontSize: "10px",
                      color: "#ef4444",
                      fontWeight: 500,
                    }}
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    2 threats blocked
                  </motion.span>
                </div>
              </div>

              {/* Log feed */}
              <div
                style={{
                  background: "rgba(8,58,79,0.6)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  marginBottom: "16px",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  lineHeight: 1.8,
                }}
              >
                {[
                  { text: "✓ image build [12.4s]", status: "done" },
                  { text: "✓ unit tests [284 passed]", status: "done" },
                  { text: "✓ lint [0 errors]", status: "ok" },
                  { text: "→ scanning dependencies…", status: "active" },
                ].map((log, idx) => (
                  <motion.div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: idx === activeLogLine ? P.sand : `${P.sand}55`,
                    }}
                    animate={
                      idx === activeLogLine ? { opacity: [0.6, 1, 0.6] } : {}
                    }
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background:
                          log.status === "done"
                            ? "#28c840"
                            : log.status === "active"
                              ? P.gold
                              : P.aqua,
                      }}
                    />
                    <span>{log.text}</span>
                    {log.status === "active" && (
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        style={{ color: P.gold }}
                      >
                        ▍
                      </motion.span>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: "flex", padding: "0 0 20px", gap: "0" }}>
                {[
                  { val: "99.8%", label: "Uptime", color: "#28c840" },
                  { val: "12s", label: "Avg deploy", color: P.gold },
                  { val: "A+", label: "Security", color: P.aqua },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      borderLeft:
                        i > 0 ? `1px solid rgba(192,213,214,0.10)` : "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: s.color,
                      }}
                    >
                      {s.val}
                    </div>
                    <div style={{ fontSize: "10px", color: `${P.sand}55` }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Badge rotatif (bottom-right) ─────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          right: "32px",
          zIndex: 30,
          width: "80px",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: `2px solid ${P.teal}`,
          }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0.15, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{
            position: "absolute",
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${P.teal}, ${P.gold})`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            transform: "scale(1.6)",
          }}
          viewBox="0 0 100 100"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <path
              id="rc"
              d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
            />
          </defs>
          <text
            fontSize="8"
            style={{
              fill: `${P.sand}bb`,
              fontWeight: 500,
              letterSpacing: "0.05em",
            }}
          >
            <textPath href="#rc" startOffset="0%">
              Navy • Gold • Aqua • Teal • Sand • Navy • Gold •
            </textPath>
          </text>
        </motion.svg>
      </div>
    </div>
  );
}

// ─── Helper : nœud pipeline ──────────────────────────────────────────────────
function PipelineNode({ state }) {
  const base = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  };

  if (state === "done")
    return (
      <div
        style={{
          ...base,
          background: `${P.teal}33`,
          border: `2px solid ${P.teal}`,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: P.teal,
          }}
        />
      </div>
    );

  if (state === "active")
    return (
      <div
        style={{
          ...base,
          background: `${P.aqua}22`,
          border: `2px solid ${P.aqua}`,
        }}
      >
        <motion.span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: P.aqua,
            display: "block",
          }}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </div>
    );

  return (
    <div
      style={{
        ...base,
        background: "rgba(192,213,214,0.05)",
        border: `2px solid rgba(192,213,214,0.15)`,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "rgba(192,213,214,0.2)",
        }}
      />
    </div>
  );
}
