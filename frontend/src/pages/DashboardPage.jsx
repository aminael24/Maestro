import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { projectService } from "../services/projectService";
import { getMe } from "../services/authService";
import "./DashboardPage.css";

// ─── Palette ──────────────────────────────────────────────────────────────
const C = {
  teal:  "#407E8C",
  gold2: "#c4aa80",
  aqua:  "#C0D5D6",
  green: "#4ade80",
  amber: "#fbbf24",
  red:   "#f87171",
  fe:    "#4fc3f7",
  be:    "#ffd54f",
  fs:    "#407E8C",
};

// ─── Données statiques ─────────────────────────────────────────────────────
const AI_WEEK = [
  { day: "Lun", generate: 120, chat: 48  },
  { day: "Mar", generate: 145, chat: 62  },
  { day: "Mer", generate:  98, chat: 55  },
  { day: "Jeu", generate: 167, chat: 80  },
  { day: "Ven", generate: 134, chat: 71  },
  { day: "Sam", generate:  88, chat: 40  },
  { day: "Dim", generate: 138, chat: 64  },
];

const RUNNER_24H = [
  { time: "08:00", duration: 28 }, { time: "08:30", duration: 32 },
  { time: "09:00", duration: 22 }, { time: "09:30", duration: 25 },
  { time: "10:00", duration: 19 }, { time: "10:30", duration: 31 },
  { time: "11:00", duration: 27 }, { time: "11:30", duration: 24 },
  { time: "12:00", duration: 18 }, { time: "12:30", duration: 29 },
];

const LATENCY = [820, 640, 1800, 780, 520, 690, 1100, 740, 480, 900, 1420, 610];
const LATENCY_LABELS = ["0m","5m","10m","15m","20m","25m","30m","35m","40m","45m","50m","55m"];

const SUCCESS_DATA = [
  { name: "Succès",  value: 89, color: C.green },
  { name: "Erreur",  value:  8, color: C.red   },
  { name: "Timeout", value:  3, color: C.amber },
];

const LOGS = [
  { icon: "🚀", name: "Déploiement Fullstack réussi",  desc: "project-alpha — backend:3001 / frontend:5174", status: "success", time: "10:42" },
  { icon: "🤖", name: "Code généré — /generate",        desc: "Express + React + PostgreSQL",                 status: "ok",      time: "10:38" },
  { icon: "⚠️", name: "Vite compilation lente",         desc: "project-beta — dépasse 15s",                  status: "warning", time: "09:15" },
  { icon: "🐳", name: "PostgreSQL démarré",             desc: "postgres-project-delta — port 5432",           status: "success", time: "08:55" },
  { icon: "❌", name: "Erreur runner",                  desc: "npm install failed — réseau",                  status: "error",   time: "08:12" },
];

const HEALTH = [
  { label: "AI Service (FastAPI)",   state: "actif",     cls: "hb-green" },
  { label: "Runner (ASP.NET)",       state: "actif",     cls: "hb-green" },
  { label: "Docker orchestrator",    state: "prêt",      cls: "hb-green" },
  { label: "PostgreSQL",             state: "running",   cls: "hb-green" },
  { label: "Vite (frontend build)",  state: "compiling", cls: "hb-amber" },
];

const RESOURCES = [
  { label: "CPU AI Service",         pct: 68, color: C.teal  },
  { label: "Mémoire Runner",         pct: 42, color: C.gold2 },
  { label: "Stockage /app/projects", pct: 31, color: C.aqua  },
];

const STATUS_MAP = {
  active:    { cls: "db-badge-green", label: "Actif"      },
  pending:   { cls: "db-badge-amber", label: "En attente" },
  completed: { cls: "db-badge-gray",  label: "Terminé"    },
};
const TYPE_ICON = { Frontend: "⚛️", Backend: "⚙️", Fullstack: "🧩" };
const fmtDate = d => d
  ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  : "—";
const runnerColor = v => v > 28 ? C.red : v > 23 ? C.amber : C.green;

