"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────
interface Prediction {
  id: string; title: string; summary: string; source: string;
  category: string; link: string; sentiment: string; confidence: number;
  scores: Record<string, number>; processed_at: string;
}
interface ModelVersion {
  id: string; version: string; accuracy: number; f1_score: number;
  stage: string; retrain_reason: string; deployed_at: string;
}
interface DriftReport {
  id: string; drift_detected: boolean; accuracy: number; drift_score: number;
  action_taken: string; sample_size: number; created_at: string;
}
interface UserActivity {
  id: string; session_id: string; page: string; event_type: string;
  browser: string; os: string; device: string; country: string;
  city: string; created_at: string;
}
interface PipelineRun {
  id: string; run_number: number; status: string; trigger: string;
  old_accuracy: number; new_accuracy: number; deployed: boolean;
  reason: string; created_at: string;
}
interface Toast {
  id: string; type: "drift" | "pipeline" | "prediction";
  title: string; message: string; color: string;
}

// ─── Constants ────────────────────────────────────────────────
const SENTIMENT_COLORS = {
  Positive: "#C8FF00", Neutral: "#A855F7", Negative: "#FF2D2D",
};
const SOURCE_COLORS = ["#FF2D2D", "#FF6B35", "#C8FF00", "#A855F7", "#ffffff"];
const PAGE_SIZE = 20;

const COUNTRY_COORDS: Record<string, [number, number]> = {
  "Afghanistan": [33.93, 67.71], "Albania": [41.15, 20.17],
  "Algeria": [28.03, 1.66], "Argentina": [-38.42, -63.62],
  "Australia": [-25.27, 133.78], "Austria": [47.52, 14.55],
  "Bangladesh": [23.68, 90.36], "Belgium": [50.50, 4.47],
  "Brazil": [-14.24, -51.93], "Canada": [56.13, -106.35],
  "Chile": [-35.68, -71.54], "China": [35.86, 104.20],
  "Colombia": [4.57, -74.30], "Denmark": [56.26, 9.50],
  "Egypt": [26.82, 30.80], "Finland": [61.92, 25.75],
  "France": [46.23, 2.21], "Germany": [51.17, 10.45],
  "Ghana": [7.95, -1.02], "Greece": [39.07, 21.82],
  "India": [20.59, 78.96], "Indonesia": [-0.79, 113.92],
  "Iran": [32.43, 53.69], "Ireland": [53.41, -8.24],
  "Israel": [31.05, 34.85], "Italy": [41.87, 12.57],
  "Japan": [36.20, 138.25], "Kenya": [-0.02, 37.91],
  "Malaysia": [4.21, 101.98], "Mexico": [23.63, -102.55],
  "Morocco": [31.79, -7.09], "Nepal": [28.39, 84.12],
  "Netherlands": [52.13, 5.29], "New Zealand": [-40.90, 174.89],
  "Nigeria": [9.08, 8.68], "Norway": [60.47, 8.47],
  "Pakistan": [30.38, 69.35], "Peru": [-9.19, -75.02],
  "Philippines": [12.88, 121.77], "Poland": [51.92, 19.15],
  "Portugal": [39.40, -8.22], "Romania": [45.94, 24.97],
  "Russia": [61.52, 105.32], "Saudi Arabia": [23.89, 45.08],
  "Singapore": [1.35, 103.82], "South Africa": [-30.56, 22.94],
  "South Korea": [35.91, 127.77], "Spain": [40.46, -3.75],
  "Sri Lanka": [7.87, 80.77], "Sweden": [60.13, 18.64],
  "Switzerland": [46.82, 8.23], "Taiwan": [23.70, 121.00],
  "Thailand": [15.87, 100.99], "Turkey": [38.96, 35.24],
  "Ukraine": [48.38, 31.17], "United Arab Emirates": [23.42, 53.85],
  "United Kingdom": [55.38, -3.44], "United States": [37.09, -95.71],
  "Vietnam": [14.06, 108.28],
};

// ─── Helpers ──────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function sentimentEmoji(s: string) {
  if (s === "Positive") return "😊";
  if (s === "Negative") return "😔";
  return "😐";
}

// ─── useIsMobile ──────────────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 640);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
}

