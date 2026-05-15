"use client";
import React, { useEffect, useRef } from "react";

// --- STYLES INLINE (Pour éviter les problèmes de Tailwind) ---
const styles = {
  container: {
    position: "relative",
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    backgroundColor: "#083A4F", // Fond Navy de secours
  },
  glassCard: {
    position: "relative",
    zIndex: 10,
    width: "90%",
    maxWidth: "900px",
    padding: "40px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(15px)",
    WebkitBackdropFilter: "blur(15px)",
    borderRadius: "30px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    color: "#fff",
  },
  input: {
    width: "100%",
    padding: "15px",
    marginBottom: "15px",
    backgroundColor: "rgba(8, 58, 79, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "15px",
    backgroundColor: "#A58D66", // Ton Gold
    color: "#083A4F",
    border: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    transition: "transform 0.2s ease",
  },
  infoText: {
    color: "#C0D5D6", // Ton Aqua
    fontSize: "14px",
    marginBottom: "5px",
  },
};

const ContactUs = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let nt = 0;

    // VITESSE RAPIDE : 0.008
    const waveSpeed = 0.008;
    const colors = ["#083A4F", "#A58D66", "#C0D5D6", "#407E8C", "#E5E1DD"];

    const draw = () => {
      ctx.fillStyle = "#083A4F";
      ctx.fillRect(0, 0, w, h);

      nt += waveSpeed;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.lineWidth = 60;
        ctx.strokeStyle = colors[i];
        ctx.globalAlpha = 0.4;
        for (let x = 0; x < w; x += 10) {
          const y =
            Math.sin(x * 0.002 + i + nt) * Math.cos(x * 0.001 + nt) * 120;
          ctx.lineTo(x, y + h * 0.5);
        }
        ctx.stroke();
      }
      requestAnimationFrame(draw);
    };

    window.onresize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    draw();
  }, []);

  return (
    <div style={styles.container}>
      {/* Animation Canvas en fond */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />

      {/* Carte du formulaire centrée */}
      <div style={styles.glassCard}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0 0 10px 0" }}
          >
            Parlons <span style={{ color: "#A58D66" }}>Avenir</span>
          </h2>
          <p style={{ color: "#C0D5D6", maxWidth: "500px", margin: "0 auto" }}>
            Un projet en tête ? Contactez-nous pour une collaboration fluide.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "40px" }}>
          {/* Infos */}
          <div style={{ flex: "1 1 300px" }}>
            <div
              style={{
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(165,141,102,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyCenter: "center",
                  border: "1px solid #A58D66",
                }}
              >
                <span style={{ color: "#A58D66", margin: "auto" }}>✉</span>
              </div>
              <div>
                <div style={styles.infoText}>EMAIL</div>
                <div style={{ fontWeight: "bold" }}>
                  salmamarzouk07@gmail.com
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <form
            style={{ flex: "1 1 300px" }}
            onSubmit={(e) => e.preventDefault()}
          >
            <input style={styles.input} type="text" placeholder="Votre Nom" />
            <input
              style={styles.input}
              type="email"
              placeholder="Votre Email"
            />
            <textarea
              style={{ ...styles.input, height: "120px", resize: "none" }}
              placeholder="Votre message..."
            />
            <button
              style={styles.button}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "scale(1.02)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span>➤</span> Envoyer le message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
