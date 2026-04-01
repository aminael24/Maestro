import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCode, getMe } from "../../services/authService";
import { clearPkceData } from "../../features/auth/authHelpers";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Connexion en cours...");
  const [error, setError] = useState(null);
  const [sub, setSub] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const returnedState = params.get("state");
        const kcError = params.get("error");

        if (kcError) {
          const desc = params.get("error_description") || kcError;
          throw new Error(`Keycloak : ${desc}`);
        }

        if (!code) {
          clearPkceData();
          throw new Error(
            "Keycloak n'a pas retourné de code d'autorisation.\n\n" +
              "Vérifiez dans Keycloak Admin :\n" +
              "• Clients → maestro-frontend → Settings\n" +
              "• Standard flow : ON\n" +
              "• Valid redirect URI : http://localhost:5173/auth/callback\n" +
              "  (sans slash final, sans wildcard)\n" +
              "• Advanced → PKCE method : S256"
          );
        }

        setMessage("Échange du code PKCE...");
        const { accessToken } = await exchangeCode(code, returnedState);

        if (!accessToken) {
          throw new Error(
            "Token non reçu après échange. Vérifiez les logs du backend (.NET)."
          );
        }

        setMessage("Récupération du profil...");
        const user = await getMe(accessToken);

        setSub(user.username || user.keycloakId);
        setMessage("Connexion réussie !");
        setTimeout(() => navigate("/workspace", { replace: true }), 800);
      } catch (err) {
        console.error("Callback error:", err);
        clearPkceData();
        setError(err.message);
        setMessage("Échec de connexion");
      }
    };

    run();
  }, [navigate]);

  function handleRetry() {
    window.location.href = "/auth/login";
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {!error && <div style={styles.spinner} />}
        {error && <div style={styles.errorIcon}>✕</div>}

        <h2 style={styles.title}>{message}</h2>
        {sub && <p style={styles.user}>Bienvenue, {sub}</p>}

        {error ? (
          <>
            <pre style={styles.errorMsg}>{error}</pre>
            <button style={styles.retryBtn} onClick={handleRetry}>
              Réessayer la connexion
            </button>
          </>
        ) : (
          <p style={styles.hint}>Maestro prépare votre session...</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #0b1020 0%, #1a1040 100%)",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  card: {
    padding: "40px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    textAlign: "center",
    maxWidth: "480px",
    width: "100%",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 20px",
  },
  errorIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(239,68,68,0.15)",
    border: "2px solid #ef4444",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    fontSize: "18px",
    color: "#ef4444",
  },
  title: { margin: "0 0 8px", fontSize: "20px", fontWeight: 600 },
  user: { color: "#a78bfa", fontSize: "16px", margin: "8px 0" },
  hint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "14px",
    margin: "12px 0 0",
  },
  errorMsg: {
    color: "rgba(255,255,255,0.65)",
    fontSize: "13px",
    margin: "8px 0 20px",
    lineHeight: 1.7,
    textAlign: "left",
    background: "rgba(0,0,0,0.35)",
    padding: "14px 16px",
    borderRadius: "10px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: "monospace",
  },
  retryBtn: {
    padding: "12px 28px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "15px",
    color: "#fff",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
  },
};
