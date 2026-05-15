// src/components/landing/CTABanner.jsx
import { useEffect, useRef, useState } from "react";
import CurvedLoop from "./CurvedLoop";

/* ─── CSS injecté une seule fois ─────────────────────────── */
const CTA_CSS = `
  /* ── Wrapper global ── */
  .cta-banner-section {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #062233 0%, #083A4F 45%, #0a4a63 100%);
    padding: 0;
  }

  /* Grille décorative en fond */
  .cta-banner-section::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(192,213,214,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(192,213,214,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  /* Halo lumineux centré */
  .cta-banner-section::after {
    content: "";
    position: absolute;
    top: 10%;
    left: 50%;
    transform: translateX(-50%);
    width: 700px;
    height: 400px;
    background: radial-gradient(ellipse, rgba(165,141,102,0.18) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── Contenu centré ── */
  .cta-banner-inner {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 6rem 2rem 4rem;
    gap: 0;
  }

  /* Badge */
  .cta-banner-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 16px;
    border-radius: 999px;
    background: rgba(165,141,102,0.15);
    border: 1px solid rgba(165,141,102,0.35);
    color: #c9aa80;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 2rem;
    animation: ctaFadeUp 0.6s ease both;
  }
  .cta-banner-badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #A58D66;
    animation: dotPulse2 2s ease-in-out infinite;
  }
  @keyframes dotPulse2 {
    0%,100% { box-shadow: 0 0 4px #A58D66; }
    50%      { box-shadow: 0 0 12px #A58D66, 0 0 22px rgba(165,141,102,0.4); }
  }

  /* Titre */
  .cta-banner-title {
    font-size: clamp(2.2rem, 5vw, 3.8rem);
    font-weight: 800;
    color: #ffffff;
    line-height: 1.12;
    letter-spacing: -0.03em;
    margin: 0 0 1.25rem;
    animation: ctaFadeUp 0.7s 0.1s ease both;
    max-width: 720px;
  }
  .cta-banner-title span {
    background: linear-gradient(90deg, #A58D66, #C0D5D6, #A58D66);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: titleShimmer 3.5s linear infinite;
  }
  @keyframes titleShimmer {
    0%   { background-position: 0% center; }
    100% { background-position: 200% center; }
  }

  /* Sous-titre */
  .cta-banner-sub {
    font-size: 1.05rem;
    color: rgba(192,213,214,0.75);
    max-width: 520px;
    line-height: 1.65;
    margin: 0 0 2.5rem;
    animation: ctaFadeUp 0.7s 0.2s ease both;
  }

  /* Boutons */
  .cta-banner-btns {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    justify-content: center;
    animation: ctaFadeUp 0.7s 0.3s ease both;
    margin-bottom: 3rem;
  }

  /* Bouton primary */
  .cta-btn-primary {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    border: none;
    overflow: hidden;
    color: #fff;
    background: linear-gradient(135deg, #A58D66 0%, #c9aa80 50%, #A58D66 100%);
    background-size: 200% 100%;
    box-shadow: 0 4px 20px rgba(165,141,102,0.5), 0 0 0 0 rgba(165,141,102,0);
    transition: transform 0.2s ease, box-shadow 0.3s ease;
    animation: btnShimmerIdle2 3s ease infinite;
    font-family: inherit;
  }
  .cta-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(165,141,102,0.7), 0 0 0 4px rgba(165,141,102,0.12);
    background-position: right center;
  }
  .cta-btn-primary:active { transform: scale(0.97); }
  @keyframes btnShimmerIdle2 {
    0%,100% { background-position: left center; }
    50%      { background-position: right center; }
  }

  /* Shine sweep */
  .cta-btn-shine {
    position: absolute;
    top: -50%; left: -75%;
    width: 50%; height: 200%;
    background: linear-gradient(
      120deg,
      transparent 30%,
      rgba(255,255,255,0.35) 50%,
      transparent 70%
    );
    transform: skewX(-20deg);
    animation: btnShine2 3.5s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes btnShine2 {
    0%   { left: -75%; }
    55%  { left: 130%; }
    100% { left: 130%; }
  }

  /* Flèche animée */
  .cta-btn-arrow {
    display: inline-block;
    transition: transform 0.25s ease;
  }
  .cta-btn-primary:hover .cta-btn-arrow { transform: translateX(4px); }

  /* Bouton ghost */
  .cta-btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.85);
    transition: background 0.25s, border-color 0.25s, transform 0.2s, box-shadow 0.25s;
    font-family: inherit;
  }
  .cta-btn-ghost:hover {
    background: rgba(255,255,255,0.14);
    border-color: rgba(255,255,255,0.38);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(192,213,214,0.15);
  }
  .cta-btn-ghost:active { transform: scale(0.97); }

  /* Stats row */
  .cta-banner-stats {
    display: flex;
    align-items: center;
    gap: 2.5rem;
    flex-wrap: wrap;
    justify-content: center;
    animation: ctaFadeUp 0.7s 0.4s ease both;
    margin-bottom: 1rem;
  }
  .cta-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .cta-stat-val {
    font-size: 1.6rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
  }
  .cta-stat-val.gold  { color: #A58D66; }
  .cta-stat-val.aqua  { color: #C0D5D6; }
  .cta-stat-val.teal  { color: #407E8C; }
  .cta-stat-label {
    font-size: 0.75rem;
    color: rgba(192,213,214,0.55);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .cta-stat-divider {
    width: 1px;
    height: 36px;
    background: rgba(192,213,214,0.15);
  }

  /* Séparateur visuel entre stats et CurvedLoop */
  .cta-divider {
    width: 100%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(165,141,102,0.3) 30%,
      rgba(192,213,214,0.3) 70%,
      transparent 100%
    );
    margin: 0;
  }

  /* Zone CurvedLoop */
  .cta-curved-wrap {
    position: relative;
    z-index: 2;
    width: 100%;
    padding: 0.5rem 0 1rem;
    opacity: 0.85;
  }

  /* Texte curved custom */
  .cta-curved-text {
    fill: rgba(165,141,102,0.65);
    font-size: 5.5rem;
    letter-spacing: 0.02em;
  }

  /* Animation d'entrée */
  @keyframes ctaFadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Responsive */
  @media (max-width: 600px) {
    .cta-banner-inner { padding: 4rem 1.25rem 2rem; }
    .cta-banner-btns  { flex-direction: column; width: 100%; }
    .cta-btn-primary,
    .cta-btn-ghost    { width: 100%; justify-content: center; }
    .cta-banner-stats { gap: 1.5rem; }
    .cta-stat-divider { display: none; }
  }
`;

