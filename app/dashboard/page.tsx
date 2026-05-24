"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────
interface Prediction {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  link: string;
  sentiment: string;
  confidence: number;
  scores: Record<string, number>;
  processed_at: string;
}

interface ModelVersion {
  id: string;
  version: string;
  accuracy: float;
  f1_score: number;
  stage: string;
  retrain_reason: string;
  deployed_at: string;
}

interface DriftReport {
  id: string;
  drift_detected: boolean;
  accuracy: number;
  drift_score: number;
  action_taken: string;
  sample_size: number;
  created_at: string;
}

interface UserActivity {
  id: string;
  session_id: string;
  page: string;
  event_type: string;
  browser: string;
  os: string;
  device: string;
  country: string;
  city: string;
  created_at: string;
}

interface PipelineRun {
  id: string;
  run_number: number;
  status: string;
  trigger: string;
  old_accuracy: number;
  new_accuracy: number;
  deployed: boolean;
  reason: string;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────
const SENTIMENT_COLORS = {
  Positive: "#C8FF00",
  Neutral:  "#A855F7",
  Negative: "#FF2D2D",
};

const SOURCE_COLORS = ["#FF2D2D", "#FF6B35", "#C8FF00", "#A855F7", "#ffffff"];
const PAGE_SIZE = 20;

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

function sentimentEmoji(s: string): string {
  if (s === "Positive") return "😊";
  if (s === "Negative") return "😔";
  return "😐";
}

// ─── Components ───────────────────────────────────────────────
function StatCard({
  label, value, sub, color = "#FF2D2D",
}: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-sm p-5"
      style={{
        background: "var(--surface-1)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-2"
        style={{ color: "#606060" }}>{label}</p>
      <p className="font-display text-3xl leading-none" style={{ color }}>
        {value}
      </p>
      {sub && (
        <p className="font-mono text-[0.58rem] mt-1.5" style={{ color: "#606060" }}>
          {sub}
        </p>
      )}
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm px-3 py-2"
      style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="font-mono text-[0.6rem] mb-1" style={{ color: "#606060" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-mono text-[0.65rem]" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const [predictions,    setPredictions]    = useState<Prediction[]>([]);
  const [modelVersions,  setModelVersions]  = useState<ModelVersion[]>([]);
  const [driftReports,   setDriftReports]   = useState<DriftReport[]>([]);
  const [userActivity,   setUserActivity]   = useState<UserActivity[]>([]);
  const [pipelineRuns,   setPipelineRuns]   = useState<PipelineRun[]>([]);
  const [total,          setTotal]          = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState<"live" | "analytics" | "monitoring" | "visitors" | "pipeline">("live");
  const [page,           setPage]           = useState(1);

  // ── Derived stats ──────────────────────────────────────────
  const sentimentCounts = predictions.reduce((acc, p) => {
    acc[p.sentiment] = (acc[p.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceCounts = predictions.reduce((acc, p) => {
    acc[p.source] = (acc[p.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgConfidence = predictions.length
    ? (predictions.reduce((a, p) => a + p.confidence, 0) / predictions.length).toFixed(1)
    : "0";

  const pieData = Object.entries(sentimentCounts).map(([name, value]) => ({ name, value }));

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
    { range: "90-100%", count: predictions.filter(p => p.confidence >= 90).length },
    { range: "80-90%",  count: predictions.filter(p => p.confidence >= 80 && p.confidence < 90).length },
    { range: "70-80%",  count: predictions.filter(p => p.confidence >= 70 && p.confidence < 80).length },
    { range: "<70%",    count: predictions.filter(p => p.confidence < 70).length },
  ];

  // Visitor analytics
  const countryCounts = userActivity.reduce((acc, a) => {
    if (a.country && a.country !== "Unknown") {
      acc[a.country] = (acc[a.country] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const pageCounts = userActivity.reduce((acc, a) => {
    acc[a.page] = (acc[a.page] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceCounts = userActivity.reduce((acc, a) => {
    acc[a.device] = (acc[a.device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const browserCounts = userActivity.reduce((acc, a) => {
    acc[a.browser] = (acc[a.browser] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countryData = Object.entries(countryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const pageData = Object.entries(pageCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const deviceData = Object.entries(deviceCounts)
    .map(([name, value]) => ({ name, value }));

  const browserData = Object.entries(browserCounts)
    .map(([name, value]) => ({ name, value }));

  // Accuracy trend from model versions
  const accuracyTrend = modelVersions
    .slice()
    .reverse()
    .map(v => ({ version: v.version, accuracy: v.accuracy }));

  // Latest drift status
  const latestDrift = driftReports[0];
  const driftStatus = latestDrift?.drift_detected ? "⚠️ Drift Detected" : "✅ Stable";
  const driftColor  = latestDrift?.drift_detected ? "#FF2D2D" : "#C8FF00";

  // ── Fetch all data ─────────────────────────────────────────
  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      // Total count
      const { count } = await supabase
        .from("news_predictions")
        .select("*", { count: "exact", head: true });
      setTotal(count || 0);

      // Predictions
      const from = (pageNum - 1) * PAGE_SIZE;
      const { data: predData } = await supabase
        .from("news_predictions")
        .select("*")
        .order("processed_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      setPredictions(predData || []);

      // Model versions
      const { data: versionsData } = await supabase
        .from("model_versions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      setModelVersions(versionsData || []);

      // Drift reports
      const { data: driftData } = await supabase
        .from("drift_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setDriftReports(driftData || []);

      // User activity
      const { data: activityData } = await supabase
        .from("user_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      setUserActivity(activityData || []);

      // Pipeline runs
      const { data: pipelineData } = await supabase
        .from("pipeline_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setPipelineRuns(pipelineData || []);

    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Real-time subscription ─────────────────────────────────
  useEffect(() => {
    fetchData(page);

    const predChannel = supabase
      .channel("predictions_live")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "news_predictions",
      }, (payload) => {
        setPredictions(prev => [payload.new as Prediction, ...prev.slice(0, PAGE_SIZE - 1)]);
        setTotal(prev => prev + 1);
      })
      .subscribe();

    const driftChannel = supabase
      .channel("drift_live")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "drift_reports",
      }, (payload) => {
        setDriftReports(prev => [payload.new as DriftReport, ...prev.slice(0, 19)]);
      })
      .subscribe();

    const versionChannel = supabase
      .channel("versions_live")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "model_versions",
      }, (payload) => {
        setModelVersions(prev => [payload.new as ModelVersion, ...prev.slice(0, 9)]);
      })
      .subscribe();

    const activityChannel = supabase
      .channel("activity_live")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "user_activity",
      }, (payload) => {
        setUserActivity(prev => [payload.new as UserActivity, ...prev.slice(0, 199)]);
      })
      .subscribe();

    const pipelineChannel = supabase
      .channel("pipeline_live")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "pipeline_runs",
      }, (payload) => {
        setPipelineRuns(prev => [payload.new as PipelineRun, ...prev.slice(0, 19)]);
      })
      .subscribe();

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
    { id: "live",       label: "🔴 Live Feed"      },
    { id: "analytics",  label: "📊 ML Analytics"   },
    { id: "monitoring", label: "🔬 Monitoring"      },
    { id: "visitors",   label: "👥 Visitors"        },
    { id: "pipeline",   label: "⚙️ CI/CD Pipeline" },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>

      {/* ── Header ── */}
      <div
        className="sticky top-0 z-50 px-4 sm:px-8 py-4 flex items-center justify-between"
        style={{
          background:     "rgba(10,10,10,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom:   "1px solid rgba(255,45,45,0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#FF2D2D", boxShadow: "0 0 8px #FF2D2D" }} />
          <span className="font-display text-xl tracking-[0.15em]"
            style={{ color: "#F0F0F0" }}>
            ML PRODUCTION DASHBOARD
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Drift status badge */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-sm"
            style={{
              background:  `${driftColor}15`,
              border:      `1px solid ${driftColor}40`,
            }}
          >
            <span className="font-mono text-[0.58rem] tracking-widest uppercase"
              style={{ color: driftColor }}>
              {driftStatus}
            </span>
          </div>
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-sm"
            style={{
              background:  "rgba(255,45,45,0.08)",
              border:      "1px solid rgba(255,45,45,0.2)",
            }}
          >
            <span className="font-mono text-[0.6rem] tracking-widest uppercase"
              style={{ color: "#FF2D2D" }}>
              {total.toLocaleString()} predictions
            </span>
          </div>
          <a href="/"
            className="font-mono text-[0.6rem] tracking-widest uppercase transition-colors duration-200"
            style={{ color: "#606060" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F0F0F0")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#606060")}
          >
            ← Portfolio
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">

        {/* ── Tabs ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2 rounded-sm font-mono text-[0.62rem] uppercase tracking-widest"
              style={{
                background:  activeTab === tab.id ? "#FF2D2D" : "var(--surface-1)",
                color:       activeTab === tab.id ? "#fff" : "#606060",
                border:      `1px solid ${activeTab === tab.id ? "#FF2D2D" : "rgba(255,255,255,0.06)"}`,
                boxShadow:   activeTab === tab.id ? "0 0 20px rgba(255,45,45,0.3)" : "none",
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
              exit={{ opacity: 0, y: -12 }} className="space-y-4">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total Predictions" value={total.toLocaleString()} sub="all time" color="#FF2D2D" />
                <StatCard label="Avg Confidence" value={`${avgConfidence}%`} sub="current page" color="#C8FF00" />
                <StatCard label="Positive" value={sentimentCounts["Positive"] || 0}
                  sub={`${predictions.length ? Math.round(((sentimentCounts["Positive"] || 0) / predictions.length) * 100) : 0}%`}
                  color="#C8FF00" />
                <StatCard label="Negative" value={sentimentCounts["Negative"] || 0}
                  sub={`${predictions.length ? Math.round(((sentimentCounts["Negative"] || 0) / predictions.length) * 100) : 0}%`}
                  color="#FF2D2D" />
              </div>

              {/* Live predictions feed */}
              <div className="rounded-sm overflow-hidden"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF2D2D" }} />
                    <span className="font-mono text-[0.6rem] tracking-[0.25em] uppercase" style={{ color: "#FF2D2D" }}>
                      Live Predictions
                    </span>
                  </div>
                  <span className="font-mono text-[0.58rem]" style={{ color: "#606060" }}>
                    Page {page} of {totalPages}
                  </span>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <motion.div animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 rounded-full"
                      style={{ borderColor: "rgba(255,45,45,0.2)", borderTopColor: "#FF2D2D" }} />
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    {predictions.map((p, i) => (
                      <motion.div key={p.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="px-5 py-4 flex items-start justify-between gap-4"
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-2)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                        style={{ transition: "background 0.2s ease" }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[0.55rem] uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                              style={{ background: "var(--surface-3)", color: "#606060" }}>
                              {p.source}
                            </span>
                            <span className="font-mono text-[0.55rem]" style={{ color: "#404040" }}>
                              {timeAgo(p.processed_at)}
                            </span>
                          </div>
                          <a href={p.link} target="_blank" rel="noopener noreferrer"
                            className="font-body text-sm leading-snug line-clamp-2 transition-colors duration-200"
                            style={{ color: "#A0A0A0" }}
                            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F0F0F0")}
                            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#A0A0A0")}
                          >
                            {p.title}
                          </a>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="flex items-center gap-1.5 justify-end mb-1">
                            <span className="text-base">{sentimentEmoji(p.sentiment)}</span>
                            <span className="font-mono text-[0.62rem] uppercase tracking-wider"
                              style={{ color: SENTIMENT_COLORS[p.sentiment as keyof typeof SENTIMENT_COLORS] || "#A0A0A0" }}>
                              {p.sentiment}
                            </span>
                          </div>
                          <span className="font-mono text-[0.58rem]" style={{ color: "#606060" }}>
                            {p.confidence.toFixed(1)}%
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <motion.button onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1} whileTap={{ scale: 0.97 }}
                    className="font-mono text-[0.6rem] uppercase tracking-widest px-4 py-2 rounded-sm disabled:opacity-30"
                    style={{ background: "var(--surface-2)", color: "#A0A0A0", border: "1px solid rgba(255,255,255,0.06)" }}>
                    ← Prev
                  </motion.button>
                  <span className="font-mono text-[0.58rem]" style={{ color: "#606060" }}>
                    {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
                  </span>
                  <motion.button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages} whileTap={{ scale: 0.97 }}
                    className="font-mono text-[0.6rem] uppercase tracking-widest px-4 py-2 rounded-sm disabled:opacity-30"
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
              exit={{ opacity: 0, y: -12 }} className="space-y-4">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total Predictions" value={total.toLocaleString()} color="#FF2D2D" />
                <StatCard label="Avg Confidence"    value={`${avgConfidence}%`}     color="#C8FF00" />
                <StatCard label="Sources Tracked"   value={Object.keys(sourceCounts).length} color="#FF6B35" />
                <StatCard label="Positive Rate"
                  value={`${predictions.length ? Math.round(((sentimentCounts["Positive"] || 0) / predictions.length) * 100) : 0}%`}
                  color="#C8FF00" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Sentiment over time */}
                <div className="rounded-sm p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}>Sentiment Over Time</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timelineData}>
                      <XAxis dataKey="time"
                        tick={{ fill: "#404040", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#404040", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Positive" stroke="#C8FF00" fill="rgba(200,255,0,0.08)" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="Neutral"  stroke="#A855F7" fill="rgba(168,85,247,0.06)" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="Negative" stroke="#FF2D2D" fill="rgba(255,45,45,0.06)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Sentiment pie */}
                <div className="rounded-sm p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}>Sentiment Distribution</p>
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="60%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%"
                          innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {pieData.map((entry, i) => (
                            <Cell key={i}
                              fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || "#606060"} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {pieData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || "#606060" }} />
                          <div>
                            <p className="font-mono text-[0.6rem] uppercase" style={{ color: "#A0A0A0" }}>{entry.name}</p>
                            <p className="font-display text-lg leading-none"
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Source breakdown */}
                <div className="rounded-sm p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}>Predictions by Source</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sourceData} layout="vertical">
                      <XAxis type="number" tick={{ fill: "#404040", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={80}
                        tick={{ fill: "#606060", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                        {sourceData.map((_, i) => (
                          <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Confidence distribution */}
                <div className="rounded-sm p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}>Confidence Distribution</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={confidenceData}>
                      <XAxis dataKey="range" tick={{ fill: "#606060", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#404040", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                        {confidenceData.map((entry, i) => (
                          <Cell key={i}
                            fill={entry.range === "90-100%" ? "#C8FF00" : entry.range === "80-90%" ? "#FF6B35" : entry.range === "70-80%" ? "#A855F7" : "#FF2D2D"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pipeline status */}
              <div className="rounded-sm p-5"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                  style={{ color: "#FF2D2D" }}>Pipeline Status</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "RSS Ingestion",      status: "Running",   detail: "Every 5 minutes",      color: "#C8FF00" },
                    { label: "Prediction Worker",  status: "Running",   detail: "Real-time inference",  color: "#C8FF00" },
                    { label: "Drift Monitor",      status: driftStatus, detail: "Hourly checks",        color: driftColor },
                    { label: "Supabase",           status: "Healthy",   detail: `${total.toLocaleString()} rows`, color: "#C8FF00" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-sm p-4"
                      style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: item.color }} />
                        <span className="font-mono text-[0.55rem] uppercase tracking-wider"
                          style={{ color: item.color }}>{item.status}</span>
                      </div>
                      <p className="font-body text-sm font-medium mb-0.5" style={{ color: "#F0F0F0" }}>
                        {item.label}
                      </p>
                      <p className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>
                        {item.detail}
                      </p>
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
              exit={{ opacity: 0, y: -12 }} className="space-y-4">

              {/* Model versions */}
              <div className="rounded-sm overflow-hidden"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase"
                    style={{ color: "#FF2D2D" }}>Model Version History</p>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {modelVersions.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="font-mono text-[0.6rem]" style={{ color: "#606060" }}>
                        No versions yet — will appear after first retrain
                      </p>
                    </div>
                  ) : modelVersions.map((v, i) => (
                    <div key={v.id} className="px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-display text-2xl" style={{ color: i === 0 ? "#C8FF00" : "#606060" }}>
                          {v.version}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full"
                              style={{ background: v.stage === "Production" ? "#C8FF00" : "#606060" }} />
                            <span className="font-mono text-[0.58rem] uppercase tracking-wider"
                              style={{ color: v.stage === "Production" ? "#C8FF00" : "#606060" }}>
                              {v.stage}
                            </span>
                          </div>
                          <p className="font-mono text-[0.55rem]" style={{ color: "#404040" }}>
                            {v.retrain_reason || "Manual deploy"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl" style={{ color: i === 0 ? "#C8FF00" : "#A0A0A0" }}>
                          {v.accuracy?.toFixed(1)}%
                        </p>
                        <p className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>
                          {timeAgo(v.deployed_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accuracy trend */}
              {accuracyTrend.length > 1 && (
                <div className="rounded-sm p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}>Accuracy Over Versions</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={accuracyTrend}>
                      <XAxis dataKey="version"
                        tick={{ fill: "#606060", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <YAxis domain={[70, 100]}
                        tick={{ fill: "#404040", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="accuracy" stroke="#C8FF00"
                        strokeWidth={2} dot={{ fill: "#C8FF00", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Drift reports */}
              <div className="rounded-sm overflow-hidden"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase"
                    style={{ color: "#FF2D2D" }}>Drift Detection History</p>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {driftReports.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="font-mono text-[0.6rem]" style={{ color: "#606060" }}>
                        No drift checks yet — runs hourly after 50+ predictions
                      </p>
                    </div>
                  ) : driftReports.map((r) => (
                    <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {r.drift_detected ? "⚠️" : "✅"}
                        </span>
                        <div>
                          <p className="font-mono text-[0.6rem] uppercase tracking-wider mb-0.5"
                            style={{ color: r.drift_detected ? "#FF2D2D" : "#C8FF00" }}>
                            {r.drift_detected ? "Drift Detected" : "No Drift"}
                          </p>
                          <p className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>
                            {r.action_taken} · {r.sample_size} samples
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl"
                          style={{ color: r.drift_detected ? "#FF2D2D" : "#C8FF00" }}>
                          {r.accuracy?.toFixed(1)}%
                        </p>
                        <p className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>
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
              exit={{ opacity: 0, y: -12 }} className="space-y-4">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total Sessions"  value={userActivity.length}                    color="#FF2D2D" />
                <StatCard label="Countries"        value={Object.keys(countryCounts).length}      color="#FF6B35" />
                <StatCard label="Mobile Users"     value={deviceCounts["Mobile"] || 0}            color="#A855F7" sub="visitors" />
                <StatCard label="Top Page"
                  value={pageData[0]?.name || "—"}
                  sub={`${pageData[0]?.value || 0} visits`}
                  color="#C8FF00" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top countries */}
                <div className="rounded-sm p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}>Top Countries</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={countryData} layout="vertical">
                      <XAxis type="number" tick={{ fill: "#404040", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={80}
                        tick={{ fill: "#606060", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#FF2D2D" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pages visited */}
                <div className="rounded-sm p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}>Pages Visited</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={pageData}>
                      <XAxis dataKey="name" tick={{ fill: "#606060", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#404040", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#FF6B35" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Device split */}
                <div className="rounded-sm p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}>Device Split</p>
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={160}>
                      <PieChart>
                        <Pie data={deviceData} cx="50%" cy="50%"
                          innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                          {deviceData.map((_, i) => (
                            <Cell key={i} fill={SOURCE_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {deviceData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: SOURCE_COLORS[i] }} />
                          <div>
                            <p className="font-mono text-[0.6rem] uppercase" style={{ color: "#A0A0A0" }}>{d.name}</p>
                            <p className="font-display text-lg leading-none" style={{ color: SOURCE_COLORS[i] }}>{d.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Browser split */}
                <div className="rounded-sm p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}>Browser Split</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={browserData}>
                      <XAxis dataKey="name" tick={{ fill: "#606060", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#404040", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                        {browserData.map((_, i) => (
                          <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Live activity feed */}
              <div className="rounded-sm overflow-hidden"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF2D2D" }} />
                    <span className="font-mono text-[0.6rem] tracking-[0.25em] uppercase"
                      style={{ color: "#FF2D2D" }}>Live Visitor Activity</span>
                  </div>
                  <span className="font-mono text-[0.58rem]" style={{ color: "#606060" }}>
                    Last {Math.min(userActivity.length, 20)} events
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {userActivity.slice(0, 20).map((a, i) => (
                    <motion.div key={a.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="px-5 py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base">
                          {a.device === "Mobile" ? "📱" : "🖥️"}
                        </span>
                        <div>
                          <p className="font-mono text-[0.6rem]" style={{ color: "#A0A0A0" }}>
                            {a.browser} · {a.os} · {a.country}
                          </p>
                          <p className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>
                            visited <span style={{ color: "#FF2D2D" }}>{a.page}</span>
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[0.55rem] shrink-0" style={{ color: "#404040" }}>
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
              exit={{ opacity: 0, y: -12 }} className="space-y-4">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Total Runs"
                  value={pipelineRuns.length}
                  color="#FF2D2D" />
                <StatCard
                  label="Successful"
                  value={pipelineRuns.filter(r => r.status === "success").length}
                  color="#C8FF00" />
                <StatCard
                  label="Failed"
                  value={pipelineRuns.filter(r => r.status === "failed").length}
                  color="#FF2D2D" />
                <StatCard
                  label="Success Rate"
                  value={`${pipelineRuns.length ? Math.round((pipelineRuns.filter(r => r.status === "success").length / pipelineRuns.length) * 100) : 0}%`}
                  color="#C8FF00" />
              </div>

              <div className="rounded-sm overflow-hidden"
                style={{ background: "var(--surface-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF2D2D" }} />
                    <span className="font-mono text-[0.6rem] tracking-[0.25em] uppercase"
                      style={{ color: "#FF2D2D" }}>Pipeline Run History</span>
                  </div>
                  <span className="font-mono text-[0.58rem]" style={{ color: "#606060" }}>
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
                      className="px-5 py-4 flex items-center justify-between gap-4"
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-2)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                      style={{ transition: "background 0.2s ease" }}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xl">
                          {r.status === "success" ? "✅" : "❌"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[0.6rem] uppercase tracking-wider"
                              style={{ color: r.status === "success" ? "#C8FF00" : "#FF2D2D" }}>
                              Run #{r.run_number}
                            </span>
                            <span className="font-mono text-[0.55rem] px-1.5 py-0.5 rounded-sm"
                              style={{
                                background: r.deployed ? "rgba(200,255,0,0.1)" : "rgba(255,255,255,0.04)",
                                color: r.deployed ? "#C8FF00" : "#606060",
                              }}>
                              {r.deployed ? "deployed" : "not deployed"}
                            </span>
                          </div>
                          <p className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>
                            {r.trigger}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-[0.6rem] uppercase"
                          style={{ color: r.status === "success" ? "#C8FF00" : "#FF2D2D" }}>
                          {r.status}
                        </p>
                        <p className="font-mono text-[0.55rem]" style={{ color: "#606060" }}>
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
    </div>
  );
}