"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- COMPOSANT ICÔNE SOCIALE (REVEAL) ---
const SocialIconReveal = ({ icon, name, url, id }) => {
  const svgRef = useRef(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (svgRef.current && hovered) {
      const updateCursor = (e) => {
        const svgRect = svgRef.current.getBoundingClientRect();
        setMaskPosition({
          cx: `${((e.clientX - svgRect.left) / svgRect.width) * 100}%`,
          cy: `${((e.clientY - svgRect.top) / svgRect.height) * 100}%`,
        });
      };
      window.addEventListener("mousemove", updateCursor);
      return () => window.removeEventListener("mousemove", updateCursor);
    }
  }, [hovered]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ position: "relative", display: "inline-block" }}
    >
      <svg
        ref={svgRef}
        width="45"
        height="45"
        viewBox="0 0 100 100"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: "pointer" }}
      >
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A58D66" />
            <stop offset="100%" stopColor="#C0D5D6" />
          </linearGradient>
          <motion.radialGradient
            id={`mask-${id}`}
            r="35%"
            animate={maskPosition}
            transition={{ duration: 0.1 }}
          >
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </motion.radialGradient>
          <mask id={`textMask-${id}`}>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill={`url(#mask-${id})`}
            />
          </mask>
        </defs>
        <g style={{ opacity: hovered ? 0.2 : 1, transition: "0.3s" }}>
          <path
            d={icon}
            fill="#083A4F"
            transform="translate(25, 25) scale(2)"
          />
        </g>
        <g mask={`url(#textMask-${id})`}>
          <path
            d={icon}
            fill={`url(#grad-${id})`}
            transform="translate(25, 25) scale(2)"
          />
        </g>
      </svg>
    </a>
  );
};

// --- COMPOSANT TEXTE MAESTRO AVEC EFFET REVEAL ---
const MaestroRevealText = ({ text }) => {
  const svgRef = useRef(null);
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setCursor({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: "100%", cursor: "default", userSelect: "none" }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 800 200"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="maestroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A58D66" />
            <stop offset="50%" stopColor="#C0D5D6" />
            <stop offset="100%" stopColor="#407E8C" />
          </linearGradient>

          <motion.radialGradient
            id="maestroMaskGrad"
            r="15%"
            animate={{ cx: `${cursor.x}%`, cy: `${cursor.y}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          >
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </motion.radialGradient>

          <mask id="maestroMask">
            <rect width="100%" height="100%" fill="url(#maestroMaskGrad)" />
          </mask>
        </defs>

        {/* Texte en arrière-plan (Contour vide) */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: "150px",
            fontWeight: "900",
            fill: "transparent",
            stroke: "#083A4F",
            strokeWidth: "1",
            opacity: 0.1,
          }}
        >
          {text}
        </text>

        {/* Texte révélé par le dégradé au survol */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          mask="url(#maestroMask)"
          style={{
            fontSize: "150px",
            fontWeight: "900",
            fill: "url(#maestroGrad)",
            transition: "opacity 0.3s",
          }}
        >
          {text}
        </text>
      </svg>
    </div>
  );
};

// --- FOOTER COMPLET ---
const MaestroFooter = () => {
  const socialIcons = [
    {
      id: "gh",
      name: "GitHub",
      url: "#",
      icon: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z",
    },
    {
      id: "li",
      name: "LinkedIn",
      url: "#",
      icon: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v5.759z",
    },
  ];

  const styles = {
    footer: {
      padding: "80px 20px 40px",
      backgroundColor: "#f8f9fa",
      color: "#083A4F",
      fontFamily: "sans-serif",
    },
    grid: {
      maxWidth: "1200px",
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "50px",
    },
    h3: { fontSize: "18px", marginBottom: "20px", fontWeight: "bold" },
    link: {
      display: "block",
      color: "#407E8C",
      textDecoration: "none",
      marginBottom: "12px",
      fontSize: "14px",
    },
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.grid}>
        <div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "900",
              marginBottom: "15px",
            }}
          >
            MAESTRO
          </h2>
          <p style={{ fontSize: "14px", color: "#407E8C", lineHeight: "1.6" }}>
            L'harmonie technologique au service de vos projets. Maestro crée des
            expériences fluides et durables.
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            {socialIcons.map((s) => (
              <SocialIconReveal key={s.id} {...s} />
            ))}
          </div>
        </div>

        <div>
          <h3 style={styles.h3}>Navigation</h3>
          <a href="#" style={styles.link}>
            Services
          </a>
          <a href="#" style={styles.link}>
            Portfolio
          </a>
          <a href="#" style={styles.link}>
            Blog
          </a>
        </div>

        <div>
          <h3 style={styles.h3}>Support</h3>
          <a href="#" style={styles.link}>
            Centre d'aide
          </a>
          <a href="#" style={styles.link}>
            Confidentialité
          </a>
          <a href="#" style={styles.link}>
            Conditions
          </a>
        </div>

        <div>
          <h3 style={styles.h3}>Contact</h3>
          <p style={{ fontSize: "14px", color: "#407E8C" }}>
            Casablanca, Maroc
          </p>
          <p style={{ fontSize: "14px", color: "#407E8C", marginTop: "10px" }}>
            contact@maestro.io
          </p>
        </div>
      </div>

      {/* --- LE GRAND NOM MAESTRO AVEC L'ANIMATION DE RÉVÉLATION --- */}
      <div
        style={{
          marginTop: "40px",
          borderTop: "1px solid rgba(8, 58, 79, 0.1)",
        }}
      >
        <MaestroRevealText text="MAESTRO" />
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: "12px",
          color: "#C0D5D6",
          marginTop: "20px",
        }}
      >
        © 2026 Maestro. Built with passion and water.
      </p>
    </footer>
  );
};

export default MaestroFooter;
