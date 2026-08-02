"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, TrendingDown, Activity, Flame, CheckCircle2, ArrowRight } from "lucide-react";
import { useStressTesting } from "@/hooks/useStressTesting";

function lossColor(pct: number) {
  if (pct <= -50) return "text-rose-500 font-bold";
  if (pct <= -25) return "text-rose-400 font-bold";
  if (pct <= -15) return "text-amber-400 font-bold";
  return "text-slate-300 font-semibold";
}

function heatmapBg(pct: number) {
  if (pct <= -20) return "bg-rose-950/80 text-rose-300 border-rose-800/80";
  if (pct <= -10) return "bg-rose-900/40 text-rose-200 border-rose-800/40";
  if (pct < 0) return "bg-amber-900/30 text-amber-200 border-amber-800/40";
  if (pct >= 10) return "bg-lime-900/40 text-lime-200 border-lime-800/40";
  return "bg-slate-900/60 text-slate-300 border-slate-800";
}

export default function StressTestingPanel() {
  const {
    scenarios,
    worstScenario,
    aggregateStressedVar,
    aggregateExpectedShortfall,
    shockMatrix,
    recommendations,
  } = useStressTesting();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Enterprise Scenario & Stress Testing Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical Crisis Replay • Hypothetical Factor Shocks • Stressed VaR & Expected Shortfall
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            Worst Loss: <strong className="text-white">{worstScenario.portfolioLossPct.toFixed(1)}%</strong>
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Stressed ES: <strong className="text-white">{aggregateExpectedShortfall.toFixed(2)}%</strong>
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/30">
          <div className="text-slate-400 text-[11px] mb-1">Worst Case PnL</div>
          <div className="text-lg font-bold text-rose-400">
            -${Math.abs(worstScenario.worstCasePnl).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">{worstScenario.scenarioName}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Stressed VaR (95%)</div>
          <div className="text-lg font-bold text-amber-400">{aggregateStressedVar.toFixed(2)}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">1-Day Stressed Loss</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Expected Shortfall</div>
          <div className="text-lg font-bold text-violet-400">{aggregateExpectedShortfall.toFixed(2)}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Tail Loss (CVaR)</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Recovery Estimate</div>
          <div className="text-lg font-bold text-white">{worstScenario.recoveryEstimateDays} days</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Historical Baseline</div>
        </div>
      </div>

      {/* Scenario List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          Scenario Results & Historical Crisis Replay
        </h3>
        <div className="space-y-2">
          {scenarios.map((sc) => (
            <div
              key={sc.scenarioId}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{sc.scenarioName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      sc.isHistorical
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                    }`}
                  >
                    {sc.isHistorical ? "HISTORICAL" : "HYPOTHETICAL"}
                  </span>
                </div>
                <div className="text-slate-500 text-[10px]">
                  Dominant Risk Factor: <strong className="text-slate-300">{sc.dominantRiskFactor}</strong> • Recovery: {sc.recoveryEstimateDays}d
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-slate-400 text-[10px]">Portfolio Loss</div>
                  <div className={lossColor(sc.portfolioLossPct)}>{sc.portfolioLossPct.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Stressed VaR / ES</div>
                  <div className="text-white font-bold">
                    {sc.stressedVar95.toFixed(1)}% / {sc.stressedExpectedShortfall95.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Factor Shock Results & Stress Heatmap */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-lime-400" />
          Factor Shock Sensitivity Heatmap
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-[11px] font-mono border-separate border-spacing-1">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left p-2 font-medium">Factor</th>
                <th className="p-2 font-medium">-20% Shock</th>
                <th className="p-2 font-medium">-10% Shock</th>
                <th className="p-2 font-medium">+10% Shock</th>
                <th className="p-2 font-medium">+20% Shock</th>
              </tr>
            </thead>
            <tbody>
              {shockMatrix.map((m) => (
                <tr key={m.factor}>
                  <td className="text-left font-bold text-white p-2 bg-slate-950/60 rounded-lg">{m.factor}</td>
                  <td className={`p-2 rounded-lg border ${heatmapBg(m.minus20Pct)}`}>{m.minus20Pct.toFixed(1)}%</td>
                  <td className={`p-2 rounded-lg border ${heatmapBg(m.minus10Pct)}`}>{m.minus10Pct.toFixed(1)}%</td>
                  <td className={`p-2 rounded-lg border ${heatmapBg(m.plus10Pct)}`}>+{m.plus10Pct.toFixed(1)}%</td>
                  <td className={`p-2 rounded-lg border ${heatmapBg(m.plus20Pct)}`}>+{m.plus20Pct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Recommendations */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
        <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Stress Mitigation & Risk Recommendations
        </h3>
        <ul className="space-y-1.5 text-slate-300">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
