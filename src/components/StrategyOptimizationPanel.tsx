"use client";

import React from "react";
import { Cpu, ShieldCheck, Zap, Sliders, Award, CheckCircle2, ArrowRight, AlertTriangle } from "lucide-react";
import { useStrategyOptimization } from "@/hooks/useStrategyOptimization";

export default function StrategyOptimizationPanel() {
  const {
    parameters,
    candidates,
    recommendations,
    walkForward,
    robustnessScore,
    overfittingScore,
  } = useStrategyOptimization();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-lime-400" />
            Enterprise Strategy Optimization Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Research & Parameter Tuning • Walk-Forward Validation • Overfitting Probability Scoring
          </p>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30">
          Robustness: <strong className="text-white">{robustnessScore} / 100</strong>
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Robustness Score</div>
          <div className="text-lg font-bold text-lime-400">{robustnessScore} / 100</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Overfitting Score</div>
          <div className="text-lg font-bold text-sky-400">{overfittingScore}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Walk-Forward Efficiency</div>
          <div className="text-lg font-bold text-amber-400">{(walkForward.efficiencyRatio * 100).toFixed(0)}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">OOS Sharpe Ratio</div>
          <div className="text-lg font-bold text-white">{walkForward.outOfSampleSharpe}</div>
        </div>
      </div>

      {/* Grid Search Optimization Candidates Table */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-lime-400" />
          Grid Search Sweep Candidates
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Candidate ID</th>
                <th className="pb-3 font-medium">Fast / Slow Period</th>
                <th className="pb-3 font-medium">Sharpe Ratio</th>
                <th className="pb-3 font-medium">Return</th>
                <th className="pb-3 font-medium">Max Drawdown</th>
                <th className="pb-3 font-medium text-right">Composite Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {candidates.map((cand, idx) => (
                <tr key={cand.candidateId} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 text-slate-400 font-bold">
                    {cand.candidateId} {idx === 0 && <span className="text-[10px] text-lime-400 ml-1">(BEST)</span>}
                  </td>
                  <td className="py-2.5 font-bold text-white">
                    {cand.fastPeriod} / {cand.slowPeriod}
                  </td>
                  <td className="py-2.5 text-lime-400 font-bold">{cand.sharpeRatio}</td>
                  <td className="py-2.5 text-slate-300">+{cand.totalReturnPct}%</td>
                  <td className="py-2.5 text-rose-400">-{cand.maxDrawdownPct}%</td>
                  <td className="py-2.5 text-right font-bold text-sky-400">{cand.compositeScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parameter Recommendations */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-lime-400" />
          Optimization Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendations.map((rec) => (
            <div key={rec.recId} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{rec.paramName}</span>
                <span className="text-lime-400 font-bold">+ {rec.expectedSharpeGain} Sharpe Gain</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-xs">
                <span className="text-slate-500">{rec.currentValue}</span>
                <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
                <strong className="text-lime-400">{rec.recommendedValue}</strong>
              </div>
              <p className="text-[11px] text-slate-400">{rec.rationale}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
