"use client";

import React from "react";
import { Sliders, PieChart, Target, Scale, ShieldAlert, ArrowRightLeft, DollarSign, CheckCircle2 } from "lucide-react";
import { usePortfolioConstruction } from "@/hooks/usePortfolioConstruction";

export default function PortfolioConstructionPanel() {
  const { targetPositions, constraints } = usePortfolioConstruction();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-lime-400" />
            Enterprise Portfolio Construction Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Decoupled Sizing & Capital Allocation • Risk Parity • Volatility Targeting • Boundary Constraints
          </p>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30">
          Sizing Model: <strong className="text-white">RISK PARITY (2% Risk)</strong>
        </span>
      </div>

      {/* Constraints Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Max Position Weight</div>
          <div className="text-lg font-bold text-white">{constraints.maxSinglePositionPct}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Max Sector Weight</div>
          <div className="text-lg font-bold text-sky-400">{constraints.maxSectorWeightPct}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Min Cash Reserve</div>
          <div className="text-lg font-bold text-amber-400">{constraints.minCashBufferPct}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Target Volatility</div>
          <div className="text-lg font-bold text-lime-400">{constraints.targetVolatilityPct}%</div>
        </div>
      </div>

      {/* Target Allocations Table */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-lime-400" />
          Target Positions & Capital Allocation Ledger
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Symbol</th>
                <th className="pb-3 font-medium">Target Weight</th>
                <th className="pb-3 font-medium">Current Weight</th>
                <th className="pb-3 font-medium">Target Shares</th>
                <th className="pb-3 font-medium">Dollar Allocation</th>
                <th className="pb-3 font-medium text-right">Sizing Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {targetPositions.map((pos) => {
                const drift = pos.targetWeightPct - pos.currentWeightPct;
                return (
                  <tr key={pos.symbol} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 font-bold text-white">{pos.symbol}</td>
                    <td className="py-2.5 font-bold text-lime-400">{pos.targetWeightPct}%</td>
                    <td className="py-2.5 text-slate-300">
                      {pos.currentWeightPct}%{" "}
                      <span className={`text-[10px] ${drift >= 0 ? "text-lime-400" : "text-rose-400"}`}>
                        ({drift >= 0 ? "+" : ""}{drift.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-200">{pos.targetShares} shares</td>
                    <td className="py-2.5 text-slate-200">${pos.targetDollarAllocation.toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px]">
                        {pos.sizingModel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
