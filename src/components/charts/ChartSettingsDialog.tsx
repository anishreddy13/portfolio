"use client";

import React from "react";
import { Settings, X, Check } from "lucide-react";
import { ChartType } from "@/hooks/useChart";

interface ChartSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
}

export default function ChartSettingsDialog({
  isOpen,
  onClose,
  chartType,
  setChartType,
}: ChartSettingsDialogProps) {
  if (!isOpen) return null;

  const TYPES: { id: ChartType; label: string }[] = [
    { id: "CANDLESTICK", label: "Candlestick (Green / Red)" },
    { id: "OHLC", label: "OHLC Bars" },
    { id: "LINE", label: "Line Chart (Close Price)" },
    { id: "AREA", label: "Area Fill Chart" },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <Settings className="w-4 h-4 text-sky-400" />
            <span>Chart Appearance & Settings</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Price Display Style</span>
          <div className="space-y-1">
            {TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setChartType(t.id);
                  onClose();
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                  chartType === t.id
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-400 font-bold"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <span>{t.label}</span>
                {chartType === t.id && <Check className="w-3.5 h-3.5 text-sky-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
