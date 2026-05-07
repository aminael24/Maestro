import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../services/authService";

/**
 * ForgotPasswordPage
 *
 * L'utilisateur entre son email → POST /auth/forgot-password.
 * Le gateway demande à Keycloak d'envoyer un email avec un lien de
 * reset. La réponse est TOUJOURS un succès générique
 * (anti-énumération) — on n'indique pas si l'email existe.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Veuillez saisir votre email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setDone(true);
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
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

          <h1 style={styles.title}>Mot de passe oublié</h1>

          {!done ? (
            <>
              <p style={styles.subtitle}>
                Entrez l'email associé à votre compte. Nous vous enverrons un
                lien pour définir un nouveau mot de passe.
              </p>

              {error && <div style={styles.errorBanner}>⚠️ {error}</div>}

              <form onSubmit={handleSubmit} style={styles.form}>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  style={styles.input}
                  disabled={loading}
                />

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.primaryButton,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "wait" : "pointer",
                  }}
                >
                  {loading ? "Envoi en cours…" : "Envoyer le lien"}
                </button>
              </form>
            </>
          ) : (
            <div style={styles.successBlock}>
              <div style={styles.successIcon}>✉️</div>
              <p style={styles.successText}>
                Si un compte existe pour <strong>{email}</strong>, un email
                contenant un lien de réinitialisation vient d'être envoyé.
                Vérifiez votre boîte (et le dossier spam).
              </p>
            </div>
          )}

          <div style={styles.bottomLinks}>
            <Link to="/auth/login" style={styles.linkText}>
              ← Retour à la connexion
            </Link>
          </div>
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
  title: { margin: "0 0 12px", fontSize: 28, fontWeight: 800 },
  subtitle: {
    margin: "0 0 24px",
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    lineHeight: 1.6,
  },
  errorBanner: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 12,
    color: "#fecaca",
    padding: "10px 14px",
    fontSize: 14,
    marginBottom: 16,
  },
  form: {
    display: "grid",
    gap: 12,
  },
  input: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  primaryButton: {
    padding: "14px 18px",
    borderRadius: 12,
    border: "none",
    fontWeight: 700,
    fontSize: 15,
    color: "#fff",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
  },
  successBlock: {
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: 12,
    padding: "20px 16px",
    marginBottom: 16,
  },
  successIcon: { fontSize: 36, marginBottom: 8 },
  successText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  bottomLinks: {
    marginTop: 28,
    display: "flex",
    justifyContent: "center",
  },
  linkText: {
    color: "rgba(255,255,255,0.7)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 500,
  },
};
