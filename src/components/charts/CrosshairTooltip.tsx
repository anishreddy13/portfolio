"use client";

import React from "react";
import { CandleBar } from "@/hooks/useChart";

interface CrosshairTooltipProps {
  crosshair: CandleBar | null;
}

export default function CrosshairTooltip({ crosshair }: CrosshairTooltipProps) {
  if (!crosshair) return null;

  return (
    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800/80">
      <span>Time: <strong className="text-white">{crosshair.time}</strong></span>
      <span>Vol: <strong className="text-sky-400">{crosshair.volume.toLocaleString()}</strong></span>
      {crosshair.rsi && (
        <span>RSI(14): <strong className={crosshair.rsi > 70 ? "text-rose-400" : crosshair.rsi < 30 ? "text-lime-400" : "text-amber-400"}>{crosshair.rsi.toFixed(1)}</strong></span>
      )}
    </div>
  );
}
