"use client";

import React from "react";
import { PieChart, TrendingUp, Award, Layers, Zap, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { usePerformanceAttribution } from "@/hooks/usePerformanceAttribution";

export default function PerformanceAttributionPanel() {
  const {
    portfolioReturnPct,
    benchmarkReturnPct,
    assetContributions,
    sectorContributions,
    strategyContributions,
    metrics,
  } = usePerformanceAttribution();

  const activeReturn = portfolioReturnPct - benchmarkReturnPct;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-lime-400" />
            Enterprise Performance Attribution Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Brinson-Fachler Sector Decomposition • Alpha/Beta Attribution • Strategy PnL Contributions
          </p>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30">
          Alpha: <strong className="text-white">+{metrics.alpha}%</strong>
        </span>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Portfolio Return</div>
          <div className="text-lg font-bold text-lime-400">+{portfolioReturnPct}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Benchmark Return</div>
          <div className="text-lg font-bold text-sky-400">+{benchmarkReturnPct}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Beta / Tracking Error</div>
          <div className="text-lg font-bold text-amber-400">{metrics.beta} / {metrics.trackingErrorPct}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Information Ratio</div>
          <div className="text-lg font-bold text-white">{metrics.informationRatio}</div>
        </div>
      </div>

      {/* Brinson Sector Attribution Table */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-lime-400" />
          Brinson-Fachler Sector Attribution (Allocation vs Selection)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Sector</th>
                <th className="pb-3 font-medium">Weight</th>
                <th className="pb-3 font-medium">Allocation Effect</th>
                <th className="pb-3 font-medium">Selection Effect</th>
                <th className="pb-3 font-medium text-right">Total Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sectorContributions.map((sec) => (
                <tr key={sec.sectorName} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 font-bold text-white">{sec.sectorName}</td>
                  <td className="py-2.5 text-slate-300">{sec.weightPct}%</td>
                  <td className="py-2.5 text-sky-400">+{sec.allocationEffectPct}%</td>
                  <td className="py-2.5 text-lime-400">+{sec.selectionEffectPct}%</td>
                  <td className="py-2.5 text-right font-bold text-lime-400">+{sec.totalContributionPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