// ─── SVG Bar Chart (stacked) ───────────────────────────────────────────────
function BarChartSVG({ data, keys, colors, labelKey, height = 180 }) {
  const W = 560, H = height, padL = 28, padB = 22, padR = 8, padT = 8;
  const plotW = W - padL - padR;
  const plotH = H - padB - padT;
  const maxVal = Math.max(...data.map(d => keys.reduce((s, k) => s + (d[k] || 0), 0)));
  const barW = (plotW / data.length) * 0.55;
  const barGap = plotW / data.length;
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      {/* Grid lines */}
      {yTicks.map(t => {
        const y = padT + plotH - (t / maxVal) * plotH;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(192,213,214,.08)" strokeWidth="1" />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={9} fill="rgba(192,213,214,.4)" fontFamily="DM Sans, sans-serif">{t}</text>
          </g>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const x = padL + i * barGap + (barGap - barW) / 2;
        let stackY = padT + plotH;
        return (
          <g key={i}>
            {keys.map((k, ki) => {
              const val = d[k] || 0;
              const barH = (val / maxVal) * plotH;
              stackY -= barH;
              const rx = ki === keys.length - 1 ? 3 : 0;
              return (
                <rect key={k} x={x} y={stackY} width={barW} height={barH}
                  fill={colors[ki]} rx={rx} opacity={0.9}>
                  <title>{k}: {val}</title>
                </rect>
              );
            })}
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={9}
              fill="rgba(192,213,214,.4)" fontFamily="DM Sans, sans-serif">
              {d[labelKey]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Bar Chart (single, colored per value) ────────────────────────────
function BarChartSingle({ data, valueKey, labelKey, colorFn, height = 155, suffix = "" }) {
  const W = 560, H = height, padL = 28, padB = 22, padR = 8, padT = 8;
  const plotW = W - padL - padR;
  const plotH = H - padB - padT;
  const maxVal = Math.max(...data.map(d => d[valueKey]));
  const barW = (plotW / data.length) * 0.6;
  const barGap = plotW / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      {[0, Math.round(maxVal / 2), maxVal].map(t => {
        const y = padT + plotH - (t / maxVal) * plotH;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(192,213,214,.08)" strokeWidth="1" />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={9} fill="rgba(192,213,214,.4)" fontFamily="DM Sans, sans-serif">{t}{suffix}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const val = d[valueKey];
        const barH = (val / maxVal) * plotH;
        const x = padL + i * barGap + (barGap - barW) / 2;
        const y = padT + plotH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={colorFn(val)} rx={3} opacity={0.9}>
              <title>{d[labelKey]}: {val}{suffix}</title>
            </rect>
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={8}
              fill="rgba(192,213,214,.4)" fontFamily="DM Sans, sans-serif">
              {d[labelKey]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Area Chart ────────────────────────────────────────────────────────
function AreaChartSVG({ data, labels, color, height = 155, suffix = "" }) {
  const W = 560, H = height, padL = 36, padB = 22, padR = 8, padT = 8;
  const plotW = W - padL - padR;
  const plotH = H - padB - padT;
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const pts = data.map((v, i) => ({
    x: padL + (i / (data.length - 1)) * plotW,
    y: padT + plotH - ((v - minVal) / range) * plotH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L${pts[pts.length - 1].x.toFixed(1)},${(padT + plotH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

  const yTicks = [minVal, Math.round((minVal + maxVal) / 2), maxVal];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      {yTicks.map(t => {
        const y = padT + plotH - ((t - minVal) / range) * plotH;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(192,213,214,.08)" strokeWidth="1" />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={9} fill="rgba(192,213,214,.4)" fontFamily="DM Sans, sans-serif">{t}{suffix}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => (
        i % 3 === 0 && (
          <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize={8}
            fill="rgba(192,213,214,.35)" fontFamily="DM Sans, sans-serif">
            {labels[i]}
          </text>
        )
      ))}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} opacity={0.7}>
          <title>{labels[i]}: {data[i]}{suffix}</title>
        </circle>
      ))}
    </svg>
  );
}

// ─── SVG Donut Chart ───────────────────────────────────────────────────────
function DonutSVG({ data, size = 140, center }) {
  const r = 46, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(192,213,214,.07)" strokeWidth="12" />
      {data.map((d, i) => {
        const dash = (d.value / total) * circ;
        const seg = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={d.color} strokeWidth="12"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity={0.9}
          >
            <title>{d.name}: {d.value}{d.pct ? "%" : ""}</title>
          </circle>
        );
        offset += dash;
        return seg;
      })}
      {center}
    </svg>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const [user,     setUser]     = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [visible,  setVisible]  = useState(false);

  useEffect(() => {
    Promise.all([getMe(), projectService.getProjects()])
      .then(([u, p]) => { setUser(u); setProjects(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
    setTimeout(() => setVisible(true), 50);
  }, []);

  const total     = projects.length;
  const active    = projects.filter(p => p.status === "active").length;
  const pending   = projects.filter(p => p.status === "pending").length;
  const completed = projects.filter(p => p.status === "completed").length;

  const byType = {
    Frontend:  projects.filter(p => p.type === "Frontend").length,
    Backend:   projects.filter(p => p.type === "Backend").length,
    Fullstack: projects.filter(p => p.type === "Fullstack").length,
  };
  const PIE_DATA = [
    { name: "Frontend",  value: byType.Frontend  || 1, color: C.fe },
    { name: "Backend",   value: byType.Backend   || 1, color: C.be },
    { name: "Fullstack", value: byType.Fullstack || 1, color: C.fs },
  ];

  const filtered = filter === "all"
    ? projects
    : projects.filter(p => p.status === filter);

  if (loading) return (
    <div className="db-root" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div className="db-loading">
        <span className="db-loading-dot" />
        <span className="db-loading-dot" style={{ animationDelay: ".15s" }} />
        <span className="db-loading-dot" style={{ animationDelay: ".3s" }} />
      </div>
    </div>
  );

  return (
    <div className="db-root">
      <div className="db-orb db-orb-1" />
      <div className="db-orb db-orb-2" />
      <div className="db-grid-overlay" />

      <div className={`db-inner${visible ? " db-in" : ""}`}>

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <div className="db-header">
          <div>
            <div className="db-eyebrow">
              <span className="db-eyebrow-dot" />
              Centre de Contrôle
            </div>
            <h1 className="db-title">
              Bon retour,&nbsp;
              <span className="db-title-gold">{user?.firstName || "Utilisateur"}</span>
            </h1>
            <p className="db-subtitle">
              {active} projet{active !== 1 ? "s" : ""} actif{active !== 1 ? "s" : ""} ·{" "}
              {total} au total · Tous les services opérationnels
            </p>
          </div>
          <button className="db-btn-new" onClick={() => navigate("/workspace/projects")}>
            + Nouveau projet
          </button>
        </div>

        {/* ══ KPIs ════════════════════════════════════════════ */}
        <div className="db-kpi-row">
          {[
            { label: "Projets actifs",    value: active,  sub: `${pending} en attente · ${completed} terminés`, subColor: C.aqua   },
            { label: "Requêtes AI (24h)", value: "247",   sub: "+18.4% vs hier",   subColor: C.green  },
            { label: "Exécutions Runner", value: "38",    sub: "+6 aujourd'hui",   subColor: C.green  },
            { label: "Déploiement moy.",  value: "24 s",  sub: "+2s vs hier",      subColor: C.amber  },
          ].map((k, i) => (
            <div className="db-kpi" key={k.label} style={{ animationDelay: `${.1 + i * .07}s` }}>
              <div className="db-kpi-label">{k.label}</div>
              <div className="db-kpi-value">{k.value}</div>
              <div className="db-kpi-sub" style={{ color: k.subColor }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ══ ROW 2 : AI bar + Donut projets ═════════════════ */}
        <div className="db-row db-row-2" style={{ animationDelay: ".25s" }}>

          <div className="db-card">
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">AI Service — Requêtes (7 jours)</div>
                <div className="db-card-sub">Endpoints /generate et /chat combinés</div>
              </div>
              <span className="db-badge db-badge-green">
                <span className="db-live-dot" /> Opérationnel
              </span>
            </div>
            <BarChartSVG
              data={AI_WEEK}
              keys={["generate", "chat"]}
              colors={[C.teal, C.gold2]}
              labelKey="day"
              height={190}
            />
            <div className="db-chart-legend">
              <span className="db-leg"><span className="db-leg-sq" style={{ background: C.teal }} />/generate</span>
              <span className="db-leg"><span className="db-leg-sq" style={{ background: C.gold2 }} />/chat</span>
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">Répartition projets</div>
                <div className="db-card-sub">Par type de stack</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 12px" }}>
              <DonutSVG
                data={PIE_DATA}
                size={150}
                center={
                  <>
                    <text x={75} y={70} textAnchor="middle" fontSize={22} fontWeight={700} fontFamily="Syne, sans-serif" fill="#C0D5D6">{total}</text>
                    <text x={75} y={87} textAnchor="middle" fontSize={11} fontFamily="DM Sans, sans-serif" fill="rgba(192,213,214,.4)">projets</text>
                  </>
                }
              />
            </div>
            {PIE_DATA.map(d => (
              <div className="db-leg-row" key={d.name}>
                <span className="db-leg"><span className="db-leg-sq" style={{ background: d.color }} />{d.name}</span>
                <strong style={{ color: "#C0D5D6" }}>{d.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* ══ ROW 3 : Runner + Santé + Succès donut ══════════ */}
        <div className="db-row db-row-3" style={{ animationDelay: ".35s" }}>

          <div className="db-card">
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">Runner — Durée déploiements (24h)</div>
                <div className="db-card-sub">Temps d'exécution en secondes</div>
              </div>
              <span className="db-badge db-badge-blue">SSE actif</span>
            </div>
            <BarChartSingle
              data={RUNNER_24H}
              valueKey="duration"
              labelKey="time"
              colorFn={runnerColor}
              height={155}
              suffix="s"
            />
            <div className="db-chart-legend">
              <span className="db-leg"><span className="db-leg-sq" style={{ background: C.green }} />≤ 23s</span>
              <span className="db-leg"><span className="db-leg-sq" style={{ background: C.amber }} />24–28s</span>
              <span className="db-leg"><span className="db-leg-sq" style={{ background: C.red }} />&gt; 28s</span>
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">Infrastructure</div>
                <div className="db-card-sub">Services Maestro</div>
              </div>
              <span className="db-badge db-badge-green"><span className="db-live-dot" /> 98%</span>
            </div>
            <div className="db-health-list">
              {HEALTH.map(h => (
                <div className="db-health-row" key={h.label}>
                  <span className="db-health-lbl">{h.label}</span>
                  <span className={`db-hb ${h.cls}`}>{h.state}</span>
                </div>
              ))}
            </div>
            <div className="db-stat-row">
              <div className="db-stat"><div className="db-stat-n">3/3</div><div className="db-stat-l">Services</div></div>
              <div className="db-stat"><div className="db-stat-n">{total}</div><div className="db-stat-l">Projets</div></div>
              <div className="db-stat"><div className="db-stat-n">{active}</div><div className="db-stat-l">Actifs</div></div>
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">Taux de succès Runner</div>
                <div className="db-card-sub">Déploiements réussis / total</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 12px" }}>
              <DonutSVG
                data={SUCCESS_DATA.map(d => ({ ...d, pct: true }))}
                size={140}
                center={
                  <>
                    <text x={70} y={66} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily="Syne, sans-serif" fill="#4ade80">89%</text>
                    <text x={70} y={82} textAnchor="middle" fontSize={10} fontFamily="DM Sans, sans-serif" fill="rgba(192,213,214,.4)">succès</text>
                  </>
                }
              />
            </div>
            {SUCCESS_DATA.map(d => (
              <div className="db-leg-row" key={d.name}>
                <span className="db-leg"><span className="db-leg-sq" style={{ background: d.color }} />{d.name}</span>
                <strong style={{ color: "#C0D5D6" }}>{d.value}%</strong>
              </div>
            ))}
          </div>
        </div>

        {/* ══ ROW 4 : Logs + Latence & ressources ════════════ */}
        <div className="db-row db-row-2" style={{ animationDelay: ".45s" }}>

          <div className="db-card db-terminal-card">
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">Activité système récente</div>
                <div className="db-card-sub">Derniers événements Runner &amp; AI</div>
              </div>
              <span className="db-badge db-badge-green"><span className="db-live-dot" /> En direct</span>
            </div>
            <div className="db-log-list">
              {LOGS.map((l, i) => (
                <div className="db-log-row" key={i} style={{ animationDelay: `${.5 + i * .08}s` }}>
                  <div className="db-log-icon">{l.icon}</div>
                  <div className="db-log-body">
                    <div className="db-log-name">{l.name}</div>
                    <div className="db-log-desc">{l.desc}</div>
                  </div>
                  <span className={`db-badge ${
                    l.status === "success" ? "db-badge-green"
                    : l.status === "ok"    ? "db-badge-blue"
                    : l.status === "warning" ? "db-badge-amber"
                    : "db-badge-red"
                  }`}>
                    {l.status === "success" ? "succès" : l.status === "ok" ? "ok" : l.status === "warning" ? "warning" : "erreur"}
                  </span>
                  <span className="db-log-time">{l.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">Latence AI Service</div>
                <div className="db-card-sub">Temps de réponse /generate — dernière heure</div>
              </div>
            </div>
            <AreaChartSVG
              data={LATENCY}
              labels={LATENCY_LABELS}
              color={C.teal}
              height={155}
              suffix="ms"
            />
            <div className="db-lat-stats">
              {[["Moy.", "780 ms"], ["P95", "1 420 ms"], ["Max", "1 800 ms"]].map(([l, v]) => (
                <div className="db-lat-stat" key={l}><span>{l}</span><strong>{v}</strong></div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              {RESOURCES.map(r => (
                <div key={r.label} style={{ marginBottom: 10 }}>
                  <div className="db-prog-hdr"><span>{r.label}</span><strong>{r.pct}%</strong></div>
                  <div className="db-prog-track">
                    <div className="db-prog-fill" style={{ width: `${r.pct}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ TABLE PROJETS ════════════════════════════════════ */}
        <div className="db-card db-table-card" style={{ animationDelay: ".55s" }}>
          <div className="db-table-hdr">
            <h3 className="db-table-title">Mes projets</h3>
            <div className="db-filter-tabs">
              {["all", "active", "pending", "completed"].map(f => (
                <button
                  key={f}
                  className={`db-tab${filter === f ? " db-tab-active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "Tous" : STATUS_MAP[f]?.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="db-empty">
              {total === 0 ? "Aucun projet — créez votre premier projet !" : "Aucun projet dans cette catégorie."}
            </div>
          ) : (
            <table className="db-proj-table">
              <thead>
                <tr><th>Projet</th><th>Type</th><th>Statut</th><th>Échéance</th><th /></tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const meta = STATUS_MAP[p.status] || STATUS_MAP.pending;
                  return (
                    <tr key={p.id} onClick={() => navigate(`/workspace/projects/${p.id}`)}>
                      <td>
                        <div className="db-proj-cell">
                          <div className="db-proj-icon">{TYPE_ICON[p.type] || "📁"}</div>
                          <div>
                            <div className="db-proj-name">{p.name}</div>
                            <div className="db-proj-desc">{p.description || "Aucune description"}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="db-type-lbl">{p.type || "—"}</span></td>
                      <td><span className={`db-badge ${meta.cls}`}>{meta.label}</span></td>
                      <td className="db-date">{fmtDate(p.dueDate)}</td>
                      <td>
                        <button
                          className="db-edit-btn"
                          onClick={e => { e.stopPropagation(); navigate(`/workspace/projects/${p.id}`); }}
                          title="Ouvrir l'éditeur"
                        >✎</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {total === 0 && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button className="db-btn-new" onClick={() => navigate("/workspace/projects")}>
                + Créer un projet
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
