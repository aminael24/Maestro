"use client";
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

// ═══════════════════════════════════════════════════════════════════════
// FeaturesSection — 4 slides GSAP avec scroll pin, alignées sur la stack
// Maestro RÉELLE.
//
//  Slide 01 — ApiGateway & Auth OIDC Keycloak  (avant: pipelines CI/CD)
//  Slide 02 — WorkspaceService + Monaco Editor (avant: workspace générique)
//  Slide 03 — AIService LLaMA 3.1 + RunnerService Docker
//                                              (avant: sécurité by design)
//  Slide 04 — Infrastructure Docker Compose + Kafka
//                                              (avant: génération IA générique)
// ═══════════════════════════════════════════════════════════════════════

const FEATURES = [
  {
    id: "apigateway",
    num: "01",
    bg: "#083A4F", // Navy
    color: "#ffffff",
    accent: "#A58D66", // Gold
    label: "ApiGateway & Auth OIDC Keycloak",
    headline: ["Gateway.", "OIDC.", "Cookies."],
    intro:
      "L'ApiGateway .NET 8 centralise l'authentification via Keycloak en flux Authorization Code confidentiel. Les tokens vivent en cookies HttpOnly — jamais exposés au navigateur.",
    items: [
      {
        title: "Keycloak OIDC",
        desc: "Flux Authorization Code confidentiel, client maestro-api-gateway, secret côté serveur uniquement.",
      },
      {
        title: "Cookies HttpOnly",
        desc: "Access, refresh et ID tokens stockés en cookies HttpOnly SameSite. Pas de localStorage.",
      },
      {
        title: "Logout 2 phases",
        desc: "Back-channel logout côté serveur + end_session côté navigateur pour clear toutes les sessions.",
      },
    ],
    stats: [
      { val: "OIDC", label: "Authorization Code" },
      { val: "HttpOnly", label: "Cookies tokens" },
      { val: "0", label: "Token côté JS" },
    ],
  },
  {
    id: "workspace",
    num: "02",
    bg: "#407E8C", // Teal
    color: "#ffffff",
    accent: "#C0D5D6", // Aqua
    label: "WorkspaceService + Monaco Editor",
    headline: ["Workspace.", "Monaco.", "API REST."],
    intro:
      "Le WorkspaceService expose le file tree, le contenu des fichiers et la persistance via une API REST authentifiée. Le frontend embarque Monaco Editor pour une expérience IDE complète.",
    items: [
      {
        title: "File tree REST",
        desc: "Lecture et navigation arborescente via GET /api/projects/{id}/files, authentifié JWT.",
      },
      {
        title: "Monaco Editor",
        desc: "Même moteur que VS Code, intégré au frontend React. Coloration, completion, raccourcis.",
      },
      {
        title: "Save streaming",
        desc: "Lecture et écriture du contenu de fichier en PUT/GET avec proxy par l'ApiGateway.",
      },
    ],
    stats: [
      { val: "REST", label: "File tree API" },
      { val: "Monaco", label: "Éditeur intégré" },
      { val: "JWT", label: "Auth par requête" },
    ],
  },
  {
    id: "ai-runner",
    num: "03",
    bg: "#A58D66", // Gold
    color: "#ffffff",
    accent: "#083A4F", // Navy
    label: "AIService LLaMA 3.1 + RunnerService Docker",
    headline: ["LLaMA 3.1.", "Docker.", "Isolation."],
    intro:
      "L'AIService génère le code via LLaMA 3.1, et le RunnerService l'exécute dans des conteneurs Docker isolés et éphémères. Chaque exécution part d'un environnement neuf.",
    items: [
      {
        title: "LLaMA 3.1",
        desc: "Modèle de génération de code interrogé par l'AIService, prompts authentifiés.",
      },
      {
        title: "RunnerService",
        desc: "Microservice .NET qui spawn des conteneurs Docker à la volée pour exécuter le code.",
      },
      {
        title: "Sandbox éphémère",
        desc: "Chaque run = un nouveau container. Pas de partage d'état entre exécutions.",
      },
    ],
    stats: [
      { val: "3.1", label: "LLaMA version" },
      { val: "Docker", label: "Sandbox par run" },
      { val: "0", label: "État partagé" },
    ],
  },
  {
    id: "infra",
    num: "04",
    bg: "#E5E1DD", // Sand
    color: "#083A4F", // Navy text
    accent: "#407E8C", // Teal
    label: "Infrastructure Docker Compose + Kafka",
    headline: ["Compose up.", "Kafka.", "Une commande."],
    intro:
      "Toute la plateforme — Keycloak, PostgreSQL, microservices, frontend Vite, Kafka — démarre via un unique `docker compose up`. Zéro config locale, environnement reproductible.",
    items: [
      {
        title: "Docker Compose",
        desc: "Stack complète déclarée dans un seul docker-compose.yml. Profils dev et prod.",
      },
      {
        title: "Kafka events",
        desc: "Bus d'événements entre microservices pour les flux asynchrones (génération IA, runs).",
      },
      {
        title: "Postgres + Keycloak",
        desc: "DB locale auto-migrée au démarrage, Keycloak avec realm Maestro pré-configuré.",
      },
    ],
    stats: [
      { val: "1", label: "Cmd pour démarrer" },
      { val: "100%", label: "Conteneurisé" },
      { val: "Kafka", label: "Event bus" },
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
          {/* Top label */}
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

          {/* Headline */}
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

          {/* Intro */}
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

          {/* Items */}
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

          {/* Stats */}
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
