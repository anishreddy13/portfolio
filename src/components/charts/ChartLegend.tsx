"use client";

import React from "react";
import { CandleBar, ChartIndicatorsState } from "@/hooks/useChart";

interface ChartLegendProps {
  symbol: string;
  timeframe: string;
  crosshair: CandleBar | null;
  indicators: ChartIndicatorsState;
}

export default function ChartLegend({ symbol, timeframe, crosshair, indicators }: ChartLegendProps) {
  if (!crosshair) return null;

  const isBullish = crosshair.close >= crosshair.open;
  const change = crosshair.close - crosshair.open;
  const changePct = (change / crosshair.open) * 100;

  return (
    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] select-none text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/40">
      <div className="flex items-center gap-1.5 font-bold text-white">
        <span>{symbol}</span>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
          {timeframe}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span>O: <strong className="text-white">${crosshair.open.toFixed(2)}</strong></span>
        <span>H: <strong className="text-white">${crosshair.high.toFixed(2)}</strong></span>
        <span>L: <strong className="text-white">${crosshair.low.toFixed(2)}</strong></span>
        <span>C: <strong className={isBullish ? "text-lime-400" : "text-rose-400"}>${crosshair.close.toFixed(2)}</strong></span>
        <span className={isBullish ? "text-lime-400 font-bold" : "text-rose-400 font-bold"}>
          {change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%)
        </span>
      </div>

      {indicators.ema && crosshair.ema20 && (
        <span className="text-amber-400 font-bold">EMA20: ${crosshair.ema20.toFixed(2)}</span>
      )}
      {indicators.sma && crosshair.sma50 && (
        <span className="text-sky-400 font-bold">SMA50: ${crosshair.sma50.toFixed(2)}</span>
      )}
      {indicators.vwap && crosshair.vwap && (
        <span className="text-violet-400 font-bold">VWAP: ${crosshair.vwap.toFixed(2)}</span>
      )}
    </div>
  );
}
