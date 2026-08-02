"use client";

import React from "react";
import { Layers, TrendingUp, BarChart2, ShieldCheck, ArrowRight } from "lucide-react";
import { useFactorModel } from "@/hooks/useFactorModel";

function exposureBar(value: number) {
  const absVal = Math.min(Math.abs(value) * 50, 100);
  const isPos = value >= 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden relative">
        {isPos ? (
          <div className="h-full bg-lime-500 rounded-full transition-all absolute left-1/2" style={{ width: `${absVal / 2}%` }} />
        ) : (
          <div className="h-full bg-rose-500 rounded-full transition-all absolute right-1/2" style={{ width: `${absVal / 2}%` }} />
        )}
      </div>
      <span className={`text-[11px] font-bold w-12 text-right ${isPos ? "text-lime-400" : "text-rose-400"}`}>
        {value >= 0 ? "+" : ""}{value.toFixed(2)}
      </span>
    </div>
  );
}

export default function FactorModelPanel() {
  const { exposures, contributions, risks, correlations, totalFactorReturn, residualReturn } = useFactorModel();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-lime-400" />
            Enterprise Factor Model Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-Factor Decomposition • Risk Attribution • Factor Correlation Analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30">
            Factor Return: <strong className="text-white">{totalFactorReturn.toFixed(2)}%</strong>
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
            Alpha: <strong className="text-white">{residualReturn.toFixed(2)}%</strong>
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-lime-500/30">
          <div className="text-slate-400 text-[11px] mb-1">Market Beta</div>
          <div className="text-lg font-bold text-lime-400">{exposures[0]?.exposureValue.toFixed(2)}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Momentum</div>
          <div className="text-lg font-bold text-sky-400">{exposures[1]?.exposureValue.toFixed(2)}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Growth</div>
          <div className="text-lg font-bold text-violet-400">{exposures[3]?.exposureValue.toFixed(2)}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Quality</div>
          <div className="text-lg font-bold text-amber-400">{exposures[4]?.exposureValue.toFixed(2)}</div>
        </div>
      </div>

      {/* Factor Exposures */}
      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-lime-400" />
          Factor Exposures
        </h3>
        {exposures.map((e) => (
          <div key={e.factorName} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">{e.factorName}</span>
            </div>
            {exposureBar(e.exposureValue)}
          </div>
        ))}
      </div>

      {/* Factor Contributions & Risk — Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Factor Contributions */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <BarChart2 className="w-3.5 h-3.5 text-lime-400" />
            Factor Contributions
          </h3>
          <div className="space-y-2">
            {contributions.map((c) => (
              <div key={c.factorName} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-900/50">
                <span className="text-slate-400 w-28">{c.factorName}</span>
                <div className="flex-1 mx-2">
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.contributionPct >= 0 ? "bg-lime-500" : "bg-rose-500"}`}
                      style={{ width: `${Math.min(Math.abs(c.contributionPct) * 8, 100)}%` }}
                    />
                  </div>
                </div>
                <span className={`font-bold w-16 text-right ${c.contributionPct >= 0 ? "text-lime-400" : "text-rose-400"}`}>
                  {c.contributionPct >= 0 ? "+" : ""}{c.contributionPct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Factor Risk Decomposition */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
            Factor Risk Decomposition
          </h3>
          <div className="space-y-2">
            {risks.map((r) => (
              <div key={r.factorName} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-900/50">
                <span className="text-slate-400 w-28">{r.factorName}</span>
                <div className="flex-1 mx-2">
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(r.marginalRiskPct, 100)}%` }} />
                  </div>
                </div>
                <span className="text-amber-400 font-bold w-16 text-right">{r.marginalRiskPct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Correlation Matrix */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
          Factor Correlation Matrix
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {correlations.map((c, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60 text-[11px]">
              <span className="text-sky-400 font-bold">{c.factorA}</span>
              <span className="text-slate-500">↔</span>
              <span className="text-violet-400 font-bold">{c.factorB}</span>
              <span className="ml-auto text-white font-bold">{c.correlation.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
