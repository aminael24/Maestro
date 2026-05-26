import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../services/authService";
import { redirectToKeycloakLogin } from "../../features/auth/authHelpers";
import logo from "../../assets/logo.png";

/* ═══════════════════════════════════════════
   MAESTRO — Register Page
   Same visual language as the Keycloak login theme
   ═══════════════════════════════════════════ */

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

  function removePhoto() {
    setForm((prev) => ({ ...prev, profilePhoto: null }));
    setPreview("");
    // Reset the file input
    const fileInput = document.getElementById("profilePhoto");
    if (fileInput) fileInput.value = "";
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
      if (form.profilePhoto) formData.append("profilePhoto", form.profilePhoto);
      await registerUser(formData);
     setSuccess("Compte créé avec succès. Redirection vers votre espace...");
navigate("/workspace/dashboard");
    } catch (err) {
      setError(err.message || "Erreur de création de compte");
    } finally {
      setLoading(false);
    }
  }

  /* ── Particle data ── */
  const particles = [
    { w:3,t:"5%",l:"10%",d:0,dur:1.8,c:"gold" },
    { w:2,t:"12%",l:"25%",d:0.2,dur:2.2,c:"aqua" },
    { w:4,t:"8%",l:"55%",d:0.4,dur:1.6,c:"gold" },
    { w:2,t:"15%",l:"78%",d:0.6,dur:2.4,c:"teal" },
    { w:3,t:"20%",l:"5%",d:0.8,dur:1.9,c:"gold" },
    { w:2,t:"25%",l:"40%",d:0.1,dur:2.1,c:"aqua" },
    { w:3,t:"30%",l:"90%",d:0.5,dur:1.7,c:"gold" },
    { w:2,t:"35%",l:"15%",d:1,dur:2.3,c:"teal" },
    { w:4,t:"40%",l:"65%",d:0.3,dur:1.5,c:"aqua" },
    { w:2,t:"45%",l:"85%",d:0.7,dur:2,c:"gold" },
    { w:3,t:"50%",l:"3%",d:1.2,dur:1.8,c:"aqua" },
    { w:2,t:"55%",l:"30%",d:0.2,dur:2.5,c:"gold" },
    { w:3,t:"58%",l:"70%",d:0.9,dur:1.6,c:"teal" },
    { w:2,t:"65%",l:"50%",d:0.5,dur:2.2,c:"aqua" },
    { w:4,t:"70%",l:"8%",d:0.3,dur:1.4,c:"gold" },
    { w:2,t:"75%",l:"92%",d:1.1,dur:2,c:"aqua" },
    { w:3,t:"80%",l:"22%",d:0.6,dur:1.7,c:"gold" },
    { w:2,t:"82%",l:"60%",d:1.3,dur:2.3,c:"teal" },
    { w:3,t:"88%",l:"45%",d:0.1,dur:1.9,c:"gold" },
    { w:2,t:"92%",l:"75%",d:0.8,dur:2.1,c:"aqua" },
    { w:3,t:"3%",l:"42%",d:0.4,dur:1.5,c:"gold" },
    { w:2,t:"18%",l:"62%",d:1.4,dur:2.4,c:"aqua" },
    { w:4,t:"28%",l:"52%",d:0.2,dur:1.3,c:"teal" },
    { w:2,t:"48%",l:"18%",d:0.9,dur:2,c:"gold" },
    { w:3,t:"62%",l:"88%",d:0.5,dur:1.8,c:"aqua" },
    { w:2,t:"73%",l:"38%",d:1.5,dur:2.2,c:"gold" },
    { w:3,t:"95%",l:"12%",d:0.1,dur:1.6,c:"teal" },
    { w:2,t:"38%",l:"2%",d:1,dur:2.5,c:"aqua" },
    { w:3,t:"52%",l:"95%",d:0.7,dur:1.4,c:"gold" },
    { w:2,t:"85%",l:"82%",d:0,dur:2.1,c:"aqua" },
  ];

  const particleColor = {
    gold: { bg: "#A58D66", shadow: "0 0 6px #A58D66, 0 0 12px rgba(165,141,102,0.3)" },
    aqua: { bg: "#C0D5D6", shadow: "0 0 6px #C0D5D6, 0 0 12px rgba(192,213,214,0.3)" },
    teal: { bg: "#407E8C", shadow: "0 0 4px #407E8C" },
  };

  const connectionLines = [
    [150,200,350,350],[350,350,200,520],[200,520,120,700],
    [1600,120,1400,280],[1400,280,1550,450],[300,150,500,300],
    [1650,400,1500,600],[180,680,400,800],[1300,700,1550,850],[400,800,650,880],
  ];

  /* ── Icon helpers ── */
  const EmailIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#C0D5D6" }}>
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
  const LockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#C0D5D6" }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
  const UserIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#C0D5D6" }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
  const CameraIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#C0D5D6" }}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
    </svg>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');

        .maestro-register * { margin: 0; padding: 0; box-sizing: border-box; }

        .maestro-register {
          --navy: #083A4F;
          --gold: #A58D66;
          --aqua: #C0D5D6;
          --teal: #407E8C;
          --sand: #E5E1DD;
          --navy-90: rgba(8,58,79,0.9);
          --gold-50: rgba(165,141,102,0.5);
          --teal-70: rgba(64,126,140,0.7);
          --aqua-40: rgba(192,213,214,0.4);

          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow-x: hidden;
          background: var(--navy);
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 0;
        }

        /* ── Background ── */
        .mr-bg {
          position: fixed; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(64,126,140,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(165,141,102,0.1) 0%, transparent 50%),
            radial-gradient(circle at center, #0a4560 0%, #051e2b 100%);
        }
        .mr-grid {
          position: fixed; inset: 0; z-index: 1;
          pointer-events: none; opacity: 0.04;
          background-image:
            linear-gradient(var(--aqua) 1px, transparent 1px),
            linear-gradient(90deg, var(--aqua) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .mr-scanline {
          position: fixed; inset: 0; z-index: 2; pointer-events: none;
          background: repeating-linear-gradient(
            transparent 0px, transparent 2px,
            rgba(192,213,214,0.012) 2px, rgba(192,213,214,0.012) 4px
          );
        }

        /* ── Orbs ── */
        .mr-orb {
          position: fixed; border-radius: 50%;
          filter: blur(80px); z-index: 1;
          pointer-events: none; mix-blend-mode: screen;
        }
        .mr-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, var(--teal-70), transparent 70%);
          top: -10%; right: -5%;
          animation: mr-orbFloat1 8s ease-in-out infinite;
        }
        .mr-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, var(--gold-50), transparent 70%);
          bottom: -10%; left: -5%;
          animation: mr-orbFloat2 10s ease-in-out infinite;
        }
        .mr-orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, var(--aqua-40), transparent 70%);
          top: 40%; left: 30%;
          animation: mr-orbFloat3 7s ease-in-out infinite;
        }
        @keyframes mr-orbFloat1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,20px)} }
        @keyframes mr-orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-30px)} }
        @keyframes mr-orbFloat3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,-15px)} }

        /* ── Particles ── */
        .mr-particles { position: fixed; inset: 0; z-index: 3; pointer-events: none; overflow: hidden; }
        .mr-particle {
          position: absolute; border-radius: 50%;
          animation: mr-particlePulse 2s ease-in-out infinite;
        }
        @keyframes mr-particlePulse {
          0%,100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.5); }
        }

        /* ── Connection Lines ── */
        .mr-lines { position: fixed; inset: 0; z-index: 2; pointer-events: none; }
        .mr-lines svg { width: 100%; height: 100%; }
        .mr-lines line { stroke: var(--aqua); stroke-width: 0.5; opacity: 0.04; }

        /* ── Back link ── */
        .mr-back {
          position: fixed; top: 24px; left: 28px; z-index: 50;
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--aqua); text-decoration: none;
          font-size: 13px; font-weight: 500; letter-spacing: 0.3px;
          opacity: 0.55; transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .mr-back:hover { opacity: 0.9; transform: translateX(-3px); }

        /* ── Card ── */
        .mr-container { position: relative; z-index: 10; width: 460px; max-width: 92vw; }
        .mr-card {
          background: linear-gradient(145deg, rgba(8,58,79,0.85), rgba(8,58,79,0.65));
          backdrop-filter: blur(30px) saturate(1.3);
          -webkit-backdrop-filter: blur(30px) saturate(1.3);
          border: 1px solid rgba(192,213,214,0.12);
          border-radius: 20px;
          padding: 40px 38px;
          box-shadow:
            0 0 0 1px rgba(192,213,214,0.05),
            0 20px 60px rgba(0,0,0,0.4),
            0 0 120px rgba(64,126,140,0.08);
          animation: mr-cardAppear 0.6s ease-out;
        }
        @keyframes mr-cardAppear {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Brand ── */
        .mr-brand { text-align: center; margin-bottom: 10px; }
        .mr-brand-icon {
          width: 240px; height: auto; margin: 0 auto -25px;
        }
        .mr-brand-icon img {
          width: 100%; height: 100%; object-fit: contain;
          filter: drop-shadow(0 0 20px rgba(64,126,140,0.3));
        }
        .mr-brand h1 {
          font-family: 'Space Mono', monospace;
          font-size: 18px; font-weight: 700;
          color: var(--sand); letter-spacing: 4px;
          text-transform: uppercase; margin-bottom: 6px;
        }
        .mr-brand p {
          font-size: 12px; color: var(--aqua);
          letter-spacing: 2px; text-transform: uppercase; opacity: 0.6;
        }

        /* ── Tabs ── */
        .mr-tabs {
          display: flex; gap: 0; margin-bottom: 28px;
          background: rgba(0,0,0,0.2); border-radius: 10px; padding: 4px;
        }
        .mr-tab {
          flex: 1; padding: 10px; border: none;
          background: transparent; color: var(--aqua);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          letter-spacing: 0.5px; border-radius: 8px;
          text-align: center; text-decoration: none;
          opacity: 0.5; cursor: pointer;
          transition: all 0.3s ease;
        }
        .mr-tab:hover:not(.mr-tab-active) { opacity: 0.7; }
        .mr-tab-active {
          background: var(--teal); color: var(--sand);
          opacity: 1; box-shadow: 0 4px 15px rgba(64,126,140,0.3);
        }

        /* ── Form ── */
        .mr-form-group { margin-bottom: 16px; }
        .mr-form-group label {
          display: block; font-size: 11px; font-weight: 500;
          color: var(--aqua); letter-spacing: 1.5px;
          text-transform: uppercase; margin-bottom: 8px; opacity: 0.7;
        }
        .mr-form-row { display: flex; gap: 14px; }
        .mr-form-half { flex: 1; min-width: 0; }
        .mr-input-wrap { position: relative; }
        .mr-input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%); opacity: 0.5;
          font-size: 14px; line-height: 1; display: flex;
        }
        .mr-input-wrap input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(192,213,214,0.1);
          border-radius: 10px;
          color: var(--sand);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; outline: none;
          transition: all 0.3s ease;
        }
        .mr-input-wrap input::placeholder { color: rgba(192,213,214,0.3); }
        .mr-input-wrap input:focus {
          border-color: var(--teal);
          background: rgba(0,0,0,0.35);
          box-shadow: 0 0 0 3px rgba(64,126,140,0.15);
        }

        /* ── Photo upload ── */
        .mr-photo-upload {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 16px;
        }
        .mr-photo-preview {
          width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
          border: 2px dashed rgba(192,213,214,0.2);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; background: rgba(0,0,0,0.2);
          transition: border-color 0.3s;
        }
        .mr-photo-preview:hover { border-color: var(--teal); }
        .mr-photo-preview img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .mr-photo-preview-wrap {
          position: relative; flex-shrink: 0;
        }
        .mr-photo-remove {
          position: absolute; top: -6px; right: -6px;
          width: 22px; height: 22px; border-radius: 50%;
          background: rgba(239,68,68,0.85);
          border: 2px solid rgba(8,58,79,0.8);
          color: #fff; font-size: 14px; line-height: 1;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; padding: 0;
          transition: background 0.2s, transform 0.2s;
          z-index: 2;
        }
        .mr-photo-remove:hover {
          background: rgba(239,68,68,1);
          transform: scale(1.15);
        }
        .mr-photo-label {
          cursor: pointer; display: flex; flex-direction: column; gap: 4px;
        }
        .mr-photo-label span:first-child {
          font-size: 13px; color: var(--aqua); opacity: 0.7;
          font-weight: 500;
        }
        .mr-photo-label span:last-child {
          font-size: 11px; color: var(--aqua); opacity: 0.4;
        }
        .mr-photo-label:hover span:first-child { opacity: 1; }
        .mr-file-hidden { display: none; }

        /* ── Alerts ── */
        .mr-alert {
          margin-bottom: 16px; padding: 12px 14px;
          border-radius: 10px; font-size: 14px;
        }
        .mr-alert-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.30);
          color: #fca5a5;
        }
        .mr-alert-success {
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.30);
          color: #86efac;
        }

        /* ── Submit ── */
        .mr-submit {
          width: 100%; padding: 14px; border: none; border-radius: 10px;
          background: linear-gradient(135deg, var(--teal), #2a6a78);
          color: var(--sand);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600;
          letter-spacing: 1px; text-transform: uppercase;
          cursor: pointer; margin-top: 6px;
          transition: all 0.3s ease;
          position: relative; overflow: hidden;
        }
        .mr-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #4a929f, var(--teal));
          box-shadow: 0 8px 25px rgba(64,126,140,0.35);
          transform: translateY(-1px);
        }
        .mr-submit:active { transform: translateY(0); }
        .mr-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Footer ── */
        .mr-footer {
          text-align: center; margin-top: 18px;
          font-size: 13px; color: var(--aqua); opacity: 0.5;
        }
        .mr-footer a {
          color: var(--gold); text-decoration: none;
          font-weight: 500; transition: opacity 0.2s;
        }
        .mr-footer a:hover { opacity: 0.8; }

        /* ── Responsive ── */
        @media (max-width: 520px) {
          .mr-card { padding: 28px 18px; }
          .mr-container { width: 94vw; }
          .mr-form-row { flex-direction: column; gap: 0; }
          .mr-back { top: 14px; left: 16px; font-size: 12px; }
        }
      `}</style>

      <div className="maestro-register">
        {/* ── Background layers ── */}
        <div className="mr-bg" />
        <div className="mr-grid" />
        <div className="mr-scanline" />

        {/* ── Orbs ── */}
        <div className="mr-orb mr-orb-1" />
        <div className="mr-orb mr-orb-2" />
        <div className="mr-orb mr-orb-3" />

        {/* ── Particles ── */}
        <div className="mr-particles">
          {particles.map((p, i) => (
            <span
              key={i}
              className="mr-particle"
              style={{
                width: p.w, height: p.w,
                top: p.t, left: p.l,
                animationDelay: `${p.d}s`,
                animationDuration: `${p.dur}s`,
                background: particleColor[p.c].bg,
                boxShadow: particleColor[p.c].shadow,
              }}
            />
          ))}
        </div>

        {/* ── Connection Lines ── */}
        <div className="mr-lines">
          <svg viewBox="0 0 1920 1080" preserveAspectRatio="none">
            {connectionLines.map(([x1,y1,x2,y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
            ))}
          </svg>
        </div>

        {/* ── Back link ── */}
        <Link to="/" className="mr-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Retour à l'accueil
        </Link>

        {/* ── Card ── */}
        <div className="mr-container">
          <div className="mr-card">
            {/* Brand */}
            <div className="mr-brand">
              <div className="mr-brand-icon">
                <img src={logo} alt="Maestro logo" />
              </div>
              <h1>Maestro</h1>
              <p>DevSecOps</p>
            </div>

            {/* Tabs */}
            <div className="mr-tabs">
              <button type="button" className="mr-tab" onClick={() => redirectToKeycloakLogin()}>Connexion</button>
              <button type="button" className="mr-tab mr-tab-active">Créer un compte</button>
            </div>

            {/* Alerts */}
            {error && <div className="mr-alert mr-alert-error">{error}</div>}
            {success && <div className="mr-alert mr-alert-success">{success}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* First + Last name */}
              <div className="mr-form-row">
                <div className="mr-form-group mr-form-half">
                  <label htmlFor="firstName">Prénom</label>
                  <div className="mr-input-wrap">
                    <span className="mr-input-icon"><UserIcon /></span>
                    <input
                      id="firstName"
                      name="firstName"
                      placeholder="Ahmed"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="mr-form-group mr-form-half">
                  <label htmlFor="lastName">Nom</label>
                  <div className="mr-input-wrap">
                    <span className="mr-input-icon"><UserIcon /></span>
                    <input
                      id="lastName"
                      name="lastName"
                      placeholder="El Fassi"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="mr-form-group">
                <label htmlFor="username">Nom d'utilisateur</label>
                <div className="mr-input-wrap">
                  <span className="mr-input-icon"><UserIcon /></span>
                  <input
                    id="username"
                    name="username"
                    placeholder="ahmedelfassi"
                    value={form.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mr-form-group">
                <label htmlFor="email">Email</label>
                <div className="mr-input-wrap">
                  <span className="mr-input-icon"><EmailIcon /></span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ingenieur@devsecops.ma"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mr-form-group">
                <label htmlFor="password">Mot de passe</label>
                <div className="mr-input-wrap">
                  <span className="mr-input-icon"><LockIcon /></span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Profile photo */}
              <div className="mr-photo-upload">
                <div className="mr-photo-preview-wrap">
                  <div className="mr-photo-preview">
                    {preview ? (
                      <img src={preview} alt="Preview" />
                    ) : (
                      <CameraIcon />
                    )}
                  </div>
                  {preview && (
                    <button
                      type="button"
                      className="mr-photo-remove"
                      onClick={removePhoto}
                      aria-label="Supprimer la photo"
                    >
                      ×
                    </button>
                  )}
                </div>
                <label className="mr-photo-label" htmlFor="profilePhoto">
                  <span>Photo de profil</span>
                  <span>Optionnelle · JPG, PNG</span>
                </label>
                <input
                  className="mr-file-hidden"
                  type="file"
                  id="profilePhoto"
                  name="profilePhoto"
                  accept="image/*"
                  onChange={handleChange}
                />
              </div>

              {/* Submit */}
              <button className="mr-submit" type="submit" disabled={loading}>
                {loading ? "Création en cours..." : "Créer le compte"}
              </button>
            </form>

            {/* Footer */}
            <div className="mr-footer">
              Déjà un compte ?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); redirectToKeycloakLogin(); }}>
                Se connecter
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
