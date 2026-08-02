"use client";

import React from "react";
import { Activity, Eye, Layers } from "lucide-react";
import { ChartIndicatorsState } from "@/hooks/useChart";

interface IndicatorToolbarProps {
  indicators: ChartIndicatorsState;
  toggleIndicator: (ind: keyof ChartIndicatorsState) => void;
}

export default function IndicatorToolbar({ indicators, toggleIndicator }: IndicatorToolbarProps) {
  const INDICATOR_KEYS: { key: keyof ChartIndicatorsState; label: string; color: string }[] = [
    { key: "ema", label: "EMA (20)", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    { key: "sma", label: "SMA (50)", color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
    { key: "vwap", label: "VWAP", color: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
    { key: "bollinger", label: "Bollinger (20,2)", color: "text-lime-400 border-lime-500/30 bg-lime-500/10" },
    { key: "rsi", label: "RSI (14)", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
    { key: "macd", label: "MACD (12,26,9)", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono text-xs select-none">
      <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1 shrink-0">
        <Activity className="w-3 h-3 text-sky-400" /> Overlays:
      </span>
      {INDICATOR_KEYS.map((item) => {
        const active = indicators[item.key];
        return (
          <button
            key={item.key}
            onClick={() => toggleIndicator(item.key)}
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition whitespace-nowrap ${
              active ? item.color : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
