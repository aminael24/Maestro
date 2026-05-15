"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import aminaImg from "../../assets/amina.png";
import douaeImg from "../../assets/douae.png";
import oumniyaImg from "../../assets/oumniya.png";
import tasnimImg from "../../assets/tasnim.png";
import salmaImg from "../../assets/salma.png";

/* ═══════════════════════════════════════════════════
   FONCTION DE CALCUL DU GAP (RESPONSIVE)
══════════════════════════════════════════════════════ */
function calculateGap(width) {
  const minWidth = 1024;
  const maxWidth = 1456;
  const minGap = 60;
  const maxGap = 86;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth)
    return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return (
    minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth))
  );
}

/* ════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL : TEAMSECTION
════════════════════════════════════════════════════════════ */
export const TeamSection = ({ autoplay = true }) => {
  // Votre palette de couleurs officielle
  const colors = {
    navy: "#083A4F",
    gold: "#A58D66",
    teal: "#407E8C",
    sand: "#E5E1DD",
    aqua: "#C0D5D6",
    darkBg: "#040e14",
  };

  const teamMembers = [
    {
      name: "Salma Marzouk",
      designation: "Agent IA & Runner Service",
      bio: "Architecte du cerveau de Maestro. Conçoit l'agent IA dialoguant avec Groq LLaMA 3.1 et orchestre le Runner Service sous Docker pour exécuter le code , et le terminal SSE et la design page interactive.",
      tags: ["Python", "FastAPI", "LLM", "Docker"],
      src: salmaImg,
    },
    {
      name: "Amina El Haddad",
      designation: "API Gateway & Auth",
      bio: "Garant de la sécurité. Développe l'API Gateway en ASP.NET Core et intègre Keycloak (OIDC + PKCE) pour l'authentification et la gestion des routes  .",
      tags: ["C#", "ASP.NET", "Keycloak", "OIDC"],
      src: aminaImg,
    },
    {
      name: "Oumniya El abaid",
      designation: "Workspace Service",
      bio: "Responsable de l'organisation des projets. Développe le Workspace Service avec PostgreSQL pour gérer les fichiers utilisateurs et le dashboard interactif.",
      tags: ["C#", "PostgreSQL", "REST API", "ASP.NET"],
      src: oumniyaImg,
    },
    {
      name: "Tasnim Chaoui",
      designation: "Github Service",
      bio: "Responsable de l'intégration continue. Développe le service Github pour l'automatisation des workflows et la gestion des pull requests.",
      tags: ["React 18", "Vite", "Zustand", "Tailwind"],
      src: tasnimImg,
    },
    {
      name: "Douae Rajei",
      designation: "Infrastructure & Kafka",
      bio: "Ingénieure infrastructure. Orchestre Docker Compose et configure Apache Kafka pour la messagerie inter-services du projet.",
      tags: ["Docker", "Kafka", "Zookeeper", "DevOps"],
      src: douaeImg,
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);

  const imageContainerRef = useRef(null);
  const autoplayIntervalRef = useRef(null);
  const teamLength = teamMembers.length;
  const activeMember = teamMembers[activeIndex];

  // Gestion du redimensionnement pour les animations
  useEffect(() => {
    function handleResize() {
      if (imageContainerRef.current)
        setContainerWidth(imageContainerRef.current.offsetWidth);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Autoplay du carousel
  useEffect(() => {
    if (autoplay) {
      autoplayIntervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % teamLength);
      }, 6000);
    }
    return () => {
      if (autoplayIntervalRef.current)
        clearInterval(autoplayIntervalRef.current);
    };
  }, [autoplay, teamLength]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % teamLength);
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
  }, [teamLength]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + teamLength) % teamLength);
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
  }, [teamLength]);

  function getImageStyle(index) {
    const gap = calculateGap(containerWidth);
    const maxStickUp = gap * 0.8;
    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + teamLength) % teamLength === index;
    const isRight = (activeIndex + 1) % teamLength === index;

    if (isActive)
      return {
        zIndex: 3,
        opacity: 1,
        transform: `translateX(0px) translateY(0px) scale(1) rotateY(0deg)`,
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
      };
    if (isLeft)
      return {
        zIndex: 2,
        opacity: 0.4,
        transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(15deg)`,
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
      };
    if (isRight)
      return {
        zIndex: 2,
        opacity: 0.4,
        transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(-15deg)`,
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
      };
    return {
      zIndex: 1,
      opacity: 0,
      transform: "scale(0.5)",
      transition: "all 0.8s",
    };
  }

  return (
    <section className="team-section">
      <div className="team-container">
        {/* En-tête avec titres adaptés */}
        <div className="team-header">
          <h4 style={{ color: colors.gold }}>L'ÉQUIPE FONDATRICE</h4>
          <h2 style={{ color: colors.sand }}>Les esprits derrière Maestro</h2>
          <p style={{ color: colors.aqua }}>
            Étudiants en Génie Informatique à l'ENSA Tanger
          </p>
        </div>

        <div className="team-grid">
          {/* Bloc Images (Gauche) */}
          <div className="image-container" ref={imageContainerRef}>
            {teamMembers.map((member, index) => (
              <img
                key={index}
                src={member.src}
                alt={member.name}
                className="member-image"
                style={{
                  ...getImageStyle(index),
                  border: `3px solid ${index === activeIndex ? colors.gold : "transparent"}`,
                }}
              />
            ))}
          </div>

          {/* Bloc Infos (Droite) */}
          <div className="team-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h2 className="member-name" style={{ color: colors.gold }}>
                  {activeMember.name}
                </h2>
                <p className="member-role" style={{ color: colors.aqua }}>
                  {activeMember.designation}
                </p>

                <div className="bio-text" style={{ color: colors.sand }}>
                  {activeMember.bio}
                </div>

                {/* Badges Technos Teal/Aqua */}
                <div className="tags-container">
                  {activeMember.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="tech-tag"
                      style={{
                        border: `1px solid ${colors.teal}`,
                        color: colors.aqua,
                        background: "rgba(58, 183, 211, 0.1)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Contrôles Navy/Gold */}
            <div className="nav-controls">
              <button
                className="nav-btn"
                onClick={handlePrev}
                onMouseEnter={() => setHoverPrev(true)}
                onMouseLeave={() => setHoverPrev(false)}
                style={{
                  backgroundColor: hoverPrev ? colors.teal : colors.navy,
                  border: `1px solid ${colors.gold}`,
                }}
              >
                <FaArrowLeft color={colors.sand} size={18} />
              </button>
              <button
                className="nav-btn"
                onClick={handleNext}
                onMouseEnter={() => setHoverNext(true)}
                onMouseLeave={() => setHoverNext(false)}
                style={{
                  backgroundColor: hoverNext ? colors.teal : colors.navy,
                  border: `1px solid ${colors.gold}`,
                }}
              >
                <FaArrowRight color={colors.sand} size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .team-section {
          background-color: #1e4c68; /* Fond Ultra sombre pour le contraste */
          padding: 100px 20px;
          overflow: hidden;
        }
        .team-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .team-header {
          text-align: center;
          margin-bottom: 80px;
        }
        .team-header h4 {
          letter-spacing: 4px;
          font-size: 0.8rem;
          margin-bottom: 10px;
          font-family: sans-serif;
        }
        .team-header h2 {
          font-size: 2.8rem;
          font-weight: 800;
          margin: 0;
          font-family: serif;
        }
        .team-header p {
          margin-top: 10px;
          font-size: 1.1rem;
          opacity: 0.8;
        }
        .team-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6rem;
          align-items: center;
        }
        .image-container {
          position: relative;
          height: 380px;
          width: 100%;
          perspective: 1200px;
        }
        .member-image {
          position: absolute;
          left: 0;
          right: 0;
          margin: auto;
          width: 260px;
          height: 350px;
          object-fit: cover;
          border-radius: 15px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
        }
        .team-content {
          text-align: left;
        }
        .member-name {
          font-size: 2.4rem;
          font-weight: 800;
          margin-bottom: 5px;
          font-family: serif;
        }
        .member-role {
          font-size: 1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 25px;
        }
        .bio-text {
          font-size: 1.15rem;
          line-height: 1.8;
          margin-bottom: 30px;
          max-width: 480px;
          opacity: 0.9;
        }
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .tech-tag {
          font-size: 0.75rem;
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 600;
        }
        .nav-controls {
          display: flex;
          gap: 1.2rem;
          margin-top: 45px;
        }
        .nav-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (min-width: 992px) {
          .team-grid {
            grid-template-columns: 1fr 1fr;
          }
          .member-image {
            width: 320px;
            height: 420px;
          }
          .image-container {
            height: 450px;
          }
        }
      `}</style>
    </section>
  );
};

export default TeamSection;
