import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../../services/authService";

// ═══════════════════════════════════════════════════════════════
//  AuthCallbackPage – LEGACY.
//
//  The OIDC callback is now handled by the ApiGateway directly at
//  http://localhost:5000/auth/callback. The frontend route
//  /auth/callback should not be hit during a normal login.
//
//  Kept as a defensive redirect for bookmarks / Keycloak clients
//  that may still be configured with the old redirect URI: we
//  simply check whether there's an active session and route
//  accordingly.
// ═══════════════════════════════════════════════════════════════
export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getMe(); // checks the cookie session
        if (!cancelled) navigate("/workspace/projects", { replace: true });
      } catch {
        if (!cancelled) navigate("/auth/login", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.spinner} />
        <h2 style={styles.title}>Connexion en cours…</h2>
        <p style={styles.hint}>Maestro vérifie votre session.</p>
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
  title: { margin: "0 0 8px", fontSize: "20px", fontWeight: 600 },
  hint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "14px",
    margin: "12px 0 0",
  },
};
