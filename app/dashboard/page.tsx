"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  LineChart, Line, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell,
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

// ─── Constants ────────────────────────────────────────────────
const SENTIMENT_COLORS = {
  Positive: "#C8FF00",
  Neutral:  "#A855F7",
  Negative: "#FF2D2D",
};

const SOURCE_COLORS = [
  "#FF2D2D", "#FF6B35", "#C8FF00", "#A855F7", "#ffffff",
];

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

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({
  label, value, sub, color = "#FF2D2D",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
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
      <p
        className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-2"
        style={{ color: "#606060" }}
      >
        {label}
      </p>
      <p
        className="font-display text-3xl leading-none"
        style={{ color }}
      >
        {value}
      </p>
      {sub && (
        <p
          className="font-mono text-[0.58rem] mt-1.5"
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
      className="rounded-sm px-3 py-2"
      style={{
        background: "var(--surface-2)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <p className="font-mono text-[0.6rem] mb-1" style={{ color: "#606060" }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-mono text-[0.65rem]" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<"live" | "analytics">("live");
  const [page,        setPage]        = useState(1);

  // ── Derived stats ──────────────────────────────────────────
  const sentimentCounts = predictions.reduce(
    (acc, p) => {
      acc[p.sentiment] = (acc[p.sentiment] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const sourceCounts = predictions.reduce(
    (acc, p) => {
      acc[p.source] = (acc[p.source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const avgConfidence = predictions.length
    ? (predictions.reduce((a, p) => a + p.confidence, 0) / predictions.length).toFixed(1)
    : "0";

  const pieData = Object.entries(sentimentCounts).map(([name, value]) => ({
    name, value,
  }));

  const sourceData = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // ── Timeline chart data (group by hour) ───────────────────
  const timelineData = (() => {
    const grouped: Record<string, { Positive: number; Negative: number; Neutral: number }> = {};
    predictions.forEach((p) => {
      const hour = new Date(p.processed_at).toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit",
      });
      if (!grouped[hour]) grouped[hour] = { Positive: 0, Negative: 0, Neutral: 0 };
      grouped[hour][p.sentiment as keyof typeof grouped[string]]++;
    });
    return Object.entries(grouped)
      .slice(-12)
      .map(([time, counts]) => ({ time, ...counts }));
  })();

  // ── Confidence distribution ────────────────────────────────
  const confidenceData = [
    { range: "90-100%", count: predictions.filter(p => p.confidence >= 90).length },
    { range: "80-90%",  count: predictions.filter(p => p.confidence >= 80 && p.confidence < 90).length },
    { range: "70-80%",  count: predictions.filter(p => p.confidence >= 70 && p.confidence < 80).length },
    { range: "<70%",    count: predictions.filter(p => p.confidence < 70).length },
  ];

  // ── Fetch data ─────────────────────────────────────────────
  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { count } = await supabase
        .from("news_predictions")
        .select("*", { count: "exact", head: true });

      setTotal(count || 0);

      const from = (pageNum - 1) * PAGE_SIZE;
      const { data, error } = await supabase
        .from("news_predictions")
        .select("*")
        .order("processed_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;
      setPredictions(data || []);
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Real-time subscription ─────────────────────────────────
  useEffect(() => {
    fetchData(page);

    const channel = supabase
      .channel("news_predictions_live")
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "news_predictions",
        },
        (payload) => {
          setPredictions((prev) => [
            payload.new as Prediction,
            ...prev.slice(0, PAGE_SIZE - 1),
          ]);
          setTotal((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--surface-0)" }}
    >
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-50 px-4 sm:px-8 py-4 flex items-center justify-between"
        style={{
          background:   "rgba(10,10,10,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,45,45,0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#FF2D2D", boxShadow: "0 0 8px #FF2D2D" }}
          />
          <span
            className="font-display text-xl tracking-[0.15em]"
            style={{ color: "#F0F0F0" }}
          >
            ML PRODUCTION DASHBOARD
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-sm"
            style={{
              background:  "rgba(255,45,45,0.08)",
              border:      "1px solid rgba(255,45,45,0.2)",
            }}
          >
            <span
              className="font-mono text-[0.6rem] tracking-widest uppercase"
              style={{ color: "#FF2D2D" }}
            >
              {total.toLocaleString()} predictions
            </span>
          </div>

          <a
            href="/"
            className="font-mono text-[0.6rem] tracking-widest uppercase transition-colors duration-200"
            style={{ color: "#606060" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F0F0F0")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#606060")}
          >
            ← Portfolio
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-8">
          {(["live", "analytics"] as const).map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2.5 rounded-sm font-mono text-[0.65rem] uppercase tracking-widest transition-all duration-200"
              style={{
                background:  activeTab === tab ? "#FF2D2D" : "var(--surface-1)",
                color:       activeTab === tab ? "#fff" : "#606060",
                border:      `1px solid ${activeTab === tab ? "#FF2D2D" : "rgba(255,255,255,0.06)"}`,
                boxShadow:   activeTab === tab ? "0 0 20px rgba(255,45,45,0.3)" : "none",
              }}
            >
              {tab === "live" ? "🔴 Live Feed" : "📊 Analytics"}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ════════════ LIVE FEED TAB ════════════ */}
          {activeTab === "live" && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Total Predictions"
                  value={total.toLocaleString()}
                  sub="all time"
                  color="#FF2D2D"
                />
                <StatCard
                  label="Avg Confidence"
                  value={`${avgConfidence}%`}
                  sub="current page"
                  color="#C8FF00"
                />
                <StatCard
                  label="Positive"
                  value={sentimentCounts["Positive"] || 0}
                  sub={`${predictions.length ? Math.round(((sentimentCounts["Positive"] || 0) / predictions.length) * 100) : 0}% of page`}
                  color="#C8FF00"
                />
                <StatCard
                  label="Negative"
                  value={sentimentCounts["Negative"] || 0}
                  sub={`${predictions.length ? Math.round(((sentimentCounts["Negative"] || 0) / predictions.length) * 100) : 0}% of page`}
                  color="#FF2D2D"
                />
              </div>

              <div
                className="rounded-sm overflow-hidden"
                style={{
                  background: "var(--surface-1)",
                  border:     "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: "#FF2D2D" }}
                    />
                    <span
                      className="font-mono text-[0.6rem] tracking-[0.25em] uppercase"
                      style={{ color: "#FF2D2D" }}
                    >
                      Live Predictions
                    </span>
                  </div>
                  <span
                    className="font-mono text-[0.58rem]"
                    style={{ color: "#606060" }}
                  >
                    Page {page} of {totalPages}
                  </span>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 rounded-full"
                      style={{
                        borderColor:    "rgba(255,45,45,0.2)",
                        borderTopColor: "#FF2D2D",
                      }}
                    />
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <AnimatePresence>
                      {predictions.map((p, i) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="px-5 py-4 flex items-start justify-between gap-4 group"
                          style={{ transition: "background 0.2s ease" }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.background = "var(--surface-2)")
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.background = "transparent")
                          }
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="font-mono text-[0.55rem] uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                                style={{
                                  background: "var(--surface-3)",
                                  color:      "#606060",
                                }}
                              >
                                {p.source}
                              </span>
                              <span
                                className="font-mono text-[0.55rem]"
                                style={{ color: "#404040" }}
                              >
                                {timeAgo(p.processed_at)}
                              </span>
                            </div>
                            <a
                              href={p.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-body text-sm leading-snug line-clamp-2 transition-colors duration-200"
                              style={{ color: "#A0A0A0" }}
                              onMouseEnter={(e) =>
                                ((e.target as HTMLElement).style.color = "#F0F0F0")
                              }
                              onMouseLeave={(e) =>
                                ((e.target as HTMLElement).style.color = "#A0A0A0")
                              }
                            >
                              {p.title}
                            </a>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="flex items-center gap-1.5 justify-end mb-1">
                              <span className="text-base">
                                {sentimentEmoji(p.sentiment)}
                              </span>
                              <span
                                className="font-mono text-[0.62rem] uppercase tracking-wider"
                                style={{
                                  color: SENTIMENT_COLORS[p.sentiment as keyof typeof SENTIMENT_COLORS] || "#A0A0A0",
                                }}
                              >
                                {p.sentiment}
                              </span>
                            </div>
                            <span
                              className="font-mono text-[0.58rem]"
                              style={{ color: "#606060" }}
                            >
                              {p.confidence.toFixed(1)}%
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <motion.button
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); }}
                    disabled={page === 1}
                    whileTap={{ scale: 0.97 }}
                    className="font-mono text-[0.6rem] uppercase tracking-widest px-4 py-2 rounded-sm transition-all duration-200 disabled:opacity-30"
                    style={{
                      background:  "var(--surface-2)",
                      color:       "#A0A0A0",
                      border:      "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    ← Prev
                  </motion.button>

                  <span
                    className="font-mono text-[0.58rem]"
                    style={{ color: "#606060" }}
                  >
                    {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
                  </span>

                  <motion.button
                    onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); }}
                    disabled={page === totalPages}
                    whileTap={{ scale: 0.97 }}
                    className="font-mono text-[0.6rem] uppercase tracking-widest px-4 py-2 rounded-sm transition-all duration-200 disabled:opacity-30"
                    style={{
                      background:  "#FF2D2D",
                      color:       "#fff",
                      border:      "none",
                    }}
                  >
                    Next →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════ ANALYTICS TAB ════════════ */}
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Total Predictions"
                  value={total.toLocaleString()}
                  color="#FF2D2D"
                />
                <StatCard
                  label="Avg Confidence"
                  value={`${avgConfidence}%`}
                  color="#C8FF00"
                />
                <StatCard
                  label="Sources Tracked"
                  value={Object.keys(sourceCounts).length}
                  color="#FF6B35"
                />
                <StatCard
                  label="Positive Rate"
                  value={`${predictions.length ? Math.round(((sentimentCounts["Positive"] || 0) / predictions.length) * 100) : 0}%`}
                  color="#C8FF00"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div
                  className="rounded-sm p-5"
                  style={{
                    background: "var(--surface-1)",
                    border:     "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p
                    className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}
                  >
                    Sentiment Over Time
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timelineData}>
                      <XAxis
                        dataKey="time"
                        tick={{ fill: "#404040", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#404040", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Positive" stroke="#C8FF00" fill="rgba(200,255,0,0.08)" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="Neutral"  stroke="#A855F7" fill="rgba(168,85,247,0.06)" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="Negative" stroke="#FF2D2D" fill="rgba(255,45,45,0.06)"  strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div
                  className="rounded-sm p-5"
                  style={{
                    background: "var(--surface-1)",
                    border:     "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p
                    className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}
                  >
                    Sentiment Distribution
                  </p>
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="60%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || "#606060"}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {pieData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              background: SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || "#606060",
                            }}
                          />
                          <div>
                            <p className="font-mono text-[0.6rem] uppercase" style={{ color: "#A0A0A0" }}>
                              {entry.name}
                            </p>
                            <p
                              className="font-display text-lg leading-none"
                              style={{
                                color: SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || "#606060",
                              }}
                            >
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
                <div
                  className="rounded-sm p-5"
                  style={{
                    background: "var(--surface-1)",
                    border:     "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p
                    className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}
                  >
                    Predictions by Source
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sourceData} layout="vertical">
                      <XAxis
                        type="number"
                        tick={{ fill: "#404040", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "#606060", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                        {sourceData.map((_, i) => (
                          <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div
                  className="rounded-sm p-5"
                  style={{
                    background: "var(--surface-1)",
                    border:     "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p
                    className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                    style={{ color: "#FF2D2D" }}
                  >
                    Confidence Distribution
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={confidenceData}>
                      <XAxis
                        dataKey="range"
                        tick={{ fill: "#606060", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#404040", fontSize: 9, fontFamily: "DM Mono" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#FF2D2D" radius={[2, 2, 0, 0]}>
                        {confidenceData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              entry.range === "90-100%" ? "#C8FF00"
                              : entry.range === "80-90%"  ? "#FF6B35"
                              : entry.range === "70-80%"  ? "#A855F7"
                              : "#FF2D2D"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                className="rounded-sm p-5"
                style={{
                  background: "var(--surface-1)",
                  border:     "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="font-mono text-[0.58rem] tracking-[0.25em] uppercase mb-5"
                  style={{ color: "#FF2D2D" }}
                >
                  Pipeline Status
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "RSS Ingestion",      status: "Running",   detail: "Every 5 minutes",      color: "#C8FF00" },
                    { label: "Prediction Worker",   status: "Running",   detail: "Real-time inference",  color: "#C8FF00" },
                    { label: "Redis Pub/Sub",       status: "Connected", detail: "Upstash serverless",   color: "#C8FF00" },
                    { label: "Supabase",            status: "Healthy",   detail: `${total.toLocaleString()} rows stored`, color: "#C8FF00" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-sm p-4"
                      style={{
                        background: "var(--surface-2)",
                        border:     "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: item.color }}
                        />
                        <span
                          className="font-mono text-[0.55rem] uppercase tracking-wider"
                          style={{ color: item.color }}
                        >
                          {item.status}
                        </span>
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
        </AnimatePresence>
      </div>
    </div>
  );
}