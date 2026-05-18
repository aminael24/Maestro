import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectService } from "../services/projectService";
import { getMe } from "../services/authService";
import "./DashboardPage.css";

const C = {
  teal:  "#407E8C",
  gold2: "#c4aa80",
  aqua:  "#C0D5D6",
  green: "#4ade80",
  amber: "#fbbf24",
  red:   "#d62525",
  fe:    "#4fc3f7",
  be:    "#ffd54f",
  fs:    "#407E8C",
};

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
  { label: "Stockage /app/projects", pct: 31, color: "#86efac" },
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

/* ── SVG Bar Chart stacked ─────────────────────────────────────────────── */
function BarChartSVG({ data, keys, colors, labelKey, height = 165 }) {
  const W = 560, H = height, padL = 26, padB = 20, padR = 8, padT = 8;
  const plotW = W - padL - padR, plotH = H - padB - padT;
  const maxVal = Math.max(...data.map(d => keys.reduce((s, k) => s + (d[k] || 0), 0)));
  const barW = (plotW / data.length) * 0.55;
  const barGap = plotW / data.length;
  const yTicks = [0, Math.round(maxVal / 2), maxVal];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      {yTicks.map(t => {
        const y = padT + plotH - (t / maxVal) * plotH;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(8,58,79,.08)" strokeWidth="1" />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={8} fill="rgba(8,58,79,.35)" fontFamily="DM Sans">{t}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = padL + i * barGap + (barGap - barW) / 2;
        let stackY = padT + plotH;
        return (
          <g key={i}>
            {keys.map((k, ki) => {
              const val = d[k] || 0;
              const barH = (val / maxVal) * plotH;
              stackY -= barH;
              return (
                <rect key={k} x={x} y={stackY} width={barW} height={barH}
                  fill={colors[ki]} rx={ki === keys.length - 1 ? 3 : 0} opacity={0.85}>
                  <title>{k}: {val}</title>
                </rect>
              );
            })}
            <text x={x + barW / 2} y={H - 5} textAnchor="middle" fontSize={8}
              fill="rgba(8,58,79,.4)" fontFamily="DM Sans">{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── SVG Bar Chart single ──────────────────────────────────────────────── */
function BarChartSingle({ data, valueKey, labelKey, colorFn, height = 140, suffix = "" }) {
  const W = 560, H = height, padL = 26, padB = 20, padR = 8, padT = 8;
  const plotW = W - padL - padR, plotH = H - padB - padT;
  const maxVal = Math.max(...data.map(d => d[valueKey]));
  const barW = (plotW / data.length) * 0.6;
  const barGap = plotW / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      {[0, Math.round(maxVal / 2), maxVal].map(t => {
        const y = padT + plotH - (t / maxVal) * plotH;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(8,58,79,.08)" strokeWidth="1" />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={8} fill="rgba(8,58,79,.35)" fontFamily="DM Sans">{t}{suffix}</text>
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
            <rect x={x} y={y} width={barW} height={barH} fill={colorFn(val)} rx={3} opacity={0.85}>
              <title>{d[labelKey]}: {val}{suffix}</title>
            </rect>
            <text x={x + barW / 2} y={H - 5} textAnchor="middle" fontSize={7}
              fill="rgba(8,58,79,.4)" fontFamily="DM Sans">{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── SVG Area Chart ────────────────────────────────────────────────────── */
function AreaChartSVG({ data, labels, color, height = 140, suffix = "" }) {
  const W = 560, H = height, padL = 34, padB = 20, padR = 8, padT = 8;
  const plotW = W - padL - padR, plotH = H - padB - padT;
  const minVal = Math.min(...data), maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;
  const pts = data.map((v, i) => ({
    x: padL + (i / (data.length - 1)) * plotW,
    y: padT + plotH - ((v - minVal) / range) * plotH,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L${pts[pts.length-1].x.toFixed(1)},${(padT+plotH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT+plotH).toFixed(1)} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      {[minVal, Math.round((minVal+maxVal)/2), maxVal].map(t => {
        const y = padT + plotH - ((t-minVal)/range)*plotH;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="rgba(8,58,79,.08)" strokeWidth="1"/>
            <text x={padL-4} y={y+4} textAnchor="end" fontSize={8} fill="rgba(8,58,79,.35)" fontFamily="DM Sans">{t}{suffix}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#aG)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p,i) => i%3===0 && (
        <text key={i} x={p.x} y={H-5} textAnchor="middle" fontSize={7} fill="rgba(8,58,79,.35)" fontFamily="DM Sans">{labels[i]}</text>
      ))}
      {pts.map((p,i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} fill={color} opacity={0.75}>
          <title>{labels[i]}: {data[i]}{suffix}</title>
        </circle>
      ))}
    </svg>
  );
}

/* ── SVG Donut ─────────────────────────────────────────────────────────── */
function DonutSVG({ data, size = 130, center }) {
  const r = 42, cx = size/2, cy = size/2;
  const circ = 2*Math.PI*r;
  const total = data.reduce((s,d) => s+d.value, 0);
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(8,58,79,.07)" strokeWidth="11" />
      {data.map((d,i) => {
        const dash = (d.value/total)*circ;
        const seg = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={d.color} strokeWidth="11"
            strokeDasharray={`${dash} ${circ-dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity={0.88}>
            <title>{d.name}: {d.value}{d.pct?"%":""}</title>
          </circle>
        );
        offset += dash;
        return seg;
      })}
      {center}
    </svg>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */
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
  const filtered = filter === "all" ? projects : projects.filter(p => p.status === filter);

  if (loading) return (
    <div className="db-root" style={{ display:"grid", placeItems:"center", minHeight:"100vh" }}>
      <div className="db-loading">
        <span className="db-loading-dot" />
        <span className="db-loading-dot" style={{ animationDelay:".15s" }} />
        <span className="db-loading-dot" style={{ animationDelay:".3s" }} />
      </div>
    </div>
  );

  return (
    <div className="db-root">
      <div className={`db-inner${visible ? " db-in" : ""}`}>

        {/* ══ HEADER ── compact, sans bouton new projet ══ */}
        <div className="db-header">
          <div>
            <h1 className="db-title">
              Bon retour,&nbsp;
              <span className="db-title-gold">{user?.firstName || "Utilisateur"}</span>
            </h1>
            <p className="db-subtitle">
              {active} projet{active !== 1 ? "s" : ""} actif{active !== 1 ? "s" : ""} · {total} au total · Tous les services opérationnels
            </p>
          </div>
        </div>

        {/* ══ KPIs compacts ══ */}
        <div className="db-kpi-row">
          {[
            { label: "Projets actifs",    value: active, sub: `${pending} en attente · ${completed} terminés` },
            { label: "Requêtes AI (24h)", value: "247",  sub: "+18.4% vs hier"  },
            { label: "Exécutions Runner", value: "38",   sub: "+6 aujourd'hui"  },
            { label: "Déploiement moy.",  value: "24 s", sub: "+2s vs hier"     },
          ].map((k, i) => (
            <div className="db-kpi" key={k.label} style={{ animationDelay: `${.08 + i*.06}s` }}>
              <div className="db-kpi-label">{k.label}</div>
              <div className="db-kpi-value">{k.value}</div>
              <div className="db-kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ══ ROW 2 : AI bar chart (teal pâle) + Donut projets (aqua) ══ */}
        <div className="db-row db-row-2">

          <div className="db-card db-card--teal" style={{ animationDelay:".18s" }}>
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">AI Service — Requêtes (7 jours)</div>
                <div className="db-card-sub">Endpoints /generate et /chat combinés</div>
              </div>
              <span className="db-badge db-badge-green"><span className="db-live-dot" /> Opérationnel</span>
            </div>
            <BarChartSVG data={AI_WEEK} keys={["generate","chat"]} colors={[C.teal, C.gold2]} labelKey="day" height={165} />
            <div className="db-chart-legend">
              <span className="db-leg"><span className="db-leg-sq" style={{ background:C.teal }} />/generate</span>
              <span className="db-leg"><span className="db-leg-sq" style={{ background:C.gold2 }} />/chat</span>
            </div>
          </div>

          <div className="db-card db-card--aqua" style={{ animationDelay:".22s" }}>
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">Répartition projets</div>
                <div className="db-card-sub">Par type de stack</div>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"center", margin:"6px 0 10px" }}>
              <DonutSVG data={PIE_DATA} size={130}
                center={<>
                  <text x={65} y={61} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily="Syne,sans-serif" fill="#041e2a">{total}</text>
                  <text x={65} y={76} textAnchor="middle" fontSize={10} fontFamily="DM Sans,sans-serif" fill="rgba(4,30,42,.45)">projets</text>
                </>}
              />
            </div>
            {PIE_DATA.map(d => (
              <div className="db-leg-row" key={d.name}>
                <span className="db-leg"><span className="db-leg-sq" style={{ background:d.color }} />{d.name}</span>
                <strong>{d.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* ══ ROW 3 : Runner (gold) + Infrastructure (slate) + Succès (mint) ══ */}
        <div className="db-row db-row-3">

          <div className="db-card db-card--gold" style={{ animationDelay:".26s" }}>
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">Runner — Durée déploiements</div>
                <div className="db-card-sub">Temps d'exécution en secondes</div>
              </div>
              <span className="db-badge db-badge-blue">SSE actif</span>
            </div>
            <BarChartSingle data={RUNNER_24H} valueKey="duration" labelKey="time" colorFn={runnerColor} height={140} suffix="s" />
            <div className="db-chart-legend">
              <span className="db-leg"><span className="db-leg-sq" style={{ background:C.green }} />≤ 23s</span>
              <span className="db-leg"><span className="db-leg-sq" style={{ background:C.amber }} />24–28s</span>
              <span className="db-leg"><span className="db-leg-sq" style={{ background:C.red }} />&gt; 28s</span>
            </div>
          </div>

          <div className="db-card db-card--slate" style={{ animationDelay:".30s" }}>
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

          <div className="db-card db-card--mint" style={{ animationDelay:".34s" }}>
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">Taux de succès Runner</div>
                <div className="db-card-sub">Déploiements réussis / total</div>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"center", margin:"6px 0 10px" }}>
              <DonutSVG data={SUCCESS_DATA.map(d => ({ ...d, pct:true }))} size={130}
                center={<>
                  <text x={65} y={61} textAnchor="middle" fontSize={19} fontWeight={700} fontFamily="Syne,sans-serif" fill="#15803d">89%</text>
                  <text x={65} y={76} textAnchor="middle" fontSize={10} fontFamily="DM Sans,sans-serif" fill="rgba(4,30,42,.45)">succès</text>
                </>}
              />
            </div>
            {SUCCESS_DATA.map(d => (
              <div className="db-leg-row" key={d.name}>
                <span className="db-leg"><span className="db-leg-sq" style={{ background:d.color }} />{d.name}</span>
                <strong>{d.value}%</strong>
              </div>
            ))}
          </div>
        </div>

        {/* ══ ROW 4 : Logs (cream) + Latence/Ressources (slate) ══ */}
        <div className="db-row db-row-2">

          <div className="db-card db-card--cream" style={{ animationDelay:".38s" }}>
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">Activité système récente</div>
                <div className="db-card-sub">Derniers événements Runner &amp; AI</div>
              </div>
              <span className="db-badge db-badge-green"><span className="db-live-dot" /> En direct</span>
            </div>
            <div className="db-log-list">
              {LOGS.map((l, i) => (
                <div className="db-log-row" key={i} style={{ animationDelay:`${.42+i*.07}s` }}>
                  <div className="db-log-icon">{l.icon}</div>
                  <div className="db-log-body">
                    <div className="db-log-name">{l.name}</div>
                    <div className="db-log-desc">{l.desc}</div>
                  </div>
                  <span className={`db-badge ${
                    l.status==="success" ? "db-badge-green"
                    : l.status==="ok"   ? "db-badge-blue"
                    : l.status==="warning" ? "db-badge-amber"
                    : "db-badge-red"
                  }`}>
                    {l.status==="success"?"succès":l.status==="ok"?"ok":l.status==="warning"?"warning":"erreur"}
                  </span>
                  <span className="db-log-time">{l.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="db-card db-card--slate" style={{ animationDelay:".42s" }}>
            <div className="db-card-hdr">
              <div>
                <div className="db-card-title">Latence AI Service</div>
                <div className="db-card-sub">Temps de réponse — dernière heure</div>
              </div>
            </div>
            <AreaChartSVG data={LATENCY} labels={LATENCY_LABELS} color={C.teal} height={140} suffix="ms" />
            <div className="db-lat-stats">
              {[["Moy.","780 ms"],["P95","1 420 ms"],["Max","1 800 ms"]].map(([l,v]) => (
                <div className="db-lat-stat" key={l}><span>{l}</span><strong>{v}</strong></div>
              ))}
            </div>
            <div style={{ marginTop:14 }}>
              {RESOURCES.map(r => (
                <div key={r.label} style={{ marginBottom:9 }}>
                  <div className="db-prog-hdr"><span>{r.label}</span><strong>{r.pct}%</strong></div>
                  <div className="db-prog-track">
                    <div className="db-prog-fill" style={{ width:`${r.pct}%`, background:r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ TABLE PROJETS ══ */}
        <div className="db-card db-table-card" style={{ animationDelay:".46s" }}>
          <div className="db-table-hdr">
            <h3 className="db-table-title">Mes projets</h3>
            <div className="db-filter-tabs">
              {["all","active","pending","completed"].map(f => (
                <button key={f} className={`db-tab${filter===f?" db-tab-active":""}`} onClick={() => setFilter(f)}>
                  {f==="all"?"Tous":STATUS_MAP[f]?.label}
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
                      <td className="db-date">{p.dueDate ? new Date(p.dueDate).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"}) : "—"}</td>
                      <td>
                        <button className="db-edit-btn"
                          onClick={e => { e.stopPropagation(); navigate(`/workspace/projects/${p.id}`); }}
                          title="Ouvrir l'éditeur">✎</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
