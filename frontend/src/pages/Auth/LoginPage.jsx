import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { redirectToGatewayLogin } from "../../services/authService";

const ERROR_MESSAGES = {
  invalid_state:
    "Session de login expirée. Réessayez la connexion.",
  missing_code:
    "Keycloak n'a pas retourné de code d'autorisation.",
  token_exchange_failed:
    "Échec de l'échange de code avec Keycloak. Vérifiez la configuration du client maestro-api-gateway.",
  no_access_token:
    "Aucun access_token reçu de Keycloak.",
  access_denied:
    "Connexion refusée.",
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get("error");
  const errorMessage = errorParam
    ? ERROR_MESSAGES[errorParam] || `Erreur de connexion: ${errorParam}`
    : null;

  function handleLogin() {
    setLoading(true);
    redirectToGatewayLogin(); // full-page navigation to ApiGateway
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

          {errorMessage && (
            <div style={styles.errorBanner}>⚠️ {errorMessage}</div>
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
            Authentification sécurisée via Keycloak (OIDC)
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
      "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.25), transparent 40%)," +
      "radial-gradient(circle at 80% 60%, rgba(37,99,235,0.25), transparent 40%)",
  },
  content: {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
  },
  center: {
    width: "100%",
    maxWidth: 480,
    textAlign: "center",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 24,
    padding: "48px 32px",
    backdropFilter: "blur(8px)",
  },
  logoCircle: {
    width: 64,
    height: 64,
    margin: "0 auto 20px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    fontWeight: 800,
  },
  logoText: { color: "#fff" },
  title: { margin: "0 0 12px", fontSize: 36, fontWeight: 800 },
  subtitle: {
    margin: "0 0 28px",
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    lineHeight: 1.6,
  },
  errorBanner: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 12,
    color: "#fecaca",
    padding: "10px 14px",
    fontSize: 14,
    marginBottom: 18,
  },
  actions: { display: "grid", gap: 12 },
  primaryButton: {
    padding: "14px 18px",
    borderRadius: 12,
    border: "none",
    fontWeight: 700,
    fontSize: 15,
    color: "#fff",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
  },
  secondaryButton: {
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 15,
    background: "transparent",
  },
  hint: {
    marginTop: 24,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
};