function useInjectCSS(css, id) {
  useEffect(() => {
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);
}

export default function CTABanner({ onLogin, onRegister }) {
  useInjectCSS(CTA_CSS, "cta-banner-styles");

  function handleLogin(e) {
    e?.preventDefault();
    if (onLogin) onLogin();
  }

  function handleRegister(e) {
    e?.preventDefault();
    if (onRegister) onRegister();
    else window.location.href = "/register";
  }

  return (
    <section className="cta-banner-section">
      {/* ── Contenu principal ── */}
      <div className="cta-banner-inner">
        {/* Badge */}
        <div className="cta-banner-badge">
          <span className="cta-banner-badge-dot" />
          Disponible maintenant
        </div>

        {/* Titre */}
        <h2 className="cta-banner-title">
          Prêt à orchestrer <span>vos projets</span>
          <br />
          en toute sérénité ?
        </h2>

        {/* Sous-titre */}
        <p className="cta-banner-sub">
          Rejoignez Maestro et automatisez vos pipelines CI/CD, sécurisez vos
          déploiements et pilotez votre workflow DevOps depuis un workspace
          unique.
        </p>

        {/* Boutons */}
        <div className="cta-banner-btns">
          <button className="cta-btn-primary" onClick={handleRegister}>
            <span className="cta-btn-shine" aria-hidden="true" />
            Créer un compte gratuitement
            <span className="cta-btn-arrow">→</span>
          </button>
          <button className="cta-btn-ghost" onClick={handleLogin}>
            Se connecter
          </button>
        </div>

        {/* Stats */}
        <div className="cta-banner-stats">
          <div className="cta-stat">
            <span className="cta-stat-val gold">5</span>
            <span className="cta-stat-label">Microservices</span>
          </div>
          <span className="cta-stat-divider" />
          <div className="cta-stat">
            <span className="cta-stat-val aqua">3</span>
            <span className="cta-stat-label">LLMs supportés</span>
          </div>
          <span className="cta-stat-divider" />
          <div className="cta-stat">
            <span className="cta-stat-val teal">100%</span>
            <span className="cta-stat-label">Automatisé</span>
          </div>
          <span className="cta-stat-divider" />
          <div className="cta-stat">
            <span className="cta-stat-val" style={{ color: "#fff" }}>
              ∞
            </span>
            <span className="cta-stat-label">Scalable</span>
          </div>
        </div>
      </div>

      {/* ── Séparateur ── */}
      <div className="cta-divider" />

      {/* ── CurvedLoop ── */}
      <div className="cta-curved-wrap">
        <CurvedLoop
          marqueeText="Maestro ✦ Prompt to Deploy ✦ CI/CD Automatisé ✦ Groq · LLaMA ✦ Docker ✦ Keycloak ✦ Kafka ✦"
          speed={2}
          curveAmount={180}
          direction="left"
          interactive={true}
          className="cta-curved-text"
        />
      </div>

      <div className="cta-curved-wrap">
        <CurvedLoop
          marqueeText="Maestro ✦ Prompt to Deploy ✦ CI/CD Automatisé ✦ Groq · LLaMA ✦ Docker ✦ Keycloak ✦ Kafka ✦"
          speed={2}
          curveAmount={180}
          direction="left"
          interactive={true}
          className="cta-curved-text"
        />
      </div>
    </section>
  );
}
