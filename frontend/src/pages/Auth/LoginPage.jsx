import { useState } from "react";
import { Link } from "react-router-dom";
import { redirectToKeycloakLogin } from "../../features/auth/authHelpers";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      await redirectToKeycloakLogin(); // déclenche window.location.href → ne retourne pas
    } catch (err) {
      console.error("Redirect error:", err);
      setError("Impossible de contacter Keycloak. Vérifiez votre connexion.");
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        <div style={styles.center}>
          <div style={styles.logoCircle}>
            <span style={styles.logoText}>M</span>
          </div>

          <h1 style={styles.title}>Maestro</h1>

          <p style={styles.subtitle}>
            Plateforme intelligente pour orchestrer vos projets, automatiser
            votre workflow DevOps et piloter votre workspace.
          </p>

          {error && (
            <div style={styles.errorBanner}>
              ⚠️ {error}
            </div>
          )}

          <div style={styles.actions}>
            <button
              style={{
                ...styles.primaryButton,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "wait" : "pointer",
              }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Redirection…" : "Se connecter"}
            </button>

            <Link to="/auth/register" style={styles.secondaryButton}>
              Créer un compte
            </Link>
          </div>

          <p style={styles.hint}>
            Authentification sécurisée via Keycloak (OIDC + PKCE)
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    background: "#0b1020",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, rgba(8,12,25,0.95), rgba(48,35,115,0.40), rgba(8,12,25,0.95))",
    zIndex: 0,
  },
  content: {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "32px",
  },
  center: { maxWidth: "600px", textAlign: "center" },
  logoCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
    boxShadow: "0 8px 32px rgba(124,58,237,0.35)",
  },
  logoText: { fontSize: "36px", fontWeight: 800, color: "#fff" },
  title: {
    margin: "0 0 8px",
    fontSize: "56px",
    fontWeight: 800,
    letterSpacing: "-1.5px",
    background: "linear-gradient(135deg, #fff 30%, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    marginTop: "12px",
    fontSize: "18px",
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.75)",
    maxWidth: "480px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  errorBanner: {
    marginTop: "20px",
    padding: "12px 18px",
    borderRadius: "10px",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.30)",
    color: "#fca5a5",
    fontSize: "14px",
  },
  actions: {
    display: "flex",
    gap: "14px",
    justifyContent: "center",
    marginTop: "32px",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "16px 32px",
    borderRadius: "14px",
    border: "none",
    fontWeight: 700,
    fontSize: "16px",
    color: "#fff",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    boxShadow: "0 4px 20px rgba(124,58,237,0.30)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  secondaryButton: {
    padding: "16px 32px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.15)",
    fontWeight: 600,
    fontSize: "16px",
    color: "#fff",
    background: "rgba(255,255,255,0.06)",
    textDecoration: "none",
    transition: "background 0.15s",
  },
  hint: {
    marginTop: "28px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.35)",
  },
};
