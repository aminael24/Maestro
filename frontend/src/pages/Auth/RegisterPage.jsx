import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    profilePhoto: null,
  });

  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    const { name, value, files } = e.target;

    if (name === "profilePhoto") {
      const file = files?.[0] || null;
      setForm((prev) => ({ ...prev, profilePhoto: file }));
      setPreview(file ? URL.createObjectURL(file) : "");
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("email", form.email);
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("password", form.password);

      if (form.profilePhoto) {
        formData.append("profilePhoto", form.profilePhoto);
      }

      await registerUser(formData);

      setSuccess("Compte créé avec succès. Redirection vers la connexion...");
      setTimeout(() => navigate("/auth/login"), 1500);
    } catch (err) {
      setError(err.message || "Erreur de création de compte");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.logoCircle}>
              <span style={styles.logoText}>M</span>
            </div>
            <h1 style={styles.title}>Créer un compte</h1>
            <p style={styles.subtitle}>Rejoignez Maestro</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.row}>
              <input
                style={styles.input}
                name="firstName"
                placeholder="Prénom"
                value={form.firstName}
                onChange={handleChange}
                required
              />
              <input
                style={styles.input}
                name="lastName"
                placeholder="Nom"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <input
              style={styles.input}
              name="username"
              placeholder="Nom d'utilisateur"
              value={form.username}
              onChange={handleChange}
              required
            />

            <input
              style={styles.input}
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              style={styles.input}
              type="password"
              name="password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={handleChange}
              required
            />

            <label style={styles.label}>Photo de profil (optionnelle)</label>
            <input
              style={styles.fileInput}
              type="file"
              name="profilePhoto"
              accept="image/*"
              onChange={handleChange}
            />

            {preview && (
              <div style={styles.previewContainer}>
                <img src={preview} alt="Preview" style={styles.previewImage} />
              </div>
            )}

            {error && <p style={styles.error}>{error}</p>}
            {success && <p style={styles.success}>{success}</p>}

            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer le compte"}
            </button>
          </form>

          <Link to="/auth/login" style={styles.link}>
            ← Retour à la connexion
          </Link>
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
  card: {
    width: "100%",
    maxWidth: "480px",
    padding: "36px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#fff",
    backdropFilter: "blur(12px)",
  },
  cardHeader: {
    textAlign: "center",
    marginBottom: "24px",
  },
  logoCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  logoText: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#fff",
  },
  title: {
    margin: "0 0 4px",
    fontSize: "28px",
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "rgba(255,255,255,0.5)",
  },
  form: {
    display: "grid",
    gap: "14px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  input: {
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.15s",
  },
  label: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.5)",
    marginTop: "4px",
  },
  fileInput: {
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: "14px",
  },
  previewContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "4px",
  },
  previewImage: {
    width: "80px",
    height: "80px",
    objectFit: "cover",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.15)",
  },
  button: {
    padding: "14px 18px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "4px",
    boxShadow: "0 4px 20px rgba(124, 58, 237, 0.30)",
  },
  error: {
    color: "#fca5a5",
    margin: 0,
    fontSize: "14px",
  },
  success: {
    color: "#86efac",
    margin: 0,
    fontSize: "14px",
  },
  link: {
    display: "inline-block",
    marginTop: "20px",
    color: "rgba(255,255,255,0.5)",
    textDecoration: "none",
    fontSize: "14px",
    textAlign: "center",
    width: "100%",
  },
};
