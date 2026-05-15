"use client";
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

// ─── Données des features ────────────────────────────────────────────────────
const FEATURES = [
  {
    id: "pipelines",
    num: "01",
    bg: "#083A4F", // Navy
    color: "#ffffff",
    accent: "#A58D66", // Gold
    label: "Pipelines CI/CD",
    headline: ["Build.", "Test.", "Deploy."],
    intro:
      "Définissez vos étapes en quelques clics. Maestro orchestre l ensemble — vous gardez la main sur ce qui compte.",
    items: [
      {
        title: "CI/CD intégré",
        desc: "Build, test, deploy en un seul flux automatisé sans configuration.",
      },
      {
        title: "Templates prêts",
        desc: "Node, Python, Go… des modèles prêts à l emploi pour démarrer vite.",
      },
      {
        title: "Rollback en un clic",
        desc: "Retour arrière instantané en cas de problème en production.",
      },
    ],
    stats: [
      { val: "12s", label: "Deploy moyen" },
      { val: "99.8%", label: "Uptime garanti" },
      { val: "0", label: "Config manuelle" },
    ],
  },
  {
    id: "workspace",
    num: "02",
    bg: "#407E8C", // Teal
    color: "#ffffff",
    accent: "#C0D5D6", // Aqua
    label: "Workspace unifié",
    headline: ["Un seul", "espace.", "Tout dedans."],
    intro:
      "Tableau de bord centralisé, partage des projets, vue temps réel sur les déploiements. Finis les jonglages entre 5 outils.",
    items: [
      {
        title: "Vue centralisée",
        desc: "Tous vos projets et pipelines accessibles depuis un seul endroit.",
      },
      {
        title: "Collaboration temps réel",
        desc: "Votre équipe voit les mêmes données, en même temps, sans refresh.",
      },
      {
        title: "Historique complet",
        desc: "Chaque déploiement tracé, annoté, consultable à tout moment.",
      },
    ],
    stats: [
      { val: "∞", label: "Projets simultanés" },
      { val: "< 1s", label: "Latence UI" },
      { val: "100%", label: "Sync équipe" },
    ],
  },
  {
    id: "security",
    num: "03",
    bg: "#A58D66", // Gold
    color: "#ffffff",
    accent: "#083A4F", // Navy
    label: "Sécurité by design",
    headline: ["Secrets", "jamais", "exposés."],
    intro:
      "Authentification Keycloak (OIDC), cookies HttpOnly côté backend, tokens jamais exposés au navigateur.",
    items: [
      {
        title: "OIDC + Keycloak",
        desc: "Auth confidentielle, flux code sécurisé, sessions gérées server-side.",
      },
      {
        title: "Cookies HttpOnly",
        desc: "Zéro risque XSS sur les tokens — jamais accessibles depuis le JS.",
      },
      {
        title: "Scan dépendances",
        desc: "Analyse automatique à chaque commit pour bloquer les vulnérabilités.",
      },
    ],
    stats: [
      { val: "A+", label: "Security grade" },
      { val: "0", label: "Tokens exposés" },
      { val: "100%", label: "Scans automatisés" },
    ],
  },
  {
    id: "ai",
    num: "04",
    bg: "#E5E1DD", // Sand
    color: "#083A4F", // Navy text
    accent: "#407E8C", // Teal
    label: "Génération IA",
    headline: ["Code généré.", "Humain", "validé."],
    intro:
      "Le service IA de Maestro génère du code sur demande via un LLM local (deepseek-coder) — intégré directement dans vos pipelines via RabbitMQ.",
    items: [
      {
        title: "deepseek-coder:6.7b",
        desc: "Modèle local via Ollama — zéro envoi de données vers des API externes.",
      },
      {
        title: "Queue RabbitMQ",
        desc: "Architecture asynchrone — les requêtes IA ne bloquent jamais le pipeline.",
      },
      {
        title: ".NET Worker Service",
        desc: "Microservice dédié, scalable indépendamment du reste de la plateforme.",
      },
    ],
    stats: [
      { val: "6.7B", label: "Paramètres modèle" },
      { val: "100%", label: "On-premise" },
      { val: "< 3s", label: "Génération moyenne" },
    ],
  },
];

