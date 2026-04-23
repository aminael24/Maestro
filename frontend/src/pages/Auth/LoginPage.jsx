import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import "./homepage.css";


const LibraryImage = () => (
  <div className="library-image">
    <img src="/image1.png" alt="Archive visualization" className="feature-image-full" />
  </div>
);

const PrinterImage = () => (
  <div className="printer-image">
    <img src="/image2.png" alt="Delivery visualization" className="feature-image-full" />
  </div>
);

const SentinelImage = () => (
  <div className="sentinel-image-wrap">
    <img src="/image3.png" alt="Security visualization" className="sentinel-image-full" />
  </div>
);

// ─── Animated Security/Pipeline Mockup ───────────────────────
const SecurityPipelineMockup = () => {
  const [tick, setTick] = useState(0);
  const [logs, setLogs] = useState([
    { id: 1, text: "Initializing sentinel daemon...", status: "done" },
    { id: 2, text: "Scanning dependency graph", status: "done" },
  ]);
  const [scanProgress, setScanProgress] = useState(78);
  const [threatCount, setThreatCount] = useState(0);
  const [commitHash] = useState("a3f9c2e");

  const logMessages = [
    { text: "CVE-2024-3821 — patched ✓", status: "ok" },
    { text: "Build artifact signed", status: "ok" },
    { text: "Container image verified", status: "ok" },
    { text: "Zero trust policy applied", status: "ok" },
    { text: "Secrets vault synced", status: "ok" },
    { text: "SBOM generated successfully", status: "ok" },
    { text: "Deploying to production...", status: "active" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setScanProgress(p => {
      const next = p + (Math.random() * 0.4 - 0.1);
      return Math.min(99.7, Math.max(74, next));
    });
    if (tick % 18 === 0 && logs.length < 8) {
      const next = logMessages[logs.length - 2];
      if (next) setLogs(l => [...l, { id: l.length + 1, ...next }]);
    }
    if (tick % 40 === 0) setThreatCount(c => c + Math.floor(Math.random() * 3));
  }, [tick]);

  const pipelineSteps = [
    { label: "Source", done: true },
    { label: "Build", done: true },
    { label: "Scan", active: true },
    { label: "Sign", done: false },
    { label: "Deploy", done: false },
  ];

  const threatBlocked = 1247 + threatCount;

  return (
    <div className="mockup-shell">
      {/* Top bar */}
      <div className="mockup-titlebar">
        <div className="mockup-dots">
          <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
        </div>
        <span className="mockup-title-text">archive — sentinel v2.4.1</span>
        <div className="mockup-badge live">● LIVE</div>
      </div>

      {/* Pipeline stages */}
      <div className="pipeline-track">
        {pipelineSteps.map((step, i) => (
          <div key={step.label} className="pipeline-step-wrap">
            <div className={`pipeline-node ${step.done ? "done" : step.active ? "active" : "pending"}`}>
              {step.done ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : step.active ? (
                <span className="pulse-dot" />
              ) : (
                <span className="empty-dot" />
              )}
            </div>
            <span className={`pipeline-label ${step.active ? "label-active" : ""}`}>{step.label}</span>
            {i < pipelineSteps.length - 1 && (
              <div className={`pipeline-connector ${step.done ? "connector-done" : "connector-pending"}`}>
                <div className={`connector-fill ${step.done ? "fill-done" : step.active ? "fill-active" : ""}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Scan progress */}
      <div className="scan-section">
        <div className="scan-header">
          <span className="scan-label">Security Scan</span>
          <span className="scan-pct">{scanProgress.toFixed(1)}%</span>
        </div>
        <div className="scan-bar-bg">
          <div className="scan-bar-fill" style={{ width: `${scanProgress}%` }}>
            <div className="scan-shimmer" />
          </div>
        </div>
        <div className="scan-meta">
          <span>Commit <code className="commit-hash">{commitHash}</code></span>
          <span className="threat-blocked">{threatBlocked.toLocaleString()} threats blocked</span>
        </div>
      </div>

      {/* Log feed */}
      <div className="log-feed">
        {logs.map((log) => (
          <div key={log.id} className={`log-line ${log.status === "active" ? "log-active" : ""}`}>
            <span className={`log-indicator ${log.status}`} />
            <span className="log-text">{log.text}</span>
            {log.status === "active" && <span className="log-cursor">_</span>}
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="mockup-stats">
        <div className="mstat">
          <div className="mstat-val green">99.9%</div>
          <div className="mstat-label">Uptime</div>
        </div>
        <div className="mstat-divider" />
        <div className="mstat">
          <div className="mstat-val amber">&lt; 1.8ms</div>
          <div className="mstat-label">Verify</div>
        </div>
        <div className="mstat-divider" />
        <div className="mstat">
          <div className="mstat-val gold">A+</div>
          <div className="mstat-label">Security</div>
        </div>
      </div>
    </div>
  );
};

// ─── Floating particle background ────────────────────────────
const ParticleField = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;

    const particles = Array.from({ length: 38 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.5 + 0.5, o: Math.random() * 0.35 + 0.05,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,169,106,${p.o})`;
        ctx.fill();
      });
      // draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(200,169,106,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
};

// ─── Typewriter hook ─────────────────────────────────────────
const useTypewriter = (words, speed = 80, pause = 1800) => {
  const [displayed, setDisplayed] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIdx];
    let timeout;
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx(c => c + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(c => c - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx(i => (i + 1) % words.length);
    }
    setDisplayed(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return displayed;
};

// ─── Scroll reveal hook ───────────────────────────────────────
const useScrollReveal = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
};

export default function TheArchive() {
  const navigate = useNavigate();
  const typed = useTypewriter(["Redefined.", "Reimagined.", "Elevated.", "Secured."], 90, 2000);
  const [heroRef, heroVisible] = useScrollReveal(0.05);
  const [mounted, setMounted] = useState(false);

  const handleGetStarted = () => {
    navigate('/auth/register');
  };

  const handleSignIn = () => {
    navigate('/auth/login');
  };

  const handleTalkToStrategist = () => {
    navigate('/auth/callback');
  };

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="archive-wrapper">
      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="arc-nav">
        <Link to="/" className="nav-brand">The Archive</Link>
        <ul className="nav-links">
          <li><a href="#">Product</a></li>
          <li><a href="#">Features</a></li>
          <li><a href="#">Case Studies</a></li>
          <li><a href="#">Docs</a></li>
        </ul>
        <button className="nav-cta" onClick={handleGetStarted}>Get Started</button>
      </nav>

      {/* ── ENHANCED HERO ─────────────────────────────────────── */}
      <section className="hero-section" ref={heroRef}>
        <ParticleField />

        {/* Gradient orbs */}
        <div className="orb orb-gold" />
        <div className="orb orb-green" />

        <div className={`hero-inner ${mounted ? "hero-in" : ""}`}>
          {/* LEFT */}
          <div className={`hero-left ${heroVisible ? "reveal-left" : ""}`}>
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" />
              DevSecOps Platform
            </div>
            <h1 className="hero-headline">
              DevSecOps.<br />
              <em className="typed-word">{typed}<span className="caret">|</span></em>
            </h1>
            <p className="hero-body">
              A powerful engineering control center with an editorial soul.
              Experience infrastructure management through the lens of a curated archive.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={handleGetStarted}>
                Get Started
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <Link to="/auth/login" className="btn-text">Sign In →</Link>
            </div>

            {/* Trust badges */}
            <div className="trust-row">
              <div className="trust-badge">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1L2 3v3.5c0 2.5 1.8 4.7 4 5 2.2-.3 4-2.5 4-5V3L6 1z" fill="#2C6B4A"/>
                </svg>
                SOC 2 Type II
              </div>
              <div className="trust-badge">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="5" width="10" height="6" rx="1.5" stroke="#C8A96A" strokeWidth="1.2"/>
                  <path d="M3.5 5V3.5a2.5 2.5 0 015 0V5" stroke="#C8A96A" strokeWidth="1.2"/>
                </svg>
                Zero Trust
              </div>
              <div className="trust-badge">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#8B6914" strokeWidth="1.2"/>
                  <path d="M4 6l1.5 1.5L8 4" stroke="#8B6914" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                SLSA Level 3
              </div>
            </div>
          </div>

          {/* RIGHT — mockup */}
          <div className={`hero-right ${heroVisible ? "reveal-right" : ""}`}>
            <SecurityPipelineMockup />
          </div>
        </div>
      </section>

      <div className="section-divider"/>

      {/* FEATURES */}
      <section className="features-section">

        {/* Intelligent Automation */}
        <div className="feature-block">
          <div className="feature-content">
            <div className="feature-icon">
              <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#2C6B4A"/>
                <rect x="10" y="2" width="6" height="6" rx="1.5" fill="#2C6B4A" opacity="0.5"/>
                <rect x="2" y="10" width="6" height="6" rx="1.5" fill="#2C6B4A" opacity="0.5"/>
                <rect x="10" y="10" width="6" height="6" rx="1.5" fill="#2C6B4A" opacity="0.3"/>
              </svg>
            </div>
            <h2>Intelligent Automation</h2>
            <p>
              In The Archive, every automated task isn't just a log entry — it's a
              recorded chapter. Our AI agents treat infrastructure code like fine
              literature, ensuring every version is documented, contextualized, and
              preserved with academic rigor.
            </p>
            <ul className="feature-checks">
              <li><span className="check-dot"/><span>Context-aware agent logic</span></li>
              <li><span className="check-dot"/><span>Semantic versioning of infrastructure intent</span></li>
            </ul>
          </div>
          <LibraryImage />
        </div>

        <div className="section-divider"/>

        {/* Continuous Delivery */}
        <div className="feature-block reverse">
          <div className="feature-content">
            <div className="feature-icon">
              <svg viewBox="0 0 18 18" fill="none">
                <path d="M2 9h14M9 2l7 7-7 7" stroke="#2C6B4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Continuous Delivery</h2>
            <p>
              Deployments are milestones, not just events. We've refined the CI/CD
              pipeline into a curated gallery of progress, where each release candidate
              is analyzed for aesthetic stability and functional excellence before it
              enters the production archive.
            </p>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-value">99.9%</div>
                <div className="stat-label">Reliability Threshold</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">&lt; 2ms</div>
                <div className="stat-label">Verification Speed</div>
              </div>
            </div>
          </div>
          <PrinterImage />
        </div>

      </section>

      <div className="section-divider"/>

      {/* SENTINEL */}
      <section className="sentinel-block">
        <div className="sentinel-content">
          <div className="sentinel-icon">
            <svg viewBox="0 0 18 18" width="18" height="18" fill="none">
              <path d="M9 2L3 5v5c0 3.5 2.5 6.5 6 7 3.5-.5 6-3.5 6-7V5L9 2z" fill="rgba(255,255,255,0.7)"/>
            </svg>
          </div>
          <h2>The Sentinel</h2>
          <p>
            Integrated threat modeling is the foundation of everything we build.
            The Sentinel monitors your infrastructure with the watchful eye of a
            seasoned curator, identifying vulnerabilities before they can tarnish
            the integrity of your collection.
          </p>
          <button className="btn-outline-light" onClick={handleTalkToStrategist}>
            Explore the Security Charter
            <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
              <path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <SentinelImage />
      </section>

      <div className="section-divider"/>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to begin your collection?</h2>
        <blockquote>
          "Great engineering is the art of organizing complexity into a beautiful,
          functional archive."
        </blockquote>
        <div className="cta-buttons">
          <button className="btn-dark" onClick={handleGetStarted}>Start Building for Free</button>
          <button className="btn-ghost" onClick={handleSignIn}>Sign In</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-brand">The Archive</div>
            <div className="footer-tagline">
              A SANCTUARY FOR MODERN<br />
              ENGINEERING. BUILT FOR THE<br />
              INTELLECTUAL DEVELOPER.
            </div>
          </div>
          <div className="footer-col">
            <h4>Navigation</h4>
            <ul>
              <li><Link to="/auth/login">Privacy Charter</Link></li>
              <li><a href="#">System Status</a></li>
              <li><a href="#">Security Whitepaper</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Institutional</h4>
            <ul>
              <li><a href="#">Institutional Access</a></li>
              <li><a href="#">Ethics Statement</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <div className="footer-email">
              hello@thearchive.io
            </div>
            <div className="footer-social">
              <div className="social-icon">
                <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
                  <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" fill="#5a5a52"/>
                </svg>
              </div>
              <div className="social-icon">
                <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
                  <rect x="2" y="2" width="10" height="10" rx="2" stroke="#5a5a52" strokeWidth="1.2"/>
                  <circle cx="7" cy="7" r="2" stroke="#5a5a52" strokeWidth="1.2"/>
                  <circle cx="10" cy="4" r="0.8" fill="#5a5a52"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © 2024 The Archive. All rights reserved. Built for the intellectual developer.
        </div>
      </footer>
    </div>
  );
}