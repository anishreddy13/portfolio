"use client";

import React from "react";
import { Activity, BarChart2, TrendingUp, DollarSign, Award, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useExecutionAnalytics } from "@/hooks/useExecutionAnalytics";

export default function ExecutionAnalyticsPanel() {
  const { analytics, statistics } = useExecutionAnalytics();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-lime-400" />
            Enterprise Transaction Cost Analysis (TCA) Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Post-Execution Analytics • Arrival Price & VWAP Benchmarks • Slippage & Implementation Shortfall
          </p>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30">
          Avg Quality Score: <strong className="text-white">{statistics.averageQualityScore} / 100</strong>
        </span>
      </div>

      {/* TCA Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Avg Slippage</div>
          <div className="text-lg font-bold text-lime-400">{statistics.averageSlippageBps} bps</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Market Impact</div>
          <div className="text-lg font-bold text-sky-400">{statistics.averageMarketImpactBps} bps</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Total Shortfall</div>
          <div className="text-lg font-bold text-amber-400">${statistics.totalShortfallDollars.toFixed(2)}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Broker Score</div>
          <div className="text-lg font-bold text-white">98.5 / 100</div>
        </div>
      </div>

      {/* Execution Quality & Benchmarks Table */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-lime-400" />
          Per-Execution Cost Analysis & Quality Rating
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Exec ID</th>
                <th className="pb-3 font-medium">Symbol</th>
                <th className="pb-3 font-medium">Arrival Price</th>
                <th className="pb-3 font-medium">VWAP</th>
                <th className="pb-3 font-medium">Fill Price</th>
                <th className="pb-3 font-medium">Slippage</th>
                <th className="pb-3 font-medium">Shortfall</th>
                <th className="pb-3 font-medium text-right">Quality Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {analytics.map((item) => (
                <tr key={item.executionId} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 text-slate-400 font-bold">{item.executionId}</td>
                  <td className="py-2.5 font-bold text-white">{item.symbol}</td>
                  <td className="py-2.5 text-slate-300">${item.arrivalPrice.toFixed(2)}</td>
                  <td className="py-2.5 text-slate-300">${item.vwap.toFixed(2)}</td>
                  <td className="py-2.5 font-bold text-white">${item.avgFillPrice.toFixed(2)}</td>
                  <td className="py-2.5 text-lime-400">{item.arrivalSlippageBps} bps</td>
                  <td className="py-2.5 text-amber-400">{item.implementationShortfallBps} bps</td>
                  <td className="py-2.5 text-right">
                    <span className="px-2.5 py-1 rounded font-bold text-[10px] bg-lime-500/10 text-lime-400 border border-lime-500/30">
                      {item.qualityScore} ({item.rating})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
