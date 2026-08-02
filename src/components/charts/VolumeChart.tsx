"use client";

import React from "react";
import { CandleBar } from "@/hooks/useChart";

interface VolumeChartProps {
  data: CandleBar[];
}

export default function VolumeChart({ data }: VolumeChartProps) {
  if (data.length === 0) return null;

  const maxVol = Math.max(...data.map((d) => d.volume)) || 1;

  return (
    <div className="relative w-full h-20 bg-slate-950/70 rounded-xl border border-slate-800/80 p-2 overflow-hidden select-none font-mono text-[9px]">
      <div className="absolute top-1 left-2 text-slate-500 font-bold uppercase">Volume</div>
      <svg className="w-full h-full">
        {data.map((d, idx) => {
          const isBull = d.close >= d.open;
          const barColor = isBull ? "rgba(34, 197, 94, 0.6)" : "rgba(239, 68, 68, 0.6)";
          const xPct = (idx / (data.length - 1)) * 96 + 2;
          const heightPct = (d.volume / maxVol) * 60;
          const yTop = 70 - heightPct;

          return (
            <rect
              key={idx}
              x={`calc(${xPct}% - 3px)`}
              y={yTop}
              width="6"
              height={heightPct}
              fill={barColor}
              rx="1"
            />
          );
        })}
      </svg>
    </div>
  );
}
