"use client";

import React, { useState } from "react";
import { LineChart, Settings, RefreshCw, Layers, TrendingUp, Maximize2 } from "lucide-react";
import { useChart, Timeframe } from "@/hooks/useChart";
import CandlestickChart from "@/components/charts/CandlestickChart";
import VolumeChart from "@/components/charts/VolumeChart";
import IndicatorToolbar from "@/components/charts/IndicatorToolbar";
import DrawingToolbar from "@/components/charts/DrawingToolbar";
import ChartLegend from "@/components/charts/ChartLegend";
import CrosshairTooltip from "@/components/charts/CrosshairTooltip";
import ChartSettingsDialog from "@/components/charts/ChartSettingsDialog";

interface ChartWorkspaceProps {
  activeSymbol?: string;
  onSymbolChange?: (sym: string) => void;
}

export default function ChartWorkspace({ activeSymbol = "AAPL", onSymbolChange }: ChartWorkspaceProps) {
  const {
    symbol,
    setSymbol,
    timeframe,
    setTimeframe,
    chartType,
    setChartType,
    indicators,
    toggleIndicator,
    activeDrawingTool,
    setActiveDrawingTool,
    crosshair,
    setCrosshair,
    candleData,
  } = useChart(activeSymbol);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];
  const SYMBOLS = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "TSLA"];

  const handleSelectSymbol = (sym: string) => {
    setSymbol(sym);
    if (onSymbolChange) onSymbolChange(sym);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 font-mono text-xs space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Symbol Quick Switcher */}
        <div className="flex items-center gap-1.5">
          <LineChart className="w-4 h-4 text-sky-400" />
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {SYMBOLS.map((s) => (
              <button
                key={s}
                onClick={() => handleSelectSymbol(s)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                  symbol === s ? "bg-sky-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframe Selector Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                timeframe === tf ? "bg-lime-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 transition flex items-center gap-1"
          title="Chart Settings"
        >
          <Settings className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[10px] font-bold">Chart Settings</span>
        </button>
      </div>

      {/* Technical Indicator Toolbar */}
      <IndicatorToolbar indicators={indicators} toggleIndicator={toggleIndicator} />

      {/* Main Chart Body with Sidebar Drawing Toolbar */}
      <div className="flex gap-3">
        {/* Sidebar Drawing Tools */}
        <DrawingToolbar activeTool={activeDrawingTool} setActiveTool={setActiveDrawingTool} />

        {/* Central Canvas Area */}
        <div className="flex-1 space-y-3">
          {/* Chart OHLC Legend Bar */}
          <div className="flex items-center justify-between">
            <ChartLegend symbol={symbol} timeframe={timeframe} crosshair={crosshair} indicators={indicators} />
            <CrosshairTooltip crosshair={crosshair} />
          </div>

          {/* Interactive Candlestick / OHLC Chart */}
          <CandlestickChart
            data={candleData}
            indicators={indicators}
            chartType={chartType}
            onHoverCandle={setCrosshair}
          />

          {/* Volume Histogram Chart */}
          <VolumeChart data={candleData} />
        </div>
      </div>

      {/* Settings Dialog Modal */}
      <ChartSettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        chartType={chartType}
        setChartType={setChartType}
      />
    </div>
  );
}