// ─── Toast ────────────────────────────────────────────────────
function ToastContainer({
  toasts, onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      /* FIX: cap width so toasts never overflow screen on 375px */
      style={{ maxWidth: "calc(100vw - 2rem)" }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-auto rounded-sm px-3 py-2.5 flex items-start gap-2.5"
            style={{
              background: "rgba(15,15,15,0.97)",
              border:     `1px solid ${t.color}40`,
              boxShadow:  `0 0 20px ${t.color}20`,
              /* FIX: remove fixed min-width that causes overflow */
              minWidth: 0,
              width: "100%",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 animate-pulse"
              style={{ background: t.color }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="font-mono text-[0.56rem] uppercase tracking-widest mb-0.5 truncate"
                style={{ color: t.color }}
              >
                {t.title}
              </p>
              <p
                className="font-mono text-[0.58rem] leading-snug truncate"
                style={{ color: "#A0A0A0" }}
              >
                {t.message}
              </p>
            </div>
            <button
              className="shrink-0 font-mono text-[0.65rem] mt-0.5 pl-1"
              style={{ color: "#404040" }}
              onClick={() => onDismiss(t.id)}
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── System Health Bar ────────────────────────────────────────
function SystemHealthBar({
  driftDetected, pipelineRuns, total, modelVersions,
}: {
  driftDetected: boolean;
  pipelineRuns: PipelineRun[];
  total: number;
  modelVersions: ModelVersion[];
}) {
  const isMobile    = useIsMobile();
  const lastPipeline = pipelineRuns[0];
  const latestModel  = modelVersions[0];

  // FIX: on mobile show only 3 most important systems
  const allSystems = [
    {
      label:  "ML Worker",
      status: total > 0 ? "Running" : "Idle",
      ok:     total > 0,
      detail: `${total.toLocaleString()}`,
    },
    {
      label:  "Drift",
      status: driftDetected ? "Drift!" : "Stable",
      ok:     !driftDetected,
      detail: driftDetected ? "Alert" : "Clear",
    },
    {
      label:  "Model",
      status: latestModel ? latestModel.stage : "None",
      ok:     latestModel?.stage === "Production",
      detail: latestModel ? `${latestModel.accuracy?.toFixed(0)}%` : "—",
    },
    {
      label:  "CI/CD",
      status: lastPipeline ? lastPipeline.status : "—",
      ok:     !lastPipeline || lastPipeline.status === "success",
      detail: lastPipeline ? `#${lastPipeline.run_number}` : "No runs",
    },
    {
      label:  "Supabase",
      status: "Healthy",
      ok:     true,
      detail: "Live",
    },
  ];

  const systems = isMobile ? allSystems.slice(0, 3) : allSystems;

  return (
    <div
      className="flex items-center overflow-x-auto"
      style={{
        background:   "rgba(10,10,10,0.85)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        scrollbarWidth: "none",
      }}
    >
      {systems.map((s, i) => (
        <div key={s.label} className="flex items-center shrink-0">
          <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.ok ? "animate-pulse" : ""}`}
              style={{ background: s.ok ? "#C8FF00" : "#FF2D2D" }}
            />
            <div>
              <p
                className="font-mono text-[0.46rem] sm:text-[0.52rem] uppercase tracking-widest"
                style={{ color: s.ok ? "#606060" : "#FF2D2D" }}
              >
                {s.label}
              </p>
              <p
                className="font-mono text-[0.52rem] sm:text-[0.58rem]"
                style={{ color: s.ok ? "#A0A0A0" : "#FF2D2D" }}
              >
                {s.status}
              </p>
            </div>
          </div>
          {i < systems.length - 1 && (
            <div
              className="w-px h-5 shrink-0"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          )}
        </div>
      ))}
      <div className="ml-auto px-3 sm:px-4 shrink-0">
        <p className="font-mono text-[0.46rem] sm:text-[0.52rem] whitespace-nowrap"
          style={{ color: "#404040" }}>
          LIVE
        </p>
      </div>
    </div>
  );
}

// ─── Drift Alert Banner ───────────────────────────────────────
function DriftAlertBanner({
  driftReport,
}: {
  driftReport: DriftReport | undefined;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (!driftReport?.drift_detected || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      /* FIX: flex-col on mobile, flex-row on sm+ */
      className="mx-3 sm:mx-8 mb-4 rounded-sm px-3 sm:px-4 py-3
                 flex flex-col sm:flex-row sm:items-center
                 justify-between gap-2 sm:gap-4"
      style={{
        background: "rgba(255,45,45,0.08)",
        border:     "1px solid rgba(255,45,45,0.3)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-base shrink-0">⚠️</span>
        <div className="min-w-0">
          <p
            className="font-mono text-[0.58rem] sm:text-[0.6rem] uppercase tracking-widest"
            style={{ color: "#FF2D2D" }}
          >
            Model Drift Detected
          </p>
          {/* FIX: truncate long text on mobile */}
          <p
            className="font-mono text-[0.52rem] sm:text-[0.55rem] truncate"
            style={{ color: "#A0A0A0" }}
          >
            {driftReport.action_taken} · {driftReport.sample_size} samples ·{" "}
            {timeAgo(driftReport.created_at)}
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="font-mono text-[0.58rem] sm:text-[0.6rem] px-3 py-1.5 rounded-sm self-start sm:self-auto shrink-0"
        style={{
          background:  "rgba(255,45,45,0.15)",
          color:       "#FF2D2D",
          border:      "1px solid rgba(255,45,45,0.3)",
        }}
      >
        Dismiss
      </button>
    </motion.div>
  );
}

// ─── World Map ────────────────────────────────────────────────
function WorldMap({
  countryCounts,
}: {
  countryCounts: Record<string, number>;
}) {
  const svgRef   = useRef<SVGSVGElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; country: string; count: number;
  } | null>(null);

  const W = 800; const H = 400;
  const mapH = isMobile ? 170 : 260;

  const project = (lat: number, lng: number): [number, number] => [
    ((lng + 180) / 360) * W,
    ((90 - lat) / 180) * H,
  ];

  const maxCount = Math.max(...Object.values(countryCounts), 1);
  const bubbles  = Object.entries(countryCounts)
    .filter(([c]) => COUNTRY_COORDS[c])
    .map(([country, count]) => {
      const [lat, lng] = COUNTRY_COORDS[country];
      const [x, y]    = project(lat, lng);
      const maxR      = isMobile ? 14 : 20;
      const baseR     = isMobile ? 3 : 4;
      return { country, count, x, y, r: baseR + (count / maxCount) * maxR };
    });

  const topBubbles   = [...bubbles].sort((a, b) => b.count - a.count).slice(0, isMobile ? 3 : 5);
  const otherBubbles = [...bubbles].sort((a, b) => b.count - a.count).slice(isMobile ? 3 : 5);

  const handleEnter = (svgX: number, svgY: number, country: string, count: number) => {
    const svg = svgRef.current; if (!svg) return;
    const rect    = svg.getBoundingClientRect();
    const scaleX  = rect.width  / W;
    const scaleY  = rect.height / H;
    const pixelX  = svgX * scaleX;
    const pixelY  = svgY * scaleY;
    /* FIX: clamp tooltip so it never overflows right edge */
    const tipW    = 130;
    const clampedX = Math.min(pixelX + 12, rect.width - tipW - 8);
    setTooltip({ x: clampedX, y: pixelY, country, count });
  };

  return (
    <div
      className="relative rounded-sm overflow-hidden"
      style={{
        background: "var(--surface-1)",
        border:     "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 sm:px-5 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#FF2D2D" }}
          />
          <span
            className="font-mono text-[0.58rem] sm:text-[0.6rem] tracking-[0.25em] uppercase"
            style={{ color: "#FF2D2D" }}
          >
            Visitor World Map
          </span>
        </div>
        <span
          className="font-mono text-[0.55rem] sm:text-[0.58rem]"
          style={{ color: "#606060" }}
        >
          {Object.keys(countryCounts).length} countries
        </span>
      </div>

      {/* FIX: overflow-hidden + w-full on wrapper prevents SVG bleed */}
      <div ref={wrapRef} className="px-3 sm:px-4 py-3 relative overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: mapH, display: "block" }}
        >
          <rect width={W} height={H} fill="rgba(255,255,255,0.015)" rx={4} />
          {[-60, -30, 0, 30, 60].map((lat) => {
            const [, y] = project(lat, 0);
            return (
              <line key={`lat-${lat}`} x1={0} y1={y} x2={W} y2={y}
                stroke={lat === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}
                strokeWidth={lat === 0 ? 1.5 : 1}
                strokeDasharray={lat === 0 ? "6,4" : "none"} />
            );
          })}
          {[-120, -60, 0, 60, 120].map((lng) => {
            const [x] = project(0, lng);
            return (
              <line key={`lng-${lng}`} x1={x} y1={0} x2={x} y2={H}
                stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
            );
          })}
          {!isMobile && (
            <text x={8} y={project(0, -180)[1] - 4}
              fill="rgba(255,255,255,0.12)" fontSize={7} fontFamily="DM Mono">
              EQUATOR
            </text>
          )}
          {otherBubbles.map(({ country, x, y, r, count }) => (
            <circle key={`sm-${country}`} cx={x} cy={y} r={r}
              fill="rgba(255,45,45,0.18)"
              stroke="rgba(255,45,45,0.35)" strokeWidth={1}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => handleEnter(x, y, country, count)}
              onMouseLeave={() => setTooltip(null)}
              onTouchStart={() => handleEnter(x, y, country, count)}
            />
          ))}
          {topBubbles.map(({ country, x, y, r, count }) => (
            <g key={`top-${country}`}>
              <circle cx={x} cy={y} r={r + (isMobile ? 3 : 6)} fill="rgba(255,45,45,0.05)" />
              <circle cx={x} cy={y} r={r + (isMobile ? 1 : 3)} fill="rgba(255,45,45,0.08)" />
              <circle cx={x} cy={y} r={r}
                fill="rgba(255,45,45,0.4)" stroke="#FF2D2D" strokeWidth={1.5}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => handleEnter(x, y, country, count)}
                onMouseLeave={() => setTooltip(null)}
                onTouchStart={() => handleEnter(x, y, country, count)}
              />
              <text x={x} y={y - r - (isMobile ? 3 : 5)}
                textAnchor="middle" fill="#FF2D2D"
                fontSize={isMobile ? 5 : 7}
                fontFamily="DM Mono"
                style={{ pointerEvents: "none" }}
              >
                {country.length > (isMobile ? 8 : 12)
                  ? country.slice(0, isMobile ? 6 : 10) + ".."
                  : country}
              </text>
            </g>
          ))}
        </svg>

        {tooltip && (
          <div
            className="absolute pointer-events-none rounded-sm px-2.5 py-1.5 z-10"
            style={{
              left:      tooltip.x,
              top:       tooltip.y,
              transform: "translateY(-50%)",
              background: "var(--surface-2)",
              border:     "1px solid rgba(255,45,45,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            <p className="font-mono text-[0.58rem] uppercase tracking-wider"
              style={{ color: "#FF2D2D" }}>
              {tooltip.country}
            </p>
            <p className="font-mono text-[0.62rem]" style={{ color: "#F0F0F0" }}>
              {tooltip.count} visit{tooltip.count !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      <div
        className="flex flex-wrap items-center gap-3 sm:gap-5 px-4 sm:px-5 pb-3"
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full"
            style={{ background: "rgba(255,45,45,0.4)", border: "1.5px solid #FF2D2D" }} />
          <span className="font-mono text-[0.52rem] sm:text-[0.55rem]"
            style={{ color: "#606060" }}>
            Top countries
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full"
            style={{ background: "rgba(255,45,45,0.18)", border: "1px solid rgba(255,45,45,0.35)" }} />
          <span className="font-mono text-[0.52rem] sm:text-[0.55rem]"
            style={{ color: "#606060" }}>
            Other
          </span>
        </div>
        <span className="font-mono text-[0.52rem] sm:text-[0.55rem] ml-auto"
          style={{ color: "#404040" }}>
          Size = visits
        </span>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({
  label, value, sub, color = "#FF2D2D",
}: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-sm p-3 sm:p-5"
      style={{
        background: "var(--surface-1)",
        border:     "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p
        className="font-mono text-[0.5rem] sm:text-[0.58rem] tracking-[0.2em] uppercase mb-1.5 sm:mb-2"
        style={{ color: "#606060" }}
      >
        {label}
      </p>
      {/* FIX: cap at text-2xl on mobile, text-3xl on sm+ */}
      <p
        className="font-display text-2xl sm:text-3xl leading-none truncate"
        style={{ color }}
      >
        {value}
      </p>
      {sub && (
        <p
          className="font-mono text-[0.5rem] sm:text-[0.58rem] mt-1 sm:mt-1.5 truncate"
          style={{ color: "#606060" }}
        >
          {sub}
        </p>
      )}
    </motion.div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-sm px-2.5 py-1.5"
      style={{
        background: "var(--surface-2)",
        border:     "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <p className="font-mono text-[0.58rem] mb-1" style={{ color: "#606060" }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-mono text-[0.62rem]" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Chart Box (prevents Recharts overflow on mobile) ─────────
function ChartBox({
  title, height = 200, children,
}: {
  title: string; height?: number; children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  return (
    <div
      className="rounded-sm p-4 sm:p-5"
      style={{
        background: "var(--surface-1)",
        border:     "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p
        className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-4 sm:mb-5"
        style={{ color: "#FF2D2D" }}
      >
        {title}
      </p>
      {/* FIX: minWidth:0 + overflow:hidden prevents recharts overflow */}
      <div style={{ minWidth: 0, overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height={isMobile ? Math.round(height * 0.8) : height}>
          {children as any}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Shared axis tick styles ───────────────────────────────────
const axisTick    = { fill: "#404040", fontSize: 8, fontFamily: "DM Mono" };
const axisTickDim = { fill: "#606060", fontSize: 8, fontFamily: "DM Mono" };

// ─── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const [predictions,   setPredictions]  = useState<Prediction[]>([]);
  const [modelVersions, setModelVersions]= useState<ModelVersion[]>([]);
  const [driftReports,  setDriftReports] = useState<DriftReport[]>([]);
  const [userActivity,  setUserActivity] = useState<UserActivity[]>([]);
  const [pipelineRuns,  setPipelineRuns] = useState<PipelineRun[]>([]);
  const [total,         setTotal]        = useState(0);
  const [loading,       setLoading]      = useState(true);
  const [activeTab,     setActiveTab]    = useState<
    "live" | "analytics" | "monitoring" | "visitors" | "pipeline"
  >("live");
  const [page,   setPage]   = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const isMobile = useIsMobile();

  // ── Toasts ────────────────────────────────────────────────
  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Derived ───────────────────────────────────────────────
  const sentimentCounts = predictions.reduce((acc, p) => {
    acc[p.sentiment] = (acc[p.sentiment] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  const sourceCounts = predictions.reduce((acc, p) => {
    acc[p.source] = (acc[p.source] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  const avgConfidence = predictions.length
    ? (predictions.reduce((a, p) => a + p.confidence, 0) / predictions.length).toFixed(1)
    : "0";

  const pieData    = Object.entries(sentimentCounts).map(([name, value]) => ({ name, value }));
  const sourceData = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const timelineData = (() => {
    const grouped: Record<string, any> = {};
    predictions.forEach((p) => {
      const hour = new Date(p.processed_at).toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit",
      });
      if (!grouped[hour]) grouped[hour] = { time: hour, Positive: 0, Negative: 0, Neutral: 0 };
      grouped[hour][p.sentiment]++;
    });
    return Object.values(grouped).slice(-12);
  })();

  const confidenceData = [
    { range: "90-100%", count: predictions.filter((p) => p.confidence >= 90).length },
    { range: "80-90%",  count: predictions.filter((p) => p.confidence >= 80 && p.confidence < 90).length },
    { range: "70-80%",  count: predictions.filter((p) => p.confidence >= 70 && p.confidence < 80).length },
    { range: "<70%",    count: predictions.filter((p) => p.confidence < 70).length },
  ];

  const countryCounts = userActivity.reduce((acc, a) => {
    if (a.country && a.country !== "Unknown") { acc[a.country] = (acc[a.country] || 0) + 1; }
    return acc;
  }, {} as Record<string, number>);

  const cityCounts = userActivity.reduce((acc, a) => {
    if (a.city && a.city !== "Unknown" && a.country && a.country !== "Unknown") {
      const key = `${a.city}, ${a.country}`; acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const pageCounts    = userActivity.reduce((acc, a) => { acc[a.page] = (acc[a.page] || 0) + 1; return acc; }, {} as Record<string, number>);
  const deviceCounts  = userActivity.reduce((acc, a) => { acc[a.device] = (acc[a.device] || 0) + 1; return acc; }, {} as Record<string, number>);
  const browserCounts = userActivity.reduce((acc, a) => { acc[a.browser] = (acc[a.browser] || 0) + 1; return acc; }, {} as Record<string, number>);

  const countryData = Object.entries(countryCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  const cityData    = Object.entries(cityCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  const pageData    = Object.entries(pageCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const deviceData  = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));
  const browserData = Object.entries(browserCounts).map(([name, value]) => ({ name, value }));

  const accuracyTrend = modelVersions.slice().reverse().map((v) => ({ version: v.version, accuracy: v.accuracy }));
  const latestDrift   = driftReports[0];
  const driftDetected = !!latestDrift?.drift_detected;
  const driftStatus   = driftDetected ? "⚠️ Drift" : "✅ Stable";
  const driftColor    = driftDetected ? "#FF2D2D" : "#C8FF00";

  // ── Fetch ─────────────────────────────────────────────────
  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { count } = await supabase
        .from("news_predictions")
        .select("*", { count: "exact", head: true });
      setTotal(count || 0);

      const from = (pageNum - 1) * PAGE_SIZE;
      const { data: predData }     = await supabase.from("news_predictions").select("*").order("processed_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
      const { data: versionsData } = await supabase.from("model_versions").select("*").order("created_at", { ascending: false }).limit(10);
      const { data: driftData }    = await supabase.from("drift_reports").select("*").order("created_at", { ascending: false }).limit(20);
      const { data: activityData } = await supabase.from("user_activity").select("*").order("created_at", { ascending: false }).limit(200);
      const { data: pipelineData } = await supabase.from("pipeline_runs").select("*").order("created_at", { ascending: false }).limit(20);

      setPredictions(predData     || []);
      setModelVersions(versionsData || []);
      setDriftReports(driftData   || []);
      setUserActivity(activityData || []);
      setPipelineRuns(pipelineData || []);
    } catch (e) { console.error("Fetch failed:", e); }
    finally { setLoading(false); }
  };

  // ── Realtime ──────────────────────────────────────────────
  useEffect(() => {
    fetchData(page);

    const predChannel = supabase.channel("pred_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "news_predictions" }, (payload) => {
        setPredictions((prev) => [payload.new as Prediction, ...prev.slice(0, PAGE_SIZE - 1)]);
        setTotal((prev) => prev + 1);
      }).subscribe();

    const driftChannel = supabase.channel("drift_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "drift_reports" }, (payload) => {
        const r = payload.new as DriftReport;
        setDriftReports((prev) => [r, ...prev.slice(0, 19)]);
        if (r.drift_detected)
          addToast({ type: "drift", title: "⚠️ Drift Detected", message: `${r.action_taken} · ${r.sample_size} samples`, color: "#FF2D2D" });
      }).subscribe();

    const versionChannel = supabase.channel("version_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "model_versions" }, (payload) => {
        setModelVersions((prev) => [payload.new as ModelVersion, ...prev.slice(0, 9)]);
      }).subscribe();

    const activityChannel = supabase.channel("activity_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_activity" }, (payload) => {
        setUserActivity((prev) => [payload.new as UserActivity, ...prev.slice(0, 199)]);
      }).subscribe();

    const pipelineChannel = supabase.channel("pipeline_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pipeline_runs" }, (payload) => {
        const r = payload.new as PipelineRun;
        setPipelineRuns((prev) => [r, ...prev.slice(0, 19)]);
        addToast({
          type:    "pipeline",
          title:   r.status === "success" ? "✅ Pipeline Passed" : "❌ Pipeline Failed",
          message: `Run #${r.run_number} · ${r.trigger}`,
          color:   r.status === "success" ? "#C8FF00" : "#FF2D2D",
        });
      }).subscribe();

    return () => {
      supabase.removeChannel(predChannel);
      supabase.removeChannel(driftChannel);
      supabase.removeChannel(versionChannel);
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(pipelineChannel);
    };
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const tabs = [
    { id: "live",       label: isMobile ? "🔴 Live"    : "🔴 Live Feed"      },
    { id: "analytics",  label: isMobile ? "📊 ML"      : "📊 ML Analytics"   },
    { id: "monitoring", label: isMobile ? "🔬 Monitor" : "🔬 Monitoring"      },
    { id: "visitors",   label: isMobile ? "👥 Visitors": "👥 Visitors"        },
    { id: "pipeline",   label: isMobile ? "⚙️ CI/CD"  : "⚙️ CI/CD Pipeline" },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>

      {/* ── Header ── */}
      <div
        className="sticky top-0 z-50"
        style={{
          background:     "rgba(10,10,10,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom:   "1px solid rgba(255,45,45,0.15)",
        }}
      >
        <div className="px-3 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span
              className="w-2 h-2 rounded-full animate-pulse shrink-0"
              style={{ background: "#FF2D2D", boxShadow: "0 0 8px #FF2D2D" }}
            />
            {/* FIX: shorten title on mobile */}
            <span
              className="font-display tracking-[0.12em] sm:tracking-[0.15em] leading-none"
              style={{
                color:    "#F0F0F0",
                fontSize: isMobile ? "0.75rem" : "1.25rem",
              }}
            >
              {isMobile ? "ML DASHBOARD" : "ML PRODUCTION DASHBOARD"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Drift badge — hidden on mobile (shown in health bar) */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-sm"
              style={{
                background: `${driftColor}15`,
                border:     `1px solid ${driftColor}40`,
              }}
            >
              <span
                className="font-mono text-[0.58rem] tracking-widest uppercase"
                style={{ color: driftColor }}
              >
                {driftStatus}
              </span>
            </div>

            {/* Predictions badge */}
            <div
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-sm"
              style={{
                background: "rgba(255,45,45,0.08)",
                border:     "1px solid rgba(255,45,45,0.2)",
              }}
            >
              <span
                className="font-mono uppercase"
                style={{
                  color:    "#FF2D2D",
                  fontSize: isMobile ? "0.5rem" : "0.6rem",
                  letterSpacing: "0.1em",
                }}
              >
                {isMobile ? total.toLocaleString() : `${total.toLocaleString()} predictions`}
              </span>
            </div>

            <a
              href="/"
              className="font-mono text-[0.58rem] sm:text-[0.6rem] tracking-widest uppercase hidden sm:block"
              style={{ color: "#606060" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F0F0F0")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#606060")}
            >
              ← Portfolio
            </a>
          </div>
        </div>

        <SystemHealthBar
          driftDetected={driftDetected}
          pipelineRuns={pipelineRuns}
          total={total}
          modelVersions={modelVersions}
        />
      </div>

      {/* ── Drift Banner ── */}
      <div className="pt-3 sm:pt-4">
        <DriftAlertBanner driftReport={latestDrift} />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-8 pb-8">

        {/* ── Tabs: scrollable on mobile ── */}
        <div
          className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.97 }}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-sm font-mono uppercase tracking-widest shrink-0"
              style={{
                fontSize:   isMobile ? "0.55rem" : "0.62rem",
                background: activeTab === tab.id ? "#FF2D2D" : "var(--surface-1)",
                color:      activeTab === tab.id ? "#fff"    : "#606060",
                border:     `1px solid ${activeTab === tab.id ? "#FF2D2D" : "rgba(255,255,255,0.06)"}`,
                boxShadow:  activeTab === tab.id ? "0 0 16px rgba(255,45,45,0.3)" : "none",
              }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ══════════ LIVE FEED ══════════ */}
          {activeTab === "live" && (
            <motion.div key="live"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} className="space-y-3 sm:space-y-4">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                <StatCard label="Total Predictions" value={total.toLocaleString()} sub="all time" color="#FF2D2D" />
                <StatCard label="Avg Confidence"    value={`${avgConfidence}%`}    sub="this page" color="#C8FF00" />
                <StatCard label="Positive"
                  value={sentimentCounts["Positive"] || 0}
                  sub={`${predictions.length ? Math.round(((sentimentCounts["Positive"] || 0) / predictions.length) * 100) : 0}%`}
                  color="#C8FF00" />
                <StatCard label="Negative"
                  value={sentimentCounts["Negative"] || 0}
                  sub={`${predictions.length ? Math.round(((sentimentCounts["Negative"] || 0) / predictions.length) * 100) : 0}%`}
                  color="#FF2D2D" />
              </div>

              <div className="rounded-sm overflow-hidden"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between px-4 sm:px-5 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF2D2D" }} />
                    <span className="font-mono text-[0.58rem] sm:text-[0.6rem] tracking-[0.25em] uppercase"
                      style={{ color: "#FF2D2D" }}>Live Predictions</span>
                  </div>
                  <span className="font-mono text-[0.55rem] sm:text-[0.58rem]" style={{ color: "#606060" }}>
                    {page}/{totalPages}
                  </span>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <motion.div animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-7 h-7 sm:w-8 sm:h-8 border-2 rounded-full"
                      style={{ borderColor: "rgba(255,45,45,0.2)", borderTopColor: "#FF2D2D" }} />
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    {predictions.map((p, i) => (
                      <motion.div key={p.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="px-3 sm:px-5 py-3 sm:py-4 flex items-start justify-between gap-2 sm:gap-4"
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-2)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                        style={{ transition: "background 0.2s ease" }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="font-mono text-[0.5rem] sm:text-[0.55rem] uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                              style={{ background: "var(--surface-3)", color: "#606060" }}>
                              {p.source}
                            </span>
                            <span className="font-mono text-[0.5rem] sm:text-[0.55rem]" style={{ color: "#404040" }}>
                              {timeAgo(p.processed_at)}
                            </span>
                          </div>
                          <a href={p.link} target="_blank" rel="noopener noreferrer"
                            className="font-body text-xs sm:text-sm leading-snug line-clamp-2"
                            style={{ color: "#A0A0A0" }}>
                            {p.title}
                          </a>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="flex items-center gap-1 justify-end mb-0.5 sm:mb-1">
                            <span className="text-sm sm:text-base">{sentimentEmoji(p.sentiment)}</span>
                            {/* FIX: hide text label on mobile, keep emoji */}
                            <span
                              className="font-mono text-[0.55rem] sm:text-[0.62rem] uppercase tracking-wider hidden sm:inline"
                              style={{ color: SENTIMENT_COLORS[p.sentiment as keyof typeof SENTIMENT_COLORS] || "#A0A0A0" }}>
                              {p.sentiment}
                            </span>
                          </div>
                          <span className="font-mono text-[0.5rem] sm:text-[0.58rem]" style={{ color: "#606060" }}>
                            {p.confidence.toFixed(1)}%
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between px-3 sm:px-5 py-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <motion.button onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1} whileTap={{ scale: 0.97 }}
                    className="font-mono text-[0.56rem] sm:text-[0.6rem] uppercase tracking-widest px-3 sm:px-4 py-2 rounded-sm disabled:opacity-30"
                    style={{ background: "var(--surface-2)", color: "#A0A0A0", border: "1px solid rgba(255,255,255,0.06)" }}>
                    ← Prev
                  </motion.button>
                  <span className="font-mono text-[0.52rem] sm:text-[0.58rem]" style={{ color: "#606060" }}>
                    {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} / {total.toLocaleString()}
                  </span>
                  <motion.button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages} whileTap={{ scale: 0.97 }}
                    className="font-mono text-[0.56rem] sm:text-[0.6rem] uppercase tracking-widest px-3 sm:px-4 py-2 rounded-sm disabled:opacity-30"
                    style={{ background: "#FF2D2D", color: "#fff", border: "none" }}>
                    Next →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════ ML ANALYTICS ══════════ */}
          {activeTab === "analytics" && (
            <motion.div key="analytics"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} className="space-y-3 sm:space-y-4">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                <StatCard label="Total Predictions" value={total.toLocaleString()} color="#FF2D2D" />
                <StatCard label="Avg Confidence"    value={`${avgConfidence}%`}     color="#C8FF00" />
                <StatCard label="Sources"            value={Object.keys(sourceCounts).length} color="#FF6B35" />
                <StatCard label="Positive Rate"
                  value={`${predictions.length ? Math.round(((sentimentCounts["Positive"] || 0) / predictions.length) * 100) : 0}%`}
                  color="#C8FF00" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <ChartBox title="Sentiment Over Time">
                  <AreaChart data={timelineData}>
                    <XAxis dataKey="time" tick={axisTick} axisLine={false} tickLine={false} interval={isMobile ? 3 : 0} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={isMobile ? 20 : 30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Positive" stroke="#C8FF00" fill="rgba(200,255,0,0.08)" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="Neutral"  stroke="#A855F7" fill="rgba(168,85,247,0.06)" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="Negative" stroke="#FF2D2D" fill="rgba(255,45,45,0.06)" strokeWidth={1.5} />
                  </AreaChart>
                </ChartBox>

                <div className="rounded-sm p-4 sm:p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-4 sm:mb-5"
                    style={{ color: "#FF2D2D" }}>Sentiment Distribution</p>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div style={{ minWidth: 0, flex: "0 0 55%" }}>
                      <ResponsiveContainer width="100%" height={isMobile ? 130 : 180}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%"
                            innerRadius={isMobile ? 35 : 50}
                            outerRadius={isMobile ? 58 : 80}
                            paddingAngle={3} dataKey="value">
                            {pieData.map((entry, i) => (
                              <Cell key={i}
                                fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || "#606060"} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 sm:space-y-3 min-w-0">
                      {pieData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || "#606060" }} />
                          <div className="min-w-0">
                            <p className="font-mono text-[0.52rem] sm:text-[0.6rem] uppercase truncate"
                              style={{ color: "#A0A0A0" }}>{entry.name}</p>
                            <p className="font-display text-base sm:text-lg leading-none"
                              style={{ color: SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || "#606060" }}>
                              {entry.value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <ChartBox title="Predictions by Source">
                  <BarChart data={sourceData} layout="vertical">
                    <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name"
                      width={isMobile ? 55 : 80}
                      tick={axisTickDim} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                      {sourceData.map((_, i) => (
                        <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartBox>

                <ChartBox title="Confidence Distribution">
                  <BarChart data={confidenceData}>
                    <XAxis dataKey="range" tick={axisTickDim} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={isMobile ? 20 : 30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {confidenceData.map((entry, i) => (
                        <Cell key={i}
                          fill={entry.range === "90-100%" ? "#C8FF00" : entry.range === "80-90%" ? "#FF6B35" : entry.range === "70-80%" ? "#A855F7" : "#FF2D2D"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartBox>
              </div>

              {/* Pipeline status */}
              <div className="rounded-sm p-4 sm:p-5"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-4 sm:mb-5"
                  style={{ color: "#FF2D2D" }}>Pipeline Status</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    { label: "RSS Ingestion",     status: "Running",   detail: "Every 5 min",                color: "#C8FF00" },
                    { label: "Prediction Worker", status: "Running",   detail: "Real-time",                  color: "#C8FF00" },
                    { label: "Drift Monitor",     status: driftStatus, detail: "Hourly checks",              color: driftColor },
                    { label: "Supabase",          status: "Healthy",   detail: `${total.toLocaleString()} rows`, color: "#C8FF00" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-sm p-3 sm:p-4"
                      style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                          style={{ background: item.color }} />
                        <span className="font-mono text-[0.48rem] sm:text-[0.55rem] uppercase tracking-wider truncate"
                          style={{ color: item.color }}>{item.status}</span>
                      </div>
                      <p className="font-body text-xs sm:text-sm font-medium mb-0.5 truncate"
                        style={{ color: "#F0F0F0" }}>{item.label}</p>
                      <p className="font-mono text-[0.48rem] sm:text-[0.55rem] truncate"
                        style={{ color: "#606060" }}>{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════ MONITORING ══════════ */}
          {activeTab === "monitoring" && (
            <motion.div key="monitoring"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} className="space-y-3 sm:space-y-4">

              <div className="rounded-sm overflow-hidden"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="px-4 sm:px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase" style={{ color: "#FF2D2D" }}>
                    Model Version History
                  </p>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {modelVersions.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="font-mono text-[0.6rem]" style={{ color: "#606060" }}>
                        No versions yet — will appear after first retrain
                      </p>
                    </div>
                  ) : modelVersions.map((v, i) => (
                    <div key={v.id} className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="font-display text-xl sm:text-2xl shrink-0"
                          style={{ color: i === 0 ? "#C8FF00" : "#606060" }}>{v.version}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: v.stage === "Production" ? "#C8FF00" : "#606060" }} />
                            <span className="font-mono text-[0.55rem] sm:text-[0.58rem] uppercase tracking-wider"
                              style={{ color: v.stage === "Production" ? "#C8FF00" : "#606060" }}>{v.stage}</span>
                          </div>
                          {/* FIX: truncate long retrain reason */}
                          <p className="font-mono text-[0.5rem] sm:text-[0.55rem] truncate"
                            style={{ color: "#404040" }}>{v.retrain_reason || "Manual deploy"}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-lg sm:text-xl"
                          style={{ color: i === 0 ? "#C8FF00" : "#A0A0A0" }}>{v.accuracy?.toFixed(1)}%</p>
                        <p className="font-mono text-[0.5rem] sm:text-[0.55rem]"
                          style={{ color: "#606060" }}>{timeAgo(v.deployed_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {accuracyTrend.length > 1 && (
                <ChartBox title="Accuracy Over Versions">
                  <LineChart data={accuracyTrend}>
                    <XAxis dataKey="version" tick={axisTickDim} axisLine={false} tickLine={false} />
                    <YAxis domain={[70, 100]} tick={axisTick} axisLine={false} tickLine={false} width={isMobile ? 24 : 30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="accuracy" stroke="#C8FF00" strokeWidth={2}
                      dot={{ fill: "#C8FF00", r: isMobile ? 3 : 4 }} />
                  </LineChart>
                </ChartBox>
              )}

              <div className="rounded-sm overflow-hidden"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="px-4 sm:px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase" style={{ color: "#FF2D2D" }}>
                    Drift Detection History
                  </p>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {driftReports.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="font-mono text-[0.6rem]" style={{ color: "#606060" }}>
                        No drift checks yet — runs hourly after 50+ predictions
                      </p>
                    </div>
                  ) : driftReports.map((r) => (
                    <div key={r.id} className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span className="text-base sm:text-lg shrink-0">
                          {r.drift_detected ? "⚠️" : "✅"}
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-[0.58rem] sm:text-[0.6rem] uppercase tracking-wider mb-0.5"
                            style={{ color: r.drift_detected ? "#FF2D2D" : "#C8FF00" }}>
                            {r.drift_detected ? "Drift Detected" : "No Drift"}
                          </p>
                          {/* FIX: truncate long action text */}
                          <p className="font-mono text-[0.5rem] sm:text-[0.55rem] truncate"
                            style={{ color: "#606060" }}>
                            {r.action_taken} · {r.sample_size} samples
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-lg sm:text-xl"
                          style={{ color: r.drift_detected ? "#FF2D2D" : "#C8FF00" }}>
                          {r.accuracy?.toFixed(1)}%
                        </p>
                        <p className="font-mono text-[0.5rem] sm:text-[0.55rem]" style={{ color: "#606060" }}>
                          {timeAgo(r.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════ VISITORS ══════════ */}
          {activeTab === "visitors" && (
            <motion.div key="visitors"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} className="space-y-3 sm:space-y-4">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                <StatCard label="Total Sessions" value={userActivity.length}               color="#FF2D2D" />
                <StatCard label="Countries"       value={Object.keys(countryCounts).length} color="#FF6B35" />
                <StatCard label="Cities"          value={Object.keys(cityCounts).length}    color="#A855F7" />
                <StatCard label="Top City"
                  value={cityData[0]?.name.split(",")[0] || "—"}
                  sub={`${cityData[0]?.value || 0} visits`} color="#C8FF00" />
              </div>

              <WorldMap countryCounts={countryCounts} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <ChartBox title="Top Countries">
                  <BarChart data={countryData} layout="vertical">
                    <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name"
                      width={isMobile ? 60 : 80}
                      tick={axisTickDim} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#FF2D2D" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ChartBox>

                <div className="rounded-sm overflow-hidden"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="px-4 sm:px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase" style={{ color: "#FF2D2D" }}>
                      Top Cities
                    </p>
                  </div>
                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    {cityData.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <p className="font-mono text-[0.6rem]" style={{ color: "#606060" }}>No city data yet</p>
                      </div>
                    ) : cityData.map((c, i) => (
                      <div key={c.name} className="px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span className="font-mono text-[0.5rem] w-4 text-right shrink-0"
                            style={{ color: "#404040" }}>{i + 1}</span>
                          <div className="min-w-0">
                            <p className="font-mono text-[0.58rem] sm:text-[0.6rem] truncate"
                              style={{ color: "#A0A0A0" }}>{c.name.split(",")[0]}</p>
                            <p className="font-mono text-[0.5rem] sm:text-[0.55rem]"
                              style={{ color: "#606060" }}>{c.name.split(",")[1]?.trim()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <div className="w-12 sm:w-20 h-1 rounded-full overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full"
                              style={{ background: "#FF2D2D", width: `${(c.value / (cityData[0]?.value || 1)) * 100}%` }} />
                          </div>
                          <span className="font-mono text-[0.58rem] sm:text-[0.6rem] w-5 text-right"
                            style={{ color: "#FF2D2D" }}>{c.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <ChartBox title="Pages Visited">
                  <BarChart data={pageData}>
                    <XAxis dataKey="name" tick={axisTickDim} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={isMobile ? 20 : 30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#FF6B35" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ChartBox>

                <div className="rounded-sm p-4 sm:p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-4 sm:mb-5"
                    style={{ color: "#FF2D2D" }}>Device Split</p>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div style={{ minWidth: 0, flex: "0 0 50%" }}>
                      <ResponsiveContainer width="100%" height={isMobile ? 130 : 160}>
                        <PieChart>
                          <Pie data={deviceData} cx="50%" cy="50%"
                            innerRadius={isMobile ? 30 : 40}
                            outerRadius={isMobile ? 55 : 70}
                            paddingAngle={3} dataKey="value">
                            {deviceData.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i]} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 sm:space-y-3 min-w-0">
                      {deviceData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SOURCE_COLORS[i] }} />
                          <div className="min-w-0">
                            <p className="font-mono text-[0.52rem] sm:text-[0.6rem] uppercase truncate"
                              style={{ color: "#A0A0A0" }}>{d.name}</p>
                            <p className="font-display text-base sm:text-lg leading-none"
                              style={{ color: SOURCE_COLORS[i] }}>{d.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <ChartBox title="Browser Split" height={160}>
                <BarChart data={browserData}>
                  <XAxis dataKey="name" tick={axisTickDim} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={isMobile ? 20 : 30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {browserData.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartBox>

              {/* Live activity feed */}
              <div className="rounded-sm overflow-hidden"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between px-4 sm:px-5 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF2D2D" }} />
                    <span className="font-mono text-[0.58rem] sm:text-[0.6rem] tracking-[0.25em] uppercase"
                      style={{ color: "#FF2D2D" }}>Live Visitor Activity</span>
                  </div>
                  <span className="font-mono text-[0.55rem] sm:text-[0.58rem]" style={{ color: "#606060" }}>
                    Last {Math.min(userActivity.length, 20)}
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {userActivity.slice(0, 20).map((a, i) => (
                    <motion.div key={a.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span className="text-sm sm:text-base shrink-0">
                          {a.device === "Mobile" ? "📱" : "🖥️"}
                        </span>
                        <div className="min-w-0">
                          {/* FIX: truncate browser/location line */}
                          <p className="font-mono text-[0.52rem] sm:text-[0.6rem] truncate"
                            style={{ color: "#A0A0A0" }}>
                            {a.browser} · {a.city && a.city !== "Unknown" ? `${a.city}, ` : ""}{a.country}
                          </p>
                          <p className="font-mono text-[0.5rem] sm:text-[0.55rem]" style={{ color: "#606060" }}>
                            visited <span style={{ color: "#FF2D2D" }}>{a.page}</span>
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[0.5rem] sm:text-[0.55rem] shrink-0"
                        style={{ color: "#404040" }}>
                        {timeAgo(a.created_at)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════ CI/CD PIPELINE ══════════ */}
          {activeTab === "pipeline" && (
            <motion.div key="pipeline"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} className="space-y-3 sm:space-y-4">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                <StatCard label="Total Runs"   value={pipelineRuns.length} color="#FF2D2D" />
                <StatCard label="Successful"   value={pipelineRuns.filter((r) => r.status === "success").length} color="#C8FF00" />
                <StatCard label="Failed"       value={pipelineRuns.filter((r) => r.status === "failed").length}  color="#FF2D2D" />
                <StatCard label="Success Rate"
                  value={`${pipelineRuns.length ? Math.round((pipelineRuns.filter((r) => r.status === "success").length / pipelineRuns.length) * 100) : 0}%`}
                  color="#C8FF00" />
              </div>

              <div className="rounded-sm overflow-hidden"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between px-4 sm:px-5 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF2D2D" }} />
                    <span className="font-mono text-[0.58rem] sm:text-[0.6rem] tracking-[0.25em] uppercase"
                      style={{ color: "#FF2D2D" }}>Pipeline Run History</span>
                  </div>
                  {/* FIX: hide long subtitle on mobile */}
                  <span className="font-mono text-[0.55rem] sm:text-[0.58rem] hidden sm:block"
                    style={{ color: "#606060" }}>
                    GitHub Actions · auto-deploy on push
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {pipelineRuns.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="font-mono text-[0.6rem]" style={{ color: "#606060" }}>
                        No runs yet — push to main to trigger
                      </p>
                    </div>
                  ) : pipelineRuns.map((r, i) => (
                    <motion.div key={r.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4"
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-2)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                      style={{ transition: "background 0.2s ease" }}>
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <span className="text-base sm:text-xl shrink-0">
                          {r.status === "success" ? "✅" : "❌"}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                            <span className="font-mono text-[0.56rem] sm:text-[0.6rem] uppercase tracking-wider"
                              style={{ color: r.status === "success" ? "#C8FF00" : "#FF2D2D" }}>
                              Run #{r.run_number}
                            </span>
                            <span className="font-mono text-[0.5rem] sm:text-[0.55rem] px-1.5 py-0.5 rounded-sm"
                              style={{
                                background: r.deployed ? "rgba(200,255,0,0.1)" : "rgba(255,255,255,0.04)",
                                color:      r.deployed ? "#C8FF00" : "#606060",
                              }}>
                              {r.deployed ? "deployed" : "skipped"}
                            </span>
                          </div>
                          {/* FIX: truncate long trigger text */}
                          <p className="font-mono text-[0.5rem] sm:text-[0.55rem] truncate"
                            style={{ color: "#606060" }}>
                            {r.trigger}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-[0.56rem] sm:text-[0.6rem] uppercase"
                          style={{ color: r.status === "success" ? "#C8FF00" : "#FF2D2D" }}>
                          {r.status}
                        </p>
                        <p className="font-mono text-[0.5rem] sm:text-[0.55rem]" style={{ color: "#606060" }}>
                          {timeAgo(r.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}