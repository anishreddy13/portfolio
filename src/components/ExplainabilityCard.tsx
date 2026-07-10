"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Zap, AlertTriangle } from "lucide-react";

interface FeatureImpact {
  feature: string;
  value: number;
  impact: number;
  direction: "positive" | "negative";
}

interface XAIPayload {
  recommendation: "BUY" | "SELL";
  confidence: number;
  base_value: number;
  features: FeatureImpact[];
  summary: string;
}

interface ExplainabilityCardProps {
  data: XAIPayload | null;
}

export default function ExplainabilityCard({ data }: ExplainabilityCardProps) {
  if (!data) return null;

  const isBuy = data.recommendation === "BUY";
  
  // Format data for Recharts Diverging Bar Chart
  const chartData = data.features.map(f => ({
    name: f.feature,
    impact: f.impact,
    value: f.value,
    direction: f.direction
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-[#0A0A0A] border border-[#333] p-3 rounded-sm shadow-xl font-mono text-xs">
          <p className="text-[var(--text-primary)] mb-1 uppercase tracking-widest">{p.name}</p>
          <p className="text-[var(--text-secondary)]">Current Value: {p.value}</p>
          <p style={{ color: p.direction === 'positive' ? '#C8FF00' : '#FF2D2D' }}>
            Impact: {p.impact > 0 ? '+' : ''}{p.impact.toFixed(3)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-sm p-6 relative overflow-hidden flex flex-col gap-6"
      style={{ 
        background: "var(--surface-1)", 
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header & Recommendation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-5">
        <div>
          <p className="font-mono text-[0.6rem] tracking-widest uppercase text-[var(--text-tertiary)] mb-2">
            Explainable AI (XAI)
          </p>
          <h3 className="font-display text-xl text-[var(--text-primary)]">
            Model Recommendation
          </h3>
        </div>
        
        <div 
          className="flex items-center gap-4 px-5 py-3 rounded-sm"
          style={{ 
            background: isBuy ? "rgba(200,255,0,0.05)" : "rgba(255,45,45,0.05)",
            border: `1px solid ${isBuy ? "rgba(200,255,0,0.2)" : "rgba(255,45,45,0.2)"}`
          }}
        >
          <div className="flex flex-col">
            <span className="font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-secondary)] mb-1">
              Verdict
            </span>
            <span 
              className="font-display text-2xl"
              style={{ color: isBuy ? "#C8FF00" : "#FF2D2D" }}
            >
              {data.recommendation}
            </span>
          </div>
          <div className="w-[1px] h-10 bg-[rgba(255,255,255,0.1)] mx-2" />
          <div className="flex flex-col">
            <span className="font-mono text-[0.55rem] uppercase tracking-widest text-[var(--text-secondary)] mb-1">
              Confidence
            </span>
            <span className="font-mono text-xl text-[var(--text-primary)]">
              {data.confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Summary */}
      <div className="flex items-start gap-3 p-4 rounded-sm bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
        {isBuy ? <Zap size={18} color="#C8FF00" className="mt-0.5 shrink-0" /> : <AlertTriangle size={18} color="#FF2D2D" className="mt-0.5 shrink-0" />}
        <p className="font-body text-sm leading-relaxed text-[var(--text-secondary)]">
          {data.summary}
        </p>
      </div>

      {/* SHAP Diverging Bar Chart */}
      <div className="flex flex-col gap-2">
        <p className="font-mono text-[0.6rem] tracking-widest uppercase text-[var(--text-tertiary)] mb-2">
          SHAP Feature Contributions
        </p>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'monospace' }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
              <Bar dataKey="impact" barSize={16} radius={[2, 2, 2, 2]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.direction === 'positive' ? '#C8FF00' : '#FF2D2D'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
