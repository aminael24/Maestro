import React from "react";
import { motion } from "framer-motion";

// ─── Données avis clients ────────────────────────────────────────────────────
const testimonials = [
  {
    text: "Maestro nous a fait gagner des heures sur chaque déploiement. L'automatisation CI/CD est bluffante de simplicité.",
    name: "Karim Benali",
    role: "CTO, TechFlow",
    initials: "KB",
    color: "#083A4F",
  },
  {
    text: "La sécurité by design avec Keycloak et les cookies HttpOnly, c'est exactement ce qu'on cherchait. Zéro compromis.",
    name: "Sara Idrissi",
    role: "Lead DevSecOps, CloudNine",
    initials: "SI",
    color: "#407E8C",
  },
  {
    text: "Le workspace unifié a complètement changé notre façon de collaborer. Fini les jonglages entre 5 outils différents.",
    name: "Youssef Moukrim",
    role: "Engineering Manager, Innova",
    initials: "YM",
    color: "#A58D66",
  },
  {
    text: "Le rollback en un clic m'a sauvé deux fois en production. Je ne reviens plus en arrière.",
    name: "Nadia Cherkaoui",
    role: "Backend Engineer, DataSpark",
    initials: "NC",
    color: "#083A4F",
  },
  {
    text: "L'intégration du service IA pour la génération de code est impressionnante. On-premise, rapide, et bien intégré au pipeline.",
    name: "Mehdi Tazi",
    role: "Fullstack Dev, StartupX",
    initials: "MT",
    color: "#407E8C",
  },
  {
    text: "Onboarding ultra rapide, documentation claire, et l'équipe est réactive. Maestro c'est du sérieux.",
    name: "Hajar Bennani",
    role: "DevOps Engineer, NexaLab",
    initials: "HB",
    color: "#A58D66",
  },
  {
    text: "99.8% d'uptime en 6 mois d'utilisation. Les chiffres parlent d'eux-mêmes.",
    name: "Amine Rahali",
    role: "SRE, ScaleUp",
    initials: "AR",
    color: "#083A4F",
  },
  {
    text: "Le scan automatique des dépendances à chaque commit nous a permis de bloquer 3 vulnérabilités critiques avant prod.",
    name: "Rim Ouazzani",
    role: "Security Engineer, SecureNet",
    initials: "RO",
    color: "#407E8C",
  },
  {
    text: "Maestro s'intègre parfaitement dans notre stack existante. Migration faite en une journée, sans douleur.",
    name: "Omar Filali",
    role: "Architect, BuildCorp",
    initials: "OF",
    color: "#A58D66",
  },
];

const firstCol = testimonials.slice(0, 3);
const secondCol = testimonials.slice(3, 6);
const thirdCol = testimonials.slice(6, 9);

// ─── Carte avis ──────────────────────────────────────────────────────────────
function TestimonialCard({ text, name, role, initials, color }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(8,58,79,0.1)",
        borderRadius: "22px",
        padding: "28px",
        width: "100%",
        boxSizing: "border-box",
        boxShadow: "0 6px 24px rgba(8,58,79,0.08)",
      }}
    >
      {/* Quote */}
      <div
        style={{
          fontSize: "2.2rem",
          lineHeight: 1,
          color: color,
          opacity: 0.25,
          marginBottom: "10px",
          fontFamily: "Georgia, serif",
        }}
      >
        "
      </div>

      {/* Texte */}
      <p
        style={{
          fontSize: "1rem",
          lineHeight: 1.75,
          color: "#2a2a2a",
          margin: "0 0 24px",
        }}
      >
        {text}
      </p>

      {/* Auteur */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            backgroundColor: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 700,
            color: "#ffffff",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#083A4F",
              marginBottom: "2px",
            }}
          >
            {name}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#407E8C",
            }}
          >
            {role}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Colonne animée ───────────────────────────────────────────────────────────
function TestimonialsColumn({ testimonials, duration = 12, marginTop = 0 }) {
  return (
    <div style={{ overflow: "hidden" }}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "22px",
          paddingBottom: "22px",
          marginTop,
        }}
      >
        {[...Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {testimonials.map((t, i) => (
              <TestimonialCard key={`${index}-${i}`} {...t} />
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Section principale ───────────────────────────────────────────────────────
export default function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      style={{
        backgroundColor: "#E5E1DD",
        padding: "100px 28px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "68px",
          maxWidth: "740px",
          marginInline: "auto",
        }}
      >
        <p
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#407E8C",
            marginBottom: "14px",
          }}
        >
          Avis clients
        </p>

        <h2
          style={{
            fontSize: "clamp(2.7rem, 5vw, 4.5rem)",
            fontWeight: 900,
            color: "#083A4F",
            lineHeight: 1.05,
            marginBottom: "22px",
          }}
        >
          Ils orchestrent avec Maestro.
        </h2>

        <p
          style={{
            fontSize: "1.1rem",
            color: "#407E8C",
            lineHeight: 1.75,
          }}
        >
          Des équipes qui ont adopté Maestro et ne reviennent plus en arrière.
        </p>
      </div>

      {/* Colonnes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "26px",
          maxWidth: "1400px",
          margin: "0 auto",
          maxHeight: "700px",
          overflow: "hidden",

          maskImage:
            "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",

          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <TestimonialsColumn testimonials={firstCol} duration={14} />

        <TestimonialsColumn
          testimonials={secondCol}
          duration={18}
          marginTop={-85}
        />

        <TestimonialsColumn
          testimonials={thirdCol}
          duration={11}
          marginTop={-45}
        />
      </div>
    </section>
  );
}
