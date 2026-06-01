import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Server,
  Terminal,
  Lock,
  Bot,
  Container,
  Award,
  Users,
  Calendar,
  TrendingUp,
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Sparkles,
} from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useSpring,
} from "framer-motion";

// ─── Palette Maestro ────────────────────────────────────────────────────────
const P = {
  navy: "#083A4F",
  gold: "#A58D66",
  aqua: "#C0D5D6",
  teal: "#407E8C",
  sand: "#E5E1DD",
  sandLight: "#F5F2EE",
  sandMid: "#EDE9E4",
  navyText: "#083A4F",
  tealLight: "#EAF3F5",
};

// ═══════════════════════════════════════════════════════════════════════
// AboutSection — refonte alignée sur les services Maestro RÉELS
//
// Avant (générique)            →  Après (réel)
//   CI/CD                      →  ApiGateway (.NET 8, OIDC + Keycloak)
//   Sécurité                   →  Auth OIDC (cookies HttpOnly)
//   Workspace                  →  WorkspaceService (Monaco Editor)
//   Secrets                    →  Sécurité tokens (jamais exposés au JS)
//   Monitoring                 →  AIService + RunnerService (LLaMA 3.1 + Docker)
//   Deploy                     →  Infrastructure Docker Compose
//
// Stats : 4 microservices, 5 développeuses, 100% conteneurisé,
//         1 commande pour démarrer.
//
// Bouton hero "Commencer" → /auth/register
// ═══════════════════════════════════════════════════════════════════════
export default function AboutSection() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.1 });
  const isStatsInView = useInView(statsRef, { once: false, amount: 0.3 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 20]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -20]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // ── 6 services Maestro RÉELS ────────────────────────────────────────────
  const services = [
    {
      icon: <Server className="w-6 h-6" />,
      secondaryIcon: (
        <Sparkles
          className="w-4 h-4 absolute -top-1 -right-1"
          style={{ color: P.teal }}
        />
      ),
      title: "ApiGateway",
      description:
        "Gateway .NET 8 qui orchestre l'authentification OIDC via Keycloak, le routage vers les microservices et la gestion des cookies HttpOnly.",
      position: "left",
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      secondaryIcon: (
        <CheckCircle
          className="w-4 h-4 absolute -top-1 -right-1"
          style={{ color: P.teal }}
        />
      ),
      title: "Auth OIDC",
      description:
        "Authentification Keycloak en flux Authorization Code confidentiel. Aucun token n'est jamais exposé au navigateur — uniquement des cookies HttpOnly.",
      position: "left",
    },
    {
      icon: <Terminal className="w-6 h-6" />,
      secondaryIcon: (
        <Star
          className="w-4 h-4 absolute -top-1 -right-1"
          style={{ color: P.gold }}
        />
      ),
      title: "WorkspaceService",
      description:
        "Microservice .NET dédié aux fichiers projet et à l'éditeur Monaco. File tree et contenu de fichiers exposés via une API REST authentifiée.",
      position: "left",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      secondaryIcon: (
        <Sparkles
          className="w-4 h-4 absolute -top-1 -right-1"
          style={{ color: P.teal }}
        />
      ),
      title: "Sécurité tokens",
      description:
        "Access, refresh et ID tokens stockés exclusivement en cookies HttpOnly SameSite. Le JavaScript du frontend ne voit jamais aucun token.",
      position: "right",
    },
    {
      icon: <Bot className="w-6 h-6" />,
      secondaryIcon: (
        <CheckCircle
          className="w-4 h-4 absolute -top-1 -right-1"
          style={{ color: P.teal }}
        />
      ),
      title: "AIService + RunnerService",
      description:
        "Service IA propulsé par LLaMA 3.1 pour la génération de code, couplé au RunnerService qui exécute le code dans des conteneurs Docker isolés.",
      position: "right",
    },
    {
      icon: <Container className="w-6 h-6" />,
      secondaryIcon: (
        <Star
          className="w-4 h-4 absolute -top-1 -right-1"
          style={{ color: P.gold }}
        />
      ),
      title: "Infrastructure Docker",
      description:
        "Toute la plateforme tourne via Docker Compose : Keycloak, PostgreSQL, microservices, frontend Vite. Un seul `docker compose up` pour tout démarrer.",
      position: "right",
    },
  ];

  // ── Stats RÉELLES du projet ─────────────────────────────────────────────
  const stats = [
    { icon: <Award />, value: 4, label: "Microservices .NET", suffix: "" },
    { icon: <Users />, value: 5, label: "Développeuses", suffix: "" },
    { icon: <Calendar />, value: 100, label: "Conteneurisé", suffix: "%" },
    { icon: <TrendingUp />, value: 1, label: "Cmd pour démarrer", suffix: "" },
  ];

  const handleCommencer = () => {
    navigate("/auth/register");
  };

  return (
    <section
      id="about"
      ref={sectionRef}
      style={{
        width: "100%",
        padding: "96px 32px",
        background: `linear-gradient(to bottom, ${P.sandLight}, ${P.sandMid})`,
        color: P.navyText,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Blobs décoratifs ───────────────────────────────────────── */}
      <motion.div
        style={{
          position: "absolute",
          top: 80,
          left: 40,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: `${P.gold}18`,
          filter: "blur(48px)",
          y: y1,
          rotate: rotate1,
        }}
      />
      <motion.div
        style={{
          position: "absolute",
          bottom: 80,
          right: 40,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `${P.teal}18`,
          filter: "blur(48px)",
          y: y2,
          rotate: rotate2,
        }}
      />
      <motion.div
        style={{
          position: "absolute",
          top: "50%",
          left: "25%",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: `${P.gold}55`,
        }}
        animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{
          position: "absolute",
          bottom: "33%",
          right: "25%",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: `${P.teal}44`,
        }}
        animate={{ y: [0, 20, 0], opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <motion.div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          position: "relative",
          zIndex: 10,
        }}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        {/* ── En-tête ─────────────────────────────────────────────── */}
        <motion.div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 24,
          }}
          variants={itemVariants}
        >
          <motion.span
            style={{
              color: P.gold,
              fontWeight: 600,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.875rem",
              letterSpacing: "0.08em",
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Zap style={{ width: 16, height: 16 }} />
            6 SERVICES MAESTRO
          </motion.span>
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 300,
              marginBottom: 16,
              textAlign: "center",
              color: P.navyText,
            }}
          >
            À propos de <strong style={{ fontWeight: 900 }}>Maestro</strong>
          </h2>
          <motion.div
            style={{
              height: 4,
              background: `linear-gradient(to right, ${P.teal}, ${P.gold})`,
              borderRadius: 999,
            }}
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </motion.div>

        <motion.p
          style={{
            textAlign: "center",
            maxWidth: 640,
            margin: "0 auto 64px",
            color: `${P.navyText}bb`,
            lineHeight: 1.8,
            fontSize: "1rem",
          }}
          variants={itemVariants}
        >
          Maestro c'est <strong>4 microservices .NET</strong>, un frontend React,
          une stack Keycloak/PostgreSQL et un runner Docker — tout orchestré
          par un Docker Compose unique. Bâti par 5 développeuses, 100%
          conteneurisé, 1 commande pour démarrer.
        </motion.p>

        {/* ── Grille 3 colonnes ────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px 1fr",
            gap: 40,
            alignItems: "start",
          }}
        >
          {/* Colonne gauche */}
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {services
              .filter((s) => s.position === "left")
              .map((s, i) => (
                <ServiceItem
                  key={i}
                  {...s}
                  variants={itemVariants}
                  delay={i * 0.2}
                  direction="left"
                />
              ))}
          </div>

          {/* Image centrale */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <motion.div
              style={{ position: "relative", width: "100%" }}
              variants={itemVariants}
            >
              <motion.div
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: `0 24px 60px ${P.navy}33`,
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
              >
                {/* Mini-mockup pipeline aligné sur les vrais services */}
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "3/4",
                    background: `linear-gradient(160deg, ${P.navy} 0%, ${P.teal} 60%, ${P.gold}55 100%)`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    padding: 24,
                  }}
                >
                  {[
                    "api-gateway",
                    "auth-oidc",
                    "workspace",
                    "ai-runner",
                  ].map((step, i) => (
                    <motion.div
                      key={step}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        borderRadius: 8,
                        background:
                          i < 2
                            ? `${P.teal}99`
                            : i === 2
                              ? `${P.aqua}33`
                              : "rgba(255,255,255,0.05)",
                        border: `1px solid ${
                          i === 2 ? P.aqua : "rgba(255,255,255,0.1)"
                        }`,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                    >
                      <motion.span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background:
                            i < 2
                              ? "#28c840"
                              : i === 2
                                ? P.gold
                                : "rgba(255,255,255,0.2)",
                          flexShrink: 0,
                        }}
                        animate={
                          i === 2
                            ? { opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }
                            : {}
                        }
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: i < 3 ? P.sand : `${P.sand}55`,
                          fontFamily: "monospace",
                        }}
                      >
                        {step}
                      </span>
                      {i < 2 && (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "0.7rem",
                            color: "#28c840",
                          }}
                        >
                          ✓
                        </span>
                      )}
                      {i === 2 && (
                        <motion.span
                          style={{
                            marginLeft: "auto",
                            fontSize: "0.7rem",
                            color: P.gold,
                          }}
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          ▍
                        </motion.span>
                      )}
                    </motion.div>
                  ))}
                  <div style={{ marginTop: 8, textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 900,
                        color: P.sand,
                      }}
                    >
                      docker
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: `${P.sand}77`,
                        letterSpacing: "0.08em",
                      }}
                    >
                      COMPOSE UP
                    </div>
                  </div>
                </div>

                <motion.div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(to top, ${P.navy}88, transparent)`,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    padding: 16,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                >
                  <motion.button
                    onClick={handleCommencer}
                    aria-label="Commencer — créer un compte"
                    style={{
                      background: P.sand,
                      color: P.navy,
                      padding: "8px 18px",
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Commencer{" "}
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </motion.button>
                </motion.div>
              </motion.div>

              {/* Bordure décorative */}
              <motion.div
                style={{
                  position: "absolute",
                  inset: -12,
                  border: `3px solid ${P.aqua}66`,
                  borderRadius: 16,
                  zIndex: -1,
                }}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              />

              {/* Points décoratifs */}
              <motion.div
                style={{
                  position: "absolute",
                  top: -16,
                  right: -32,
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: `${P.gold}22`,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.9 }}
              />
              <motion.div
                style={{
                  position: "absolute",
                  bottom: -24,
                  left: -40,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: `${P.teal}22`,
                }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.1 }}
              />
              <motion.div
                style={{
                  position: "absolute",
                  top: -40,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: P.gold,
                }}
                animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                style={{
                  position: "absolute",
                  bottom: -48,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: P.aqua,
                }}
                animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
            </motion.div>
          </div>

          {/* Colonne droite */}
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {services
              .filter((s) => s.position === "right")
              .map((s, i) => (
                <ServiceItem
                  key={i}
                  {...s}
                  variants={itemVariants}
                  delay={i * 0.2}
                  direction="right"
                />
              ))}
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────────── */}
        <motion.div
          ref={statsRef}
          style={{
            marginTop: 96,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
          }}
          initial="hidden"
          animate={isStatsInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {stats.map((s, i) => (
            <StatCounter key={i} {...s} delay={i * 0.1} />
          ))}
        </motion.div>

        {/* ── CTA banner ─────────────────────────────────────────── */}
        <motion.div
          style={{
            marginTop: 80,
            background: `linear-gradient(135deg, ${P.navy} 0%, ${P.teal} 100%)`,
            color: P.sand,
            padding: "40px 48px",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
            boxShadow: `0 20px 60px ${P.navy}44`,
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div>
            <h3
              style={{
                fontSize: "1.4rem",
                fontWeight: 600,
                marginBottom: 6,
                color: P.sand,
              }}
            >
              Prêt à orchestrer vos projets ?
            </h3>
            <p style={{ color: `${P.sand}99`, fontSize: "0.95rem" }}>
              Créez votre compte, déployez en quelques secondes.
            </p>
          </div>
          <motion.button
            onClick={handleCommencer}
            aria-label="Commencer — créer un compte"
            style={{
              background: `linear-gradient(135deg, ${P.gold}, ${P.aqua}dd)`,
              color: P.navy,
              padding: "12px 28px",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
              fontSize: "0.9rem",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Commencer <ArrowRight style={{ width: 16, height: 16 }} />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── ServiceItem ─────────────────────────────────────────────────────────────
interface ServiceItemProps {
  icon: React.ReactNode;
  secondaryIcon?: React.ReactNode;
  title: string;
  description: string;
  variants: object;
  delay: number;
  direction: "left" | "right";
}

function ServiceItem({
  icon,
  secondaryIcon,
  title,
  description,
  variants,
  delay,
  direction,
}: ServiceItemProps) {
  const P = {
    navy: "#083A4F",
    gold: "#A58D66",
    aqua: "#C0D5D6",
    teal: "#407E8C",
    sand: "#E5E1DD",
    tealLight: "#EAF3F5",
  };
  return (
    <motion.div
      style={{ display: "flex", flexDirection: "column" }}
      variants={variants}
      transition={{ delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <motion.div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
        initial={{ x: direction === "left" ? -20 : 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.2 }}
      >
        <motion.div
          style={{
            color: P.teal,
            background: P.tealLight,
            padding: 12,
            borderRadius: 10,
            position: "relative",
            flexShrink: 0,
            border: `1px solid ${P.aqua}55`,
            transition: "background 0.3s",
          }}
          whileHover={{
            rotate: [0, -10, 10, -5, 0],
            transition: { duration: 0.5 },
          }}
        >
          {icon}
          {secondaryIcon}
        </motion.div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: P.navy }}>
          {title}
        </h3>
      </motion.div>
      <motion.p
        style={{
          fontSize: "0.875rem",
          color: `${P.navy}99`,
          lineHeight: 1.7,
          paddingLeft: 52,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.4 }}
      >
        {description}
      </motion.p>
    </motion.div>
  );
}

// ─── StatCounter ─────────────────────────────────────────────────────────────
interface StatCounterProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix: string;
  delay: number;
}

function StatCounter({ icon, value, label, suffix, delay }: StatCounterProps) {
  const P = {
    navy: "#083A4F",
    gold: "#A58D66",
    aqua: "#C0D5D6",
    teal: "#407E8C",
    sand: "#E5E1DD",
    sandMid: "#EDE9E4",
  };
  const countRef = useRef(null);
  const isInView = useInView(countRef, { once: false });
  const [hasAnimated, setHasAnimated] = useState(false);
  const springValue = useSpring(0, { stiffness: 50, damping: 10 });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      springValue.set(value);
      setHasAnimated(true);
    } else if (!isInView && hasAnimated) {
      springValue.set(0);
      setHasAnimated(false);
    }
  }, [isInView, value, springValue, hasAnimated]);

  const displayValue = useTransform(springValue, (v) => Math.floor(v));

  return (
    <motion.div
      style={{
        background: P.sandMid,
        backdropFilter: "blur(8px)",
        padding: "28px 20px",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        border: `1px solid ${P.aqua}44`,
        cursor: "default",
        transition: "background 0.3s",
      }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
      }}
      whileHover={{ y: -5, background: "#fff", transition: { duration: 0.2 } }}
    >
      <motion.div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: `${P.teal}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          color: P.teal,
          border: `1px solid ${P.teal}33`,
        }}
        whileHover={{ rotate: 360, transition: { duration: 0.8 } }}
      >
        {icon}
      </motion.div>
      <motion.div
        ref={countRef}
        style={{
          fontSize: "2rem",
          fontWeight: 900,
          color: P.navy,
          display: "flex",
          alignItems: "center",
        }}
      >
        <motion.span>{displayValue}</motion.span>
        <span style={{ color: P.gold }}>{suffix}</span>
      </motion.div>
      <p style={{ color: `${P.navy}88`, fontSize: "0.8rem", marginTop: 4 }}>
        {label}
      </p>
      <motion.div
        style={{
          height: 3,
          background: `linear-gradient(to right, ${P.teal}, ${P.gold})`,
          marginTop: 12,
          borderRadius: 999,
          width: 40,
        }}
        whileHover={{ width: 64, transition: { duration: 0.3 } }}
      />
    </motion.div>
  );
}
