"use client";

import React from "react";
import { Compass, TrendingUp, Activity, BarChart2, Zap, Clock, ArrowRight } from "lucide-react";
import { useMarketRegime } from "@/hooks/useMarketRegime";

export default function MarketRegimePanel() {
  const { currentSnapshot, transitions, transitionMatrix } = useMarketRegime();

  const factorBars = [
    { label: "Trend", value: currentSnapshot.trendScore, color: "bg-lime-500" },
    { label: "Volatility", value: currentSnapshot.volatilityScore, color: "bg-amber-500" },
    { label: "Momentum", value: currentSnapshot.momentumScore, color: "bg-sky-500" },
    { label: "Mean Reversion", value: currentSnapshot.meanReversionScore, color: "bg-violet-500" },
  ];

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-lime-400" />
            Enterprise Market Regime Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Composite Factor Classification • Markov Transition Probabilities • Regime Duration Tracking
          </p>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30">
          Regime: <strong className="text-white">{currentSnapshot.regime.replace("_", " ")}</strong>
        </span>
      </div>

      {/* Regime Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-lime-500/30">
          <div className="text-slate-400 text-[11px] mb-1">Current Regime</div>
          <div className="text-lg font-bold text-lime-400">{currentSnapshot.regime.replace("_", " ")}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Confidence</div>
          <div className="text-lg font-bold text-sky-400">{currentSnapshot.confidencePct}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Duration</div>
          <div className="text-lg font-bold text-amber-400">{currentSnapshot.durationMinutes} min</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Stay Probability</div>
          <div className="text-lg font-bold text-white">72.0%</div>
        </div>
      </div>

      {/* Factor Score Progress Bars */}
      <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
          <BarChart2 className="w-3.5 h-3.5 text-lime-400" />
          Regime Factor Scores
        </h3>
        {factorBars.map((f) => (
          <div key={f.label} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">{f.label}</span>
              <strong className="text-white">{(Math.abs(f.value) * 100).toFixed(0)}%</strong>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className={`h-full ${f.color} rounded-full transition-all`} style={{ width: `${Math.abs(f.value) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Transition History */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
          Recent Regime Transitions
        </h3>
        <div className="space-y-2">
          {transitions.map((t) => (
            <div key={t.transitionId} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60 text-[11px]">
              <span className="text-slate-400 font-bold">{t.timestamp}</span>
              <span className="text-amber-400 font-bold">{t.fromRegime.replace("_", " ")}</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-lime-400 font-bold">{t.toRegime.replace("_", " ")}</span>
              <span className="ml-auto text-slate-400">P = {t.probabilityPct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
