"use client";

import React from "react";
import { FolderGit2, Layers, PieChart, ShieldCheck, ArrowRight, DollarSign, Activity, Sparkles } from "lucide-react";
import { useMultiPortfolio } from "@/hooks/useMultiPortfolio";

export default function MultiPortfolioPanel() {
  const {
    activePortfolioId,
    setActivePortfolioId,
    managedPortfolios,
    groupAggregate,
    comparison,
  } = useMultiPortfolio();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-lime-400" />
            Enterprise Multi-Portfolio Management Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-Fund Aggregation • Cross-Portfolio Overlap • Group Exposure & Risk Coordination
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30">
            Group Equity: <strong className="text-white">${groupAggregate.totalGroupEquity.toLocaleString()}</strong>
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
            Portfolios: <strong className="text-white">{managedPortfolios.length}</strong>
          </span>
        </div>
      </div>

      {/* Group Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-lime-500/30">
          <div className="text-slate-400 text-[11px] mb-1">Group Equity</div>
          <div className="text-lg font-bold text-lime-400">${groupAggregate.totalGroupEquity.toLocaleString()}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Group Cash</div>
          <div className="text-lg font-bold text-sky-400">${groupAggregate.totalGroupCash.toLocaleString()}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Gross Exposure</div>
          <div className="text-lg font-bold text-white">${groupAggregate.grossMarketExposure.toLocaleString()}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Aggregate VaR (95%)</div>
          <div className="text-lg font-bold text-amber-400">{groupAggregate.aggregateVar95Pct}%</div>
        </div>
      </div>

      {/* Portfolio Selector & Managed Portfolios List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-lime-400" />
          Managed Portfolio Instances
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {managedPortfolios.map((p) => {
            const isActive = p.portfolioId === activePortfolioId;
            return (
              <div
                key={p.portfolioId}
                onClick={() => setActivePortfolioId(p.portfolioId)}
                className={`p-4 rounded-xl border cursor-pointer transition space-y-2 ${
                  isActive
                    ? "bg-lime-500/10 border-lime-500/50 text-white"
                    : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{p.name}</span>
                  {isActive && <Sparkles className="w-3.5 h-3.5 text-lime-400" />}
                </div>
                <div className="text-[10px] text-slate-400">{p.strategyType}</div>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span>Equity: <strong className="text-white">${p.totalEquity.toLocaleString()}</strong></span>
                  <span className="text-lime-400 font-bold">{p.weightInGroupPct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exposure Overlap & Cross-Portfolio Holdings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          Cross-Portfolio Overlapping Holdings
        </h3>
        <div className="space-y-2">
          {groupAggregate.topOverlappingSymbols.map((item) => (
            <div key={item.symbol} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60 flex items-center justify-between text-[11px]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{item.symbol}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    OVERLAP ({item.portfoliosHolding.length} funds)
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Portfolios: {item.portfoliosHolding.join(" • ")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">${item.totalMarketValue.toLocaleString()}</div>
                <div className="text-[10px] text-lime-400">{item.groupExposurePct}% of Group</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sector Allocation & Factor Exposure — Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sector Allocation */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <PieChart className="w-3.5 h-3.5 text-lime-400" />
            Group Sector Allocation
          </h3>
          <div className="space-y-2">
            {Object.entries(groupAggregate.sectorWeights).map(([sec, weight]) => (
              <div key={sec} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">{sec}</span>
                  <strong className="text-white">{weight}%</strong>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-lime-500 rounded-full" style={{ width: `${Math.min(weight * 2, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Group Factor Exposure */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            Group Factor Exposures
          </h3>
          <div className="space-y-2">
            {Object.entries(groupAggregate.factorExposures).map(([factor, exp]) => (
              <div key={factor} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">{factor}</span>
                  <strong className={exp >= 0 ? "text-lime-400" : "text-rose-400"}>
                    {exp >= 0 ? "+" : ""}{exp.toFixed(2)}
                  </strong>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${exp >= 0 ? "bg-sky-500" : "bg-rose-500"}`}
                    style={{ width: `${Math.min(Math.abs(exp) * 80, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio Comparison Card */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
          Cross-Portfolio Comparison: {comparison.portfolioNameA} vs {comparison.portfolioNameB}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px]">
          <div>
            <span className="text-slate-500">Equity Ratio</span>
            <div className="text-white font-bold">{comparison.equityRatio}x</div>
          </div>
          <div>
            <span className="text-slate-500">Holding Overlap</span>
            <div className="text-amber-400 font-bold">{comparison.holdingOverlapPct}%</div>
          </div>
          <div>
            <span className="text-slate-500">Beta Difference</span>
            <div className="text-sky-400 font-bold">Δ {comparison.betaDifference}</div>
          </div>
          <div>
            <span className="text-slate-500">Return Correlation</span>
            <div className="text-lime-400 font-bold">ρ = {comparison.returnCorrelation}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
