"use client";

import React, { useRef, useEffect } from "react";
import { CandleBar, ChartIndicatorsState, ChartType } from "@/hooks/useChart";

interface CandlestickChartProps {
  data: CandleBar[];
  indicators: ChartIndicatorsState;
  chartType: ChartType;
  onHoverCandle: (candle: CandleBar | null) => void;
}

export default function CandlestickChart({
  data,
  indicators,
  chartType,
  onHoverCandle,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-slate-500 font-mono text-xs">No candle data available</div>;
  }

  // Calculate min and max price ranges for scaling
  const minPrice = Math.min(...data.map((d) => d.low)) * 0.998;
  const maxPrice = Math.max(...data.map((d) => d.high)) * 1.002;
  const priceRange = maxPrice - minPrice || 1.0;

  const getY = (price: number, height: number) => {
    return height - ((price - minPrice) / priceRange) * height;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-80 bg-slate-950/90 rounded-xl border border-slate-800/80 p-2 overflow-hidden select-none font-mono text-[10px]"
    >
      {/* Grid Lines */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
        <div className="border-b border-slate-700 w-full" />
        <div className="border-b border-slate-700 w-full" />
        <div className="border-b border-slate-700 w-full" />
        <div className="border-b border-slate-700 w-full" />
      </div>

      {/* SVG Candlestick & Indicator Rendering */}
      <svg className="w-full h-full overflow-visible">
        {/* Render Bollinger Bands Shading */}
        {indicators.bollinger && (
          <path
            d={data
              .map((d, idx) => {
                const x = (idx / (data.length - 1)) * 100 + "%";
                const yUpper = getY(d.upperBB || d.high, 280);
                return `${idx === 0 ? "M" : "L"} ${x} ${yUpper}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgba(132, 204, 22, 0.4)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* Render EMA20 Line */}
        {indicators.ema && (
          <polyline
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.5"
            points={data
              .map((d, idx) => {
                const xPct = (idx / (data.length - 1)) * 100;
                const y = getY(d.ema20 || d.close, 280);
                return `${xPct}%,${y}`;
              })
              .join(" ")}
          />
        )}

        {/* Render SMA50 Line */}
        {indicators.sma && (
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            points={data
              .map((d, idx) => {
                const xPct = (idx / (data.length - 1)) * 100;
                const y = getY(d.sma50 || d.close, 280);
                return `${xPct}%,${y}`;
              })
              .join(" ")}
          />
        )}

        {/* Render Candlesticks / OHLC Bars */}
        {data.map((d, idx) => {
          const isBull = d.close >= d.open;
          const candleColor = isBull ? "#22c55e" : "#ef4444";
          const xPct = (idx / (data.length - 1)) * 96 + 2;

          const yOpen = getY(d.open, 280);
          const yClose = getY(d.close, 280);
          const yHigh = getY(d.high, 280);
          const yLow = getY(d.low, 280);

          const candleTop = Math.min(yOpen, yClose);
          const candleHeight = Math.max(2, Math.abs(yOpen - yClose));

          return (
            <g
              key={idx}
              onMouseEnter={() => onHoverCandle(d)}
              className="cursor-crosshair group transition-opacity"
            >
              {/* Wick Line */}
              <line
                x1={`${xPct}%`}
                y1={yHigh}
                x2={`${xPct}%`}
                y2={yLow}
                stroke={candleColor}
                strokeWidth="1"
              />

              {/* Candle Body */}
              <rect
                x={`calc(${xPct}% - 3px)`}
                y={candleTop}
                width="6"
                height={candleHeight}
                fill={candleColor}
                rx="1"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