// ─── FlowSection interne ─────────────────────────────────────────────────────
function FlowSection({ children, style, ariaLabel }) {
  return (
    <section
      data-flow-section
      aria-label={ariaLabel}
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        data-flow-inner
        className="flow-art-container"
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "2rem",
          minHeight: "100vh",
          width: "100%",
          padding: "clamp(2rem,8vw,4rem) clamp(1.5rem,4vw,3rem)",
          willChange: "transform",
          transformOrigin: "bottom left",
          ...style,
        }}
      >
        {children}
      </div>
    </section>
  );
}

// ─── FeaturesSection principal ───────────────────────────────────────────────
export default function FeaturesSection() {
  const containerRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current || reducedMotion) return;

      const sections = Array.from(
        containerRef.current.querySelectorAll("[data-flow-section]"),
      );
      if (sections.length === 0) return;

      const triggers = [];

      sections.forEach((section, i) => {
        gsap.set(section, { zIndex: i + 1 });
        const inner = section.querySelector(".flow-art-container");
        if (!inner) return;

        if (i > 0) {
          gsap.set(inner, { rotation: 30, transformOrigin: "bottom left" });
          const tween = gsap.to(inner, {
            rotation: 0,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "top 25%",
              scrub: true,
            },
          });
          if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
        }

        if (i < sections.length - 1) {
          triggers.push(
            ScrollTrigger.create({
              trigger: section,
              start: "bottom bottom",
              end: "bottom top",
              pin: true,
              pinSpacing: false,
            }),
          );
        }
      });

      ScrollTrigger.refresh();
      return () => triggers.forEach((t) => t.kill());
    },
    { scope: containerRef, dependencies: [reducedMotion] },
  );

  return (
    <div
      id="features"
      ref={containerRef}
      style={{ width: "100%", overflowX: "hidden" }}
    >
      {FEATURES.map((feat) => (
        <FlowSection
          key={feat.id}
          ariaLabel={feat.label}
          style={{ backgroundColor: feat.bg, color: feat.color }}
        >
          {/* ── Top label ── */}
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            {feat.num} — {feat.label}
          </p>

          <hr
            style={{
              border: "none",
              borderTop: `1px solid ${feat.accent}44`,
              margin: 0,
            }}
          />

          {/* ── Headline ── */}
          <div>
            <h2
              style={{
                fontSize: "clamp(3rem,10vw,10rem)",
                fontWeight: 800,
                lineHeight: 0.88,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {feat.headline.map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < feat.headline.length - 1 && <br />}
                </React.Fragment>
              ))}
            </h2>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: `1px solid ${feat.accent}44`,
              margin: 0,
            }}
          />

          {/* ── Intro ── */}
          <p
            style={{
              maxWidth: "52ch",
              fontSize: "clamp(1rem,2.2vw,1.5rem)",
              lineHeight: 1.55,
              opacity: 0.85,
            }}
          >
            {feat.intro}
          </p>

          <hr
            style={{
              border: "none",
              borderTop: `1px solid ${feat.accent}44`,
              margin: 0,
            }}
          />

          {/* ── Items ── */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "clamp(1rem,3vw,2rem)",
            }}
          >
            {feat.items.map((item) => (
              <div
                key={item.title}
                style={{ flex: "1 1 200px", minWidth: 180 }}
              >
                <p
                  style={{
                    marginBottom: "0.4rem",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: feat.accent,
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    fontSize: "clamp(0.82rem,1.2vw,1rem)",
                    lineHeight: 1.55,
                    opacity: 0.72,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <hr
            style={{
              border: "none",
              borderTop: `1px solid ${feat.accent}44`,
              margin: 0,
            }}
          />

          {/* ── Stats ── */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "clamp(1rem,3vw,2rem)",
              marginTop: "auto",
            }}
          >
            {feat.stats.map((stat) => (
              <div key={stat.label}>
                <p
                  style={{
                    fontSize: "clamp(1.5rem,4vw,3rem)",
                    fontWeight: 800,
                    color: feat.accent,
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {stat.val}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    opacity: 0.6,
                    margin: "4px 0 0",
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </FlowSection>
      ))}
    </div>
  );
}
