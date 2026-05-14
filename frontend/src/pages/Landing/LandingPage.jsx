// src/pages/landing/LandingPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { redirectToGatewayLogin } from "../../services/authService";
import FeaturesSection from "../../components/landing/FeaturesSection";
import TestimonialsSection from "../../components/landing/TestimonialsSection";
import MeshGradientBackground from "../../components/landing/MeshGradientBackground";
import Aboutsection from "../../components/landing/Aboutsection";
import ContactUs from "../../components/landing/ContactUs";
import SocialDock from "../../components/landing/MaestroFooter"; // ← import
import "./LandingPage.css";

export default function LandingPage() {
  const [revealed, setRevealed] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [activeLogLine, setActiveLogLine] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogLine((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  function handleLogin(e) {
    e?.preventDefault();
    setLoggingIn(true);
    redirectToGatewayLogin();
  }

  return (
    // ⚠️  Assure-toi que .maestro-landing a bien :
    //     position: relative; overflow: hidden;  dans LandingPage.css
    <div className="maestro-landing">
      {/* ── MESH GRADIENT ── remplace les .orb du hero ─────────────────── */}
      <MeshGradientBackground />

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav
        className="animated-nav"
        style={{ position: "relative", zIndex: 20 }}
      >
        <a href="/" className="nav-brand">
          Maestro
        </a>
        <ul className="nav-links">
          <li>
            <a href="#features">Fonctionnalités</a>
          </li>
          <li>
            <a href="#sentinel">Sécurité</a>
          </li>
          <li>
            <a href="#cta">Commencer</a>
          </li>
        </ul>
        <button className="nav-cta" onClick={handleLogin} disabled={loggingIn}>
          {loggingIn ? "Redirection…" : "Se connecter"}
        </button>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section
        className="hero-section"
        style={{ position: "relative", zIndex: 10 }}
      >
        {/*
          Les anciens .orb sont supprimés — le MeshGradientBackground
          les remplace avec les blobs animés palette Navy/Gold/Aqua/Teal/Sand.
        */}

        <div className={`hero-inner ${revealed ? "hero-in" : ""}`}>
          {/* Left */}
          <div className={`hero-left ${revealed ? "reveal-left" : ""}`}>
            <span className="hero-eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              Plateforme DevSecOps
            </span>

            <h1 className="hero-headline">
              Orchestrez vos projets <em>en toute sérénité.</em>
            </h1>

            <p className="hero-body">
              Maestro automatise vos pipelines CI/CD, sécurise vos déploiements
              et pilote l'ensemble de votre workflow DevOps depuis un workspace
              unique.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleLogin}
                disabled={loggingIn}
              >
                {loggingIn ? "Redirection…" : "Se connecter"}
              </button>
              <Link to="/auth/register" className="btn-text">
                Créer un compte →
              </Link>
            </div>

            <div className="trust-row">
              <span className="trust-badge">🔒 OIDC + Keycloak</span>
              <span className="trust-badge">🍪 Cookies HttpOnly</span>
              <span className="trust-badge">⚡ CI/CD intégré</span>
            </div>
          </div>

          {/* Right – mockup */}
          <div className={`hero-right ${revealed ? "reveal-right" : ""}`}>
            <div className="mockup-shell">
              <div className="mockup-titlebar">
                <div className="mockup-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="mockup-title-text">
                  maestro › pipeline › production
                </span>
                <span className="mockup-badge live">● LIVE</span>
              </div>

              <div className="pipeline-track">
                <div className="pipeline-step-wrap">
                  <span className="pipeline-node done">
                    <span className="empty-dot" />
                  </span>
                  <span className="pipeline-label">build</span>
                </div>
                <span className="pipeline-connector">
                  <span className="connector-fill fill-done" />
                </span>
                <div className="pipeline-step-wrap">
                  <span className="pipeline-node done">
                    <span className="empty-dot" />
                  </span>
                  <span className="pipeline-label">test</span>
                </div>
                <span className="pipeline-connector">
                  <span className="connector-fill fill-active animated-connector" />
                </span>
                <div className="pipeline-step-wrap">
                  <span className="pipeline-node active">
                    <span className="pulse-dot" />
                  </span>
                  <span className="pipeline-label label-active">scan</span>
                </div>
                <span className="pipeline-connector">
                  <span className="connector-fill" style={{ width: 0 }} />
                </span>
                <div className="pipeline-step-wrap">
                  <span className="pipeline-node pending">
                    <span className="empty-dot" />
                  </span>
                  <span className="pipeline-label">deploy</span>
                </div>
              </div>

              <div className="scan-section">
                <div className="scan-header">
                  <span className="scan-label">Security Scan</span>
                  <span className="scan-pct animated-percent">68%</span>
                </div>
                <div className="scan-bar-bg">
                  <div
                    className="scan-bar-fill animated-fill"
                    style={{ width: "68%" }}
                  >
                    <span className="scan-shimmer" />
                  </div>
                </div>
                <div className="scan-meta">
                  <span className="commit-hash">a4f32c1</span>
                  <span className="threat-blocked animated-threat">
                    2 threats blocked
                  </span>
                </div>
              </div>

              <div className="log-feed">
                {[
                  { text: "✓ image build [12.4s]", status: "done" },
                  { text: "✓ unit tests [284 passed]", status: "done" },
                  { text: "✓ lint [0 errors]", status: "ok" },
                  { text: "→ scanning dependencies…", status: "active" },
                ].map((log, idx) => (
                  <div
                    key={idx}
                    className={`log-line ${idx === activeLogLine ? "log-flash" : ""} ${log.status === "active" ? "log-active" : ""}`}
                  >
                    <span className={`log-indicator ${log.status}`} />
                    <span className="log-text">{log.text}</span>
                    {log.status === "active" && (
                      <span className="log-cursor">▍</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mockup-stats">
                <div className="mstat">
                  <div className="mstat-val green animated-counter">99.8%</div>
                  <div className="mstat-label">Uptime</div>
                </div>
                <span className="mstat-divider" />
                <div className="mstat">
                  <div className="mstat-val amber">12s</div>
                  <div className="mstat-label">Avg deploy</div>
                </div>
                <span className="mstat-divider" />
                <div className="mstat">
                  <div className="mstat-val gold">A+</div>
                  <div className="mstat-label">Security</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Aboutsection />

      {/* ── FEATURES ────────────────────────────────────── */}
      <FeaturesSection />

      {/* ── TESTIMONIALS ────────────────────────────────── */}
      <TestimonialsSection />
      <ContactUs />
      <SocialDock />

      {/* ── CONTACT US ─────────────────────────────────── */}

      {/* ── SENTINEL ────────────────────────────────────── */}

      {/* ── CTA ─────────────────────────────────────────── */}
      <section id="cta" className="cta-section">
        <div className="cta-wrapper">
          <h2>Prêt à orchestrer ?</h2>
          <blockquote>
            « Maestro nous a fait gagner des heures sur chaque déploiement, sans
            rien sacrifier sur la sécurité. »
          </blockquote>
          <div className="cta-buttons">
            <button
              type="button"
              className="btn-dark pulse-button"
              onClick={handleLogin}
              disabled={loggingIn}
            >
              {loggingIn ? "Redirection…" : "Se connecter"}
            </button>
            <Link to="/auth/register" className="btn-ghost">
              Créer un compte
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Maestro</div>
            <p className="footer-tagline">
              Plateforme DevSecOps pour orchestrer vos projets en toute
              sérénité.
            </p>
          </div>
          <div className="footer-col">
            <h4>Produit</h4>
            <ul>
              <li>
                <a href="#features">Fonctionnalités</a>
              </li>
              <li>
                <a href="#sentinel">Sécurité</a>
              </li>
              <li>
                <a href="#cta">Démarrer</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Compte</h4>
            <ul>
              <li>
                <a href="#" onClick={handleLogin}>
                  Se connecter
                </a>
              </li>
              <li>
                <Link to="/auth/register">Créer un compte</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Ressources</h4>
            <ul>
              <li>
                <a href="#">Documentation</a>
              </li>
              <li>
                <a href="#">Support</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Maestro. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
