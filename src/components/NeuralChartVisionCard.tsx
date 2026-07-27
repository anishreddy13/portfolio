"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  CandlestickChart,
  ScanLine,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface NeuralPattern {
  id: string;
  label: string;
  probability: number;
  active: boolean;
}

interface NeuralChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NeuralChartVisionPayload {
  ticker: string;
  as_of: string;
  window_start: string;
  window_end: string;
  mode: "deep_learning" | "heuristic_fallback";
  model_ready: boolean;
  current_price: number;
  forward_return_prediction: number;
  forward_return_percent: number;
  direction: "bullish" | "bearish";
  confidence_score: number;
  patterns: NeuralPattern[];
  chart: NeuralChartPoint[];
  summary: string;
  error?: string;
}

interface NeuralChartVisionCardProps {
  data: NeuralChartVisionPayload | null;
}

function formatDate(value: string) {
  const [, month, day] = value.split("-");
  return `${month}/${day}`;
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function compactVolume(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="rounded-sm border border-[rgba(255,255,255,0.1)] bg-[#050505] p-3 shadow-xl">
      <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-tertiary)]">
        {label}
      </p>
      <p className="font-mono text-xs text-[var(--text-primary)]">
        Close: ${Number(row.close).toFixed(2)}
      </p>
      <p className="font-mono text-xs text-[var(--text-secondary)]">
        Volume: {compactVolume(Number(row.volume))}
      </p>
    </div>
  );
}

export default function NeuralChartVisionCard({ data }: NeuralChartVisionCardProps) {
  if (!data || data.error) return null;

  const isBullish = data.direction === "bullish";
  const sortedPatterns = [...(data.patterns || [])].sort((a, b) => b.probability - a.probability);
  const chartData = (data.chart || []).map((point) => ({
    ...point,
    label: formatDate(point.date),
    volumeScaled: point.volume / 1_000_000,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-sm border border-[rgba(255,255,255,0.08)] bg-[var(--surface-1)] p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-4 border-b border-[rgba(255,255,255,0.06)] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ScanLine size={15} className="text-[#4DA3FF]" />
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-tertiary)]">
              Neural Chart Vision
            </p>
          </div>
          <h3 className="font-display text-2xl text-[var(--text-primary)]">
            {data.ticker} Visual Pattern Read
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="min-w-[110px] rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] px-3 py-2">
            <p className="mb-1 font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-tertiary)]">
              Price
            </p>
            <p className="font-mono text-sm text-[var(--text-primary)]">
              ${Number(data.current_price).toFixed(2)}
            </p>
          </div>
          <div className="min-w-[110px] rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] px-3 py-2">
            <p className="mb-1 font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-tertiary)]">
              5D Return
            </p>
            <p className="flex items-center gap-1 font-mono text-sm" style={{ color: isBullish ? "#C8FF00" : "#FF5A5F" }}>
              {isBullish ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {formatPercent(data.forward_return_percent)}
            </p>
          </div>
          <div className="min-w-[110px] rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] px-3 py-2">
            <p className="mb-1 font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-tertiary)]">
              Confidence
            </p>
            <p className="font-mono text-sm text-[#4DA3FF]">
              {Math.round(data.confidence_score * 100)}%
            </p>
          </div>
          <div className="min-w-[110px] rounded-sm border border-[rgba(255,255,255,0.06)] bg-[#050505] px-3 py-2">
            <p className="mb-1 font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-tertiary)]">
              Engine
            </p>
            <p className="flex items-center gap-1 font-mono text-sm text-[var(--text-primary)]">
              {data.model_ready ? <BrainCircuit size={14} className="text-[#C8FF00]" /> : <Activity size={14} className="text-[#FFB020]" />}
              {data.model_ready ? "DL" : "Live"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="min-h-[280px] rounded-sm border border-[rgba(255,255,255,0.05)] bg-[#050505] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CandlestickChart size={15} className="text-[#C8FF00]" />
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-tertiary)]">
                Live Price Window
              </p>
            </div>
            <p className="font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-tertiary)]">
              As of {data.as_of}
            </p>
          </div>
          <div className="h-[245px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="neuralPriceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4DA3FF" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#4DA3FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={22}
                  tick={{ fill: "var(--text-tertiary)", fontSize: 10, fontFamily: "monospace" }}
                />
                <YAxis
                  yAxisId="price"
                  domain={["dataMin", "dataMax"]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--text-tertiary)", fontSize: 10, fontFamily: "monospace" }}
                />
                <YAxis yAxisId="volume" hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="volume" dataKey="volumeScaled" fill="rgba(255,176,32,0.18)" barSize={2} />
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="#4DA3FF"
                  strokeWidth={2}
                  fill="url(#neuralPriceFill)"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-sm border border-[rgba(255,255,255,0.05)] bg-[#050505] p-4">
          <p className="mb-4 font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-tertiary)]">
            Pattern Probabilities
          </p>
          <div className="space-y-3">
            {sortedPatterns.map((pattern) => {
              const percent = Math.round(pattern.probability * 100);
              const color = pattern.active ? "#C8FF00" : "#4DA3FF";
              return (
                <div key={pattern.id}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="truncate font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-secondary)]">
                      {pattern.label}
                    </span>
                    <span className="font-mono text-[0.65rem] text-[var(--text-primary)]">
                      {percent}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-sm bg-[rgba(255,255,255,0.06)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-sm"
                      style={{ background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-sm border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-4">
        <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
          {data.summary}
        </p>
        {!data.model_ready && (
          <p className="mt-3 font-mono text-[0.58rem] uppercase tracking-widest text-[#FFB020]">
            Waiting for trained model bundle. Showing live fallback with the same production payload shape.
          </p>
        )}
      </div>
    </motion.div>
  );
}
