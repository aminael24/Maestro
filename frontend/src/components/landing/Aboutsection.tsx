import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  GitBranch,
  Terminal,
  Lock,
  BarChart2,
  Rocket,
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
// On mixe clair (sand, aqua) et sombre (navy, teal) pour ne pas rester tout sombre
const P = {
  navy: "#083A4F",
  gold: "#A58D66",
  aqua: "#C0D5D6",
  teal: "#407E8C",
  sand: "#E5E1DD",
  // dérivés clairs pour le fond et les cartes
  sandLight: "#F5F2EE", // fond de section très clair
  sandMid: "#EDE9E4", // fond cards
  navyText: "#083A4F", // texte principal sur fond clair
  tealLight: "#EAF3F5", // bg icon chips
};

export default function AboutSection() {
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

  const services = [
    {
      icon: <GitBranch className="w-6 h-6" />,
      secondaryIcon: (
        <Sparkles
          className="w-4 h-4 absolute -top-1 -right-1"
          style={{ color: P.teal }}
        />
      ),
      title: "CI/CD",
      description:
        "Des pipelines automatisés de bout en bout. Chaque push déclenche build, test et déploiement sans intervention manuelle.",
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
      title: "Sécurité",
      description:
        "Scan de dépendances, authentification OIDC via Keycloak et tokens jamais exposés au navigateur grâce aux cookies HttpOnly.",
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
      title: "Workspace",
      description:
        "Un terminal centralisé pour piloter tous vos projets DevOps depuis une interface unique, claire et réactive.",
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
      title: "Secrets",
      description:
        "Vos variables d'environnement et tokens sont chiffrés, versionnés et jamais exposés dans les logs ni dans le navigateur.",
      position: "right",
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      secondaryIcon: (
        <CheckCircle
          className="w-4 h-4 absolute -top-1 -right-1"
          style={{ color: P.teal }}
        />
      ),
      title: "Monitoring",
      description:
        "Visualisez en temps réel l'état de vos pipelines, le taux de succès et les métriques de performance de vos déploiements.",
      position: "right",
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      secondaryIcon: (
        <Star
          className="w-4 h-4 absolute -top-1 -right-1"
          style={{ color: P.gold }}
        />
      ),
      title: "Deploy",
      description:
        "Déploiements zero-downtime avec rollback instantané. Votre production reste stable même lors des mises à jour critiques.",
      position: "right",
    },
  ];

  const stats = [
    { icon: <Award />, value: 500, label: "Pipelines orchestrés", suffix: "+" },
    {
      icon: <Users />,
      value: 1200,
      label: "Déploiements réussis",
      suffix: "+",
    },
    { icon: <Calendar />, value: 99, label: "Uptime garanti", suffix: "%" },
    {
      icon: <TrendingUp />,
      value: 12,
      label: "Secondes en moyenne",
      suffix: "s",
    },
  ];

  return (
    <section
      id="about"
      ref={sectionRef}
      style={{
        width: "100%",
        padding: "96px 32px",
        // fond clair sable — contraste avec le hero sombre
        background: `linear-gradient(to bottom, ${P.sandLight}, ${P.sandMid})`,
        color: P.navyText,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Blobs décoratifs — couleurs Maestro mais translucides ─────── */}
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
        {/* ── En-tête ─────────────────────────────────────────────────── */}
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
            DÉCOUVREZ NOTRE HISTOIRE
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
            maxWidth: 600,
            margin: "0 auto 64px",
            color: `${P.navyText}bb`,
            lineHeight: 1.8,
            fontSize: "1rem",
          }}
          variants={itemVariants}
        >
          Nous sommes une équipe passionnée de DevSecOps, convaincue que
          sécurité et vélocité ne sont pas opposées. Maestro est l'outil que
          nous aurions voulu avoir — puissant, clair, sans compromis.
        </motion.p>

        {/* ── Grille 3 colonnes ────────────────────────────────────────── */}
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
                {/* Mockup visuel à la place d'une photo */}
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
                  {/* mini pipeline animé */}
                  {["build", "test", "scan", "deploy"].map((step, i) => (
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
                        border: `1px solid ${i === 2 ? P.aqua : "rgba(255,255,255,0.1)"}`,
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
                      99.8%
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: `${P.sand}77`,
                        letterSpacing: "0.08em",
                      }}
                    >
                      UPTIME
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
                    Voir nos pipelines{" "}
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

              {/* Floating dots */}
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
                style2={{ y: y1 }}
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

        {/* ── Stats ───────────────────────────────────────────────────── */}
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

        {/* ── CTA banner ──────────────────────────────────────────────── */}
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
              Démarrez gratuitement, déployez en quelques secondes.
            </p>
          </div>
          <motion.button
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
      <motion.div
        style={{
          paddingLeft: 52,
          display: "flex",
          alignItems: "center",
          color: P.gold,
          fontSize: "0.78rem",
          fontWeight: 600,
          marginTop: 8,
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          En savoir plus <ArrowRight style={{ width: 12, height: 12 }} />
        </span>
      </motion.div>
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
