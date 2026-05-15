import { useEffect, useState } from "react";
import { redirectToGatewayLogin } from "../../services/authService";
import FeaturesSection from "../../components/landing/FeaturesSection";
import TestimonialsSection from "../../components/landing/TestimonialsSection";
import MeshGradientBackground from "../../components/landing/MeshGradientBackground";
import Aboutsection from "../../components/landing/Aboutsection";
import ContactUs from "../../components/landing/ContactUs";
import SocialDock from "../../components/landing/MaestroFooter";
import FlowingMenu from "../../components/landing/FlowingMenu";
import TeamSection from "../../components/landing/TeamSection";
import CTABanner from "../../components/landing/CTABanner";
import logoImg from "../../assets/logo.png"; // ← ajustez le nom/extension selon votre fichier

import "./LandingPage.css";

/* ─── Styles injectés ────────────────────────────────────────────────────── */
const INJECTED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  :root {
    --m-navy:  #083A4F;
    --m-gold:  #A58D66;
    --m-gold2: #c4aa80;
    --m-teal:  #407E8C;
    --m-aqua:  #C0D5D6;
    --m-dark:  #041e2a;
  }

  /* ══ RESET des anciens styles hero qui créaient le doublon ══ */
  .hero-section,
  .hero-inner,
  .hero-right,
  .mockup-shell,
  .mockup-stats {
    display: none !important;
  }

  /* ══ NAVBAR ══ */
  .m-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 200;
    height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2.5rem;
    transition: background 0.35s ease, box-shadow 0.35s ease;
  }
  .m-nav.scrolled {
    background: rgba(4,30,42,0.97);
    box-shadow: 0 1px 0 rgba(192,213,214,0.12), 0 8px 32px rgba(0,0,0,0.4);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .m-nav.top {
    background: rgba(8,58,79,0.55);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .m-logo {
    display: flex; align-items: center; gap: 0; margin-left: -4px;
    text-decoration: none; flex-shrink: 0;
  }
  .m-logo-icon { animation: logoPulse 4s ease-in-out infinite; }
  @keyframes logoPulse {
    0%,100% { filter: drop-shadow(0 0 6px rgba(165,141,102,0.55)); }
    50%     { filter: drop-shadow(0 0 16px rgba(165,141,102,1)); }
  }
  .m-logo-text {
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 1.35rem; letter-spacing: 0.06em;
    background: linear-gradient(135deg, #C0D5D6 0%, #A58D66 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  .m-nav-links {
    display: flex; align-items: center; gap: 0.1rem;
    list-style: none; margin: 0; padding: 0;
  }
  .m-nav-btn {
    background: none; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.865rem; font-weight: 400;
    color: rgba(192,213,214,0.8);
    padding: 0.42rem 0.85rem; border-radius: 6px;
    position: relative; transition: color 0.2s; overflow: hidden;
  }
  .m-nav-btn::after {
    content: ''; position: absolute;
    bottom: 4px; left: 50%;
    width: 0; height: 1.5px;
    background: var(--m-gold); border-radius: 2px;
    transform: translateX(-50%); transition: width 0.25s ease;
  }
  .m-nav-btn:hover { color: #fff; }
  .m-nav-btn:hover::after { width: 55%; }

  .m-nav-ctas { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }

  .m-btn-register {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.865rem; font-weight: 500;
    color: var(--m-aqua); background: transparent;
    border: 1px solid rgba(192,213,214,0.3); border-radius: 8px;
    padding: 0.44rem 1.1rem; cursor: pointer;
    transition: border-color 0.25s, color 0.25s, background 0.25s, transform 0.15s;
  }
  .m-btn-register:hover {
    border-color: var(--m-aqua); background: rgba(192,213,214,0.08);
    transform: translateY(-1px);
  }
  .m-btn-register:active { transform: scale(0.97); }

  .m-btn-login {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.865rem; font-weight: 500;
    color: #fff; background: linear-gradient(135deg, #A58D66, #8f7a56);
    border: none; border-radius: 8px; padding: 0.46rem 1.2rem;
    cursor: pointer; position: relative; overflow: hidden;
    transition: transform 0.15s, box-shadow 0.25s;
    box-shadow: 0 2px 12px rgba(165,141,102,0.3);
  }
  .m-btn-login::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.25s;
  }
  .m-btn-login:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(165,141,102,0.5); }
  .m-btn-login:hover::before { opacity: 1; }
  .m-btn-login:active { transform: scale(0.97); }
  .m-btn-login:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  /* ══ HERO ══ */
  .m-hero {
    min-height: 100vh;
    display: flex; align-items: center;
    position: relative; z-index: 10;
    padding: 100px 2.5rem 60px;
    overflow: hidden;
  }
  .m-hero-grid {
    max-width: 1200px; margin: 0 auto; width: 100%;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 4rem; align-items: center;
  }

  .m-orb {
    position: absolute; border-radius: 50%;
    filter: blur(80px); pointer-events: none;
    animation: orbDrift 12s ease-in-out infinite;
  }
  .m-orb-1 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(64,126,140,0.25) 0%, transparent 70%);
    top: -80px; right: -80px;
  }
  .m-orb-2 {
    width: 350px; height: 350px;
    background: radial-gradient(circle, rgba(165,141,102,0.18) 0%, transparent 70%);
    bottom: 0; left: 8%; animation-delay: -6s;
  }
  @keyframes orbDrift {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(28px,-18px) scale(1.04); }
    66%     { transform: translate(-18px,22px) scale(0.97); }
  }

  .m-grid-overlay {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(192,213,214,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(192,213,214,0.04) 1px, transparent 1px);
    background-size: 60px 60px; pointer-events: none;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
  }

  .m-hero-left {
    opacity: 0; transform: translateY(28px);
    animation: mFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s forwards;
  }
  @keyframes mFadeUp { to { opacity: 1; transform: translateY(0); } }

  .m-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(64,126,140,0.15);
    border: 1px solid rgba(64,126,140,0.4);
    border-radius: 100px; padding: 6px 14px 6px 8px; margin-bottom: 2rem;
  }
  .m-badge-dot {
    width: 8px; height: 8px; background: #4ade80;
    border-radius: 50%; box-shadow: 0 0 8px #4ade80;
    animation: mBlink 2s ease-in-out infinite;
  }
  @keyframes mBlink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  .m-badge-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.76rem; font-weight: 500; color: var(--m-aqua);
    letter-spacing: 0.06em; text-transform: uppercase;
  }

  .m-hero-title { font-family: 'Syne', sans-serif; line-height: 1.05; margin: 0 0 1.5rem; }
  .m-hero-title .t-light {
    display: block; font-size: clamp(2.6rem,4.5vw,3.8rem);
    font-weight: 400; color: rgba(192,213,214,0.7); letter-spacing: -0.01em;
  }
  .m-hero-title .t-bold {
    display: block; font-size: clamp(3.2rem,6.5vw,5.2rem);
    font-weight: 800; color: #fff; letter-spacing: -0.03em;
    text-shadow: 0 0 60px rgba(165,141,102,0.3);
  }
  .m-hero-title .t-italic {
    display: block; font-size: clamp(2rem,3.8vw,3rem);
    font-weight: 400; font-style: italic;
    background: linear-gradient(135deg, #c4aa80 0%, #407E8C 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  .m-hero-desc {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.03rem; font-weight: 300;
    color: rgba(192,213,214,0.62); line-height: 1.72;
    max-width: 470px; margin-bottom: 2.4rem;
  }

  .m-hero-actions { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }

  .m-hero-cta-primary {
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem; font-weight: 500; color: var(--m-dark);
    background: linear-gradient(135deg, #c4aa80, #A58D66);
    border: none; border-radius: 10px; padding: 0.75rem 1.75rem;
    cursor: pointer; position: relative; overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(165,141,102,0.4);
  }
  .m-hero-cta-primary::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
    opacity: 0; transition: opacity 0.2s;
  }
  .m-hero-cta-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(165,141,102,0.55); }
  .m-hero-cta-primary:hover::after { opacity: 1; }
  .m-hero-cta-primary:active { transform: scale(0.97); }

  .m-hero-cta-secondary {
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem; font-weight: 400; color: var(--m-aqua);
    background: transparent; border: 1px solid rgba(192,213,214,0.28);
    border-radius: 10px; padding: 0.75rem 1.75rem; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
  }
  .m-hero-cta-secondary:hover {
    border-color: rgba(192,213,214,0.65);
    background: rgba(192,213,214,0.06); transform: translateY(-2px);
  }
  .m-hero-cta-secondary:active { transform: scale(0.97); }
  .m-arrow { display: inline-block; transition: transform 0.2s; }
  .m-hero-cta-secondary:hover .m-arrow { transform: translateX(4px); }

  .m-hero-stats {
    display: flex; gap: 2rem;
    margin-top: 2.4rem; padding-top: 1.8rem;
    border-top: 1px solid rgba(192,213,214,0.1);
    opacity: 0;
    animation: mFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.45s forwards;
  }
  .m-stat-val {
    font-family: 'Syne', sans-serif;
    font-size: 1.55rem; font-weight: 700; color: #fff; letter-spacing: -0.02em;
  }
  .m-stat-val span { color: var(--m-gold2); }
  .m-stat-label {
    font-family: 'DM Sans', sans-serif; font-size: 0.75rem;
    color: rgba(192,213,214,0.45); margin-top: 2px;
    text-transform: uppercase; letter-spacing: 0.06em;
  }

  .m-hero-right {
    opacity: 0; transform: translateX(28px) translateY(8px);
    animation: mFadeRight 1s cubic-bezier(0.16,1,0.3,1) 0.3s forwards;
  }
  @keyframes mFadeRight { to { opacity:1; transform: translateX(0) translateY(0); } }

  /* ══ MOCKUP ══ */
  .m-mockup {
    background: rgba(8,58,79,0.5);
    border: 1px solid rgba(192,213,214,0.14);
    border-radius: 16px; overflow: hidden;
    backdrop-filter: blur(12px);
    box-shadow:
      0 0 0 1px rgba(192,213,214,0.07),
      0 40px 80px rgba(0,0,0,0.4),
      0 0 60px rgba(64,126,140,0.12) inset;
    animation: mFloat 6s ease-in-out infinite;
  }
  @keyframes mFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

  .m-mockup-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 18px; border-bottom: 1px solid rgba(192,213,214,0.09);
    background: rgba(4,30,42,0.4);
  }
  .m-mockup-dots { display: flex; gap: 6px; }
  .m-mockup-dots span { width: 12px; height: 12px; border-radius: 50%; }
  .d-r { background: #ff5f57; } .d-y { background: #ffbd2e; } .d-g { background: #28c840; }
  .m-mockup-path {
    font-family: 'DM Sans', monospace; font-size: 0.76rem;
    color: rgba(192,213,214,0.5); letter-spacing: 0.03em;
  }
  .m-live-badge {
    font-size: 0.7rem; font-weight: 500; color: #4ade80;
    background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.28);
    border-radius: 100px; padding: 3px 10px;
    display: flex; align-items: center; gap: 5px;
    font-family: 'DM Sans', sans-serif;
  }
  .m-live-dot {
    width: 6px; height: 6px; background: #4ade80; border-radius: 50%;
    animation: mBlink 1.5s ease-in-out infinite;
  }

  .m-pipeline {
    padding: 20px 20px 10px; display: flex; align-items: center; position: relative;
  }
  .m-pipe-step {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    flex: 1; position: relative;
  }
  .m-pipe-step:not(:last-child)::after {
    content: ''; position: absolute;
    top: 17px; left: 50%; width: 100%; height: 2px;
    background: rgba(192,213,214,0.13);
  }
  .m-pipe-step.done::after  { background: rgba(74,222,128,0.45); }
  .m-pipe-step.active::after { background: rgba(165,141,102,0.45); }
  .m-pipe-node {
    width: 34px; height: 34px; border-radius: 50%;
    border: 2px solid rgba(192,213,214,0.18);
    background: rgba(8,58,79,0.8);
    display: flex; align-items: center; justify-content: center;
    position: relative; z-index: 1; font-size: 13px;
  }
  .m-pipe-step.done .m-pipe-node   { border-color: rgba(74,222,128,0.65);  background: rgba(74,222,128,0.13);   color: #4ade80; }
  .m-pipe-step.active .m-pipe-node {
    border-color: var(--m-gold); background: rgba(165,141,102,0.18); color: var(--m-gold2);
    animation: mNodePulse 2s ease-in-out infinite;
  }
  @keyframes mNodePulse {
    0%,100% { box-shadow: 0 0 8px rgba(165,141,102,0.4); }
    50%     { box-shadow: 0 0 22px rgba(165,141,102,0.75); }
  }
  .m-pipe-label { font-family: 'DM Sans', sans-serif; font-size: 0.7rem; color: rgba(192,213,214,0.45); }
  .m-pipe-step.active .m-pipe-label { color: var(--m-gold2); font-weight: 500; }
  .m-pipe-step.done .m-pipe-label   { color: rgba(74,222,128,0.75); }

  .m-progress-section {
    padding: 10px 20px 16px; border-bottom: 1px solid rgba(192,213,214,0.07);
  }
  .m-progress-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .m-progress-title  { font-family: 'DM Sans', sans-serif; font-size: 0.8rem; color: rgba(192,213,214,0.65); }
  .m-progress-pct    { font-family: 'Syne', sans-serif; font-size: 0.84rem; font-weight: 600; color: var(--m-gold2); }
  .m-progress-bar-bg { height: 6px; background: rgba(192,213,214,0.09); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
  .m-progress-bar-fill {
    height: 100%; width: 68%;
    background: linear-gradient(90deg, var(--m-teal), var(--m-gold2));
    border-radius: 3px;
    animation: mProgressAnim 2s ease-out 1s both;
  }
  @keyframes mProgressAnim { from { width: 0; } to { width: 68%; } }
  .m-progress-commit { display: flex; justify-content: space-between; font-size: 0.7rem; color: rgba(192,213,214,0.32); font-family: 'DM Sans', monospace; }
  .m-threat { color: #f87171; }

  .m-terminal {
    margin: 0 14px 14px;
    background: rgba(4,30,42,0.7);
    border: 1px solid rgba(192,213,214,0.07);
    border-radius: 10px; padding: 14px;
    font-family: 'Courier New', monospace; font-size: 0.77rem; line-height: 1.8;
  }
  .t-ok   { color: #4ade80; }
  .t-warn { color: #fbbf24; }
  .t-run  { color: rgba(192,213,214,0.45); }
  .t-cursor {
    display: inline-block; width: 8px; height: 13px;
    background: var(--m-gold2); vertical-align: middle;
    animation: mCursor 1s step-end infinite;
  }
  @keyframes mCursor { 0%,100% { opacity:1; } 50% { opacity:0; } }

  .m-mockup-footer { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid rgba(192,213,214,0.07); }
  .m-mockup-stat   { padding: 14px; text-align: center; border-right: 1px solid rgba(192,213,214,0.07); }
  .m-mockup-stat:last-child { border-right: none; }
  .m-mockup-stat-val { font-family: 'Syne', sans-serif; font-size: 1.18rem; font-weight: 700; }
  .mv-green { color: #4ade80; } .mv-teal { color: var(--m-aqua); } .mv-gold { color: var(--m-gold2); }
  .m-mockup-stat-lbl {
    font-family: 'DM Sans', sans-serif; font-size: 0.66rem;
    color: rgba(192,213,214,0.38); text-transform: uppercase;
    letter-spacing: 0.06em; margin-top: 2px;
  }
`;

/* ─── Items FlowingMenu ──────────────────────────────────────────────────── */
const flowingMenuItems = [
  {
    link: "#about",
    text: "Prompt to Deploy",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop",
  },
  {
    link: "#features",
    text: "Groq · LLaMA 3.1",
    image:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=400&fit=crop",
  },
  {
    link: "#features",
    text: "Docker in Docker",
    image:
      "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&h=400&fit=crop",
  },
  {
    link: "#sentinel",
    text: "Keycloak · OIDC",
    image:
      "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&h=400&fit=crop",
  },
  {
    link: "#features",
    text: "Kafka · Microservices",
    image:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop",
  },
];

/* ─── Logo SVG hexagonal ────────────────────────────────────────────────── */
function MaestroLogo({ size = 120 }) {
  return (
    <img
      src={logoImg}
      alt="Maestro logo"
      className="m-logo-icon"
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [loggingIn, setLoggingIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* Injection des styles globaux */
  useEffect(() => {
    const id = "maestro-global-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = INJECTED_STYLES;
      document.head.appendChild(s);
    }
    return () => document.getElementById(id)?.remove();
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleLogin = (e) => {
    e?.preventDefault();
    setLoggingIn(true);
    redirectToGatewayLogin();
  };

  const handleRegister = (e) => {
    e?.preventDefault();
    redirectToGatewayLogin(); // TODO: remplacer par la route d'inscription
  };

  const goTo = (id) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  const navLinks = [
    { label: "À propos", id: "about" },
    { label: "Fonctionnalités", id: "features" },
    { label: "Avis clients", id: "testimonials" },
    { label: "Équipe", id: "team" },
    { label: "Contact", id: "contact" },
    { label: "Footer", id: "footer" },
  ];

  return (
    <div className="maestro-landing">
      <MeshGradientBackground />

      {/* ══ NAVBAR ════════════════════════════════════════ */}
      <nav className={`m-nav ${scrolled ? "scrolled" : "top"}`}>
        <a href="/" className="m-logo">
          <MaestroLogo size={120} />
          <span className="m-logo-text">Maestro</span>
        </a>

        <ul className="m-nav-links">
          {navLinks.map(({ label, id }) => (
            <li key={id}>
              <button className="m-nav-btn" onClick={() => goTo(id)}>
                {label}
              </button>
            </li>
          ))}
        </ul>

        <div className="m-nav-ctas">
          <button className="m-btn-register" onClick={handleRegister}>
            Créer un compte
          </button>
          <button
            className="m-btn-login"
            onClick={handleLogin}
            disabled={loggingIn}
          >
            {loggingIn ? "Redirection…" : "Se connecter"}
          </button>
        </div>
      </nav>

      {/* ══ SECTIONS ══════════════════════════════════════ */}
      <div id="about">
        <Aboutsection />
      </div>
      <div id="features">
        <FeaturesSection />
      </div>

      <div style={{ height: "600px", position: "relative" }}>
        <FlowingMenu
          items={flowingMenuItems}
          speed={18}
          textColor="#083A4F"
          bgColor="#E5E1DD"
          marqueeBgColor="#A58D66"
          marqueeTextColor="#ffffff"
          borderColor="#407E8C"
        />
      </div>

      <div id="team">
        <TeamSection />
      </div>
      <div id="testimonials">
        <TestimonialsSection />
      </div>
      <CTABanner onLogin={handleLogin} onRegister={handleRegister} />
      <div id="contact">
        <ContactUs />
      </div>
      <div id="footer">
        <SocialDock />
      </div>
    </div>
  );
}
