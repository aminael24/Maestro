import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { redirectToGatewayLogin } from "../../services/authService";
import "./LandingPage.css";

/**
 * LandingPage – page d'accueil publique de Maestro.
 *
 *  - Bouton « Se connecter » → redirige le navigateur vers /auth/login
 *    de l'API Gateway. Le gateway prend le relais (Keycloak,
 *    cookies HttpOnly, redirect final vers /workspace/projects).
 *  - Bouton « Créer un compte » → route locale /auth/register.
 *  - Aucun PKCE, aucun token côté frontend.
 */
export default function LandingPage() {
  const [revealed, setRevealed] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    // Petit délai pour laisser les transitions CSS faire leur effet.
    const t = setTimeout(() => setRevealed(true), 60);
    return () => clearTimeout(t);
  }, []);

  function handleLogin(e) {
    e?.preventDefault();
    setLoggingIn(true);
    redirectToGatewayLogin(); // full-page navigation vers le backend
  }

  return (
    <div className="maestro-landing">
      {/* ── NAV ─────────────────────────────────────────── */}
      <nav>
        <a href="/" className="nav-brand">
          Maestro
        </a>
        <ul className="nav-links">
          <li><a href="#features">Fonctionnalités</a></li>
          <li><a href="#sentinel">Sécurité</a></li>
          <li><a href="#cta">Commencer</a></li>
        </ul>
        <button className="nav-cta" onClick={handleLogin} disabled={loggingIn}>
          {loggingIn ? "Redirection…" : "Se connecter"}
        </button>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="hero-section">
        <span className="orb orb-gold" aria-hidden="true" />
        <span className="orb orb-green" aria-hidden="true" />

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
                  <span className="connector-fill fill-active" />
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
                  <span className="scan-pct">68%</span>
                </div>
                <div className="scan-bar-bg">
                  <div className="scan-bar-fill" style={{ width: "68%" }}>
                    <span className="scan-shimmer" />
                  </div>
                </div>
                <div className="scan-meta">
                  <span className="commit-hash">a4f32c1</span>
                  <span className="threat-blocked">2 threats blocked</span>
                </div>
              </div>

              <div className="log-feed">
                <div className="log-line">
                  <span className="log-indicator done" />
                  <span className="log-text">✓ image build &nbsp;[12.4s]</span>
                </div>
                <div className="log-line">
                  <span className="log-indicator done" />
                  <span className="log-text">✓ unit tests &nbsp;[284 passed]</span>
                </div>
                <div className="log-line">
                  <span className="log-indicator ok" />
                  <span className="log-text">✓ lint &nbsp;[0 errors]</span>
                </div>
                <div className="log-line log-active">
                  <span className="log-indicator active" />
                  <span className="log-text">→ scanning dependencies…</span>
                  <span className="log-cursor">▍</span>
                </div>
              </div>

              <div className="mockup-stats">
                <div className="mstat">
                  <div className="mstat-val green">99.8%</div>
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

      {/* ── FEATURES ────────────────────────────────────── */}
      <section id="features" className="features-section">
        <div className="feature-row">
          <div className="feature-image-wrapper">
            <div className="feature-image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="#1a1a18" strokeWidth="1.2">
                <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
                <path d="M3 7l9 4 9-4M12 11v10" />
              </svg>
            </div>
          </div>
          <div className="feature-content-wrapper">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2C6B4A" strokeWidth="1.6" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M7 12l3 3 7-7" />
              </svg>
            </div>
            <h2>Pipelines à la demande, sans configuration</h2>
            <p>
              Définissez vos étapes de build, de test et de déploiement en
              quelques clics. Maestro orchestre l'ensemble — vous gardez la
              main sur ce qui compte.
            </p>
            <ul className="feature-checks">
              <li>
                <span className="check-dot" />
                <span><strong>CI/CD intégré</strong> – build, test, deploy en un seul flux</span>
              </li>
              <li>
                <span className="check-dot" />
                <span><strong>Templates prêts à l'emploi</strong> pour Node, Python, Go…</span>
              </li>
              <li>
                <span className="check-dot" />
                <span><strong>Rollback en un clic</strong> en cas de problème en production</span>
              </li>
            </ul>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-value">12s</div>
                <div className="stat-label">Deploy moyen</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">99.8%</div>
                <div className="stat-label">Uptime garanti</div>
              </div>
            </div>
          </div>
        </div>

        <div className="feature-row reverse">
          <div className="feature-image-wrapper">
            <div className="feature-image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="#1a1a18" strokeWidth="1.2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
          </div>
          <div className="feature-content-wrapper">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2C6B4A" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h2>Workspace unifié pour vos équipes</h2>
            <p>
              Tableau de bord centralisé, partage des projets, vue temps réel
              sur les déploiements. Plus de jongles entre 5 outils différents.
            </p>
            <ul className="feature-checks">
              <li>
                <span className="check-dot" />
                <span><strong>Vue centralisée</strong> sur tous vos projets</span>
              </li>
              <li>
                <span className="check-dot" />
                <span><strong>Collaboration temps réel</strong> avec votre équipe</span>
              </li>
              <li>
                <span className="check-dot" />
                <span><strong>Historique complet</strong> des déploiements</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── SENTINEL (sécurité) ─────────────────────────── */}
      <section id="sentinel" className="features-section">
        <div className="feature-row">
          <div className="feature-content-wrapper sentinel-content-wrapper">
            <div className="feature-icon sentinel-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
              </svg>
            </div>
            <h2>Sécurité by design</h2>
            <p>
              Authentification Keycloak (OIDC), cookies HttpOnly côté backend,
              tokens jamais exposés au navigateur. Vos secrets restent secrets.
            </p>
            <ul className="feature-checks">
              <li>
                <span className="check-dot" />
                <span><strong>OIDC + Keycloak</strong> — auth confidentielle</span>
              </li>
              <li>
                <span className="check-dot" />
                <span><strong>Cookies HttpOnly</strong> — pas de XSS sur les tokens</span>
              </li>
              <li>
                <span className="check-dot" />
                <span><strong>Scan dépendances</strong> à chaque commit</span>
              </li>
            </ul>
            <button
              type="button"
              className="btn-outline-light"
              onClick={handleLogin}
              disabled={loggingIn}
            >
              {loggingIn ? "Redirection…" : "Découvrir Maestro →"}
            </button>
          </div>
          <div className="feature-image-wrapper sentinel-image-wrapper">
            <div className="feature-image-placeholder" style={{ background: "linear-gradient(135deg, #1E2E2C 0%, #0a1a18 100%)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,106,0.6)" strokeWidth="1.2">
                <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section id="cta" className="cta-section">
        <h2>Prêt à orchestrer ?</h2>
        <blockquote>
          « Maestro nous a fait gagner des heures sur chaque déploiement,
          sans rien sacrifier sur la sécurité. »
        </blockquote>
        <div className="cta-buttons">
          <button
            type="button"
            className="btn-dark"
            onClick={handleLogin}
            disabled={loggingIn}
          >
            {loggingIn ? "Redirection…" : "Se connecter"}
          </button>
          <Link to="/auth/register" className="btn-ghost">
            Créer un compte
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Maestro</div>
            <p className="footer-tagline">
              Plateforme DevSecOps pour orchestrer vos projets en toute sérénité.
            </p>
          </div>
          <div className="footer-col">
            <h4>Produit</h4>
            <ul>
              <li><a href="#features">Fonctionnalités</a></li>
              <li><a href="#sentinel">Sécurité</a></li>
              <li><a href="#cta">Démarrer</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Compte</h4>
            <ul>
              <li><a href="#" onClick={handleLogin}>Se connecter</a></li>
              <li><Link to="/auth/register">Créer un compte</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Ressources</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Support</a></li>
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
