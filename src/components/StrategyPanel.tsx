"use client";

import React, { useState } from "react";
import { Cpu, Zap, Sliders, Play, Pause, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useStrategies } from "@/hooks/useStrategies";

export default function StrategyPanel() {
  const { strategies, toggleStrategy } = useStrategies();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-lime-400" />
            Quantitative Strategy Framework & Plugins
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Plugin Architecture • Unified Backtest & Paper Execution • StrategyRegistry Engine
          </p>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30">
          {strategies.filter((s) => s.isActive).length} / {strategies.length} Plugins Active
        </span>
      </div>

      {/* Strategies List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map((strat) => (
          <div
            key={strat.name}
            className={`p-4 rounded-xl border transition-all ${
              strat.isActive
                ? "bg-slate-950/70 border-lime-500/30 text-white"
                : "bg-slate-950/40 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{strat.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {strat.category}
                </span>
              </div>

              <button
                onClick={() => toggleStrategy(strat.name)}
                className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition ${
                  strat.isActive
                    ? "bg-lime-500 text-slate-950 hover:bg-lime-400"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {strat.isActive ? <Pause className="w-3 h-3 fill-slate-950" /> : <Play className="w-3 h-3 fill-slate-300" />}
                {strat.isActive ? "ACTIVE" : "PAUSED"}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-3">{strat.description}</p>

            {/* Live Signal Badge & Parameters */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-slate-400 font-normal">Last Signal:</span>
                <span
                  className={`flex items-center gap-0.5 ${
                    strat.lastSignal.type === "BUY"
                      ? "text-lime-400"
                      : strat.lastSignal.type === "SELL"
                      ? "text-rose-400"
                      : "text-slate-400"
                  }`}
                >
                  {strat.lastSignal.type === "BUY" && <ArrowUpRight className="w-3 h-3" />}
                  {strat.lastSignal.type === "SELL" && <ArrowDownRight className="w-3 h-3" />}
                  {strat.lastSignal.type} ({(strat.lastSignal.strength * 100).toFixed(0)}%)
                </span>
              </div>

              <div className="text-slate-400">
                Risk: <strong className="text-slate-200">{strat.riskPerTradePct}% / Trade</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
