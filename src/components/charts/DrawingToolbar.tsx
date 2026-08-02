"use client";

import React from "react";
import { MousePointer, TrendingUp, Minus, Square, Hash, Type, Bookmark } from "lucide-react";
import { DrawingTool } from "@/hooks/useChart";

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;
}

export default function DrawingToolbar({ activeTool, setActiveTool }: DrawingToolbarProps) {
  const TOOLS: { id: DrawingTool; label: string; icon: React.ElementType }[] = [
    { id: "SELECT", label: "Select Pointer", icon: MousePointer },
    { id: "TREND", label: "Trend Line", icon: TrendingUp },
    { id: "HORIZONTAL", label: "Horizontal Line", icon: Minus },
    { id: "VERTICAL", label: "Vertical Line", icon: Minus },
    { id: "RECTANGLE", label: "Rectangle Box", icon: Square },
    { id: "FIBONACCI", label: "Fibonacci Retracement", icon: Hash },
    { id: "TEXT", label: "Text Annotation", icon: Type },
  ];

  return (
    <div className="flex flex-col gap-1 p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl font-mono text-xs select-none">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            className={`p-2 rounded-lg transition ${
              isActive ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold" : "text-slate-500 hover:text-white hover:bg-slate-900"
            }`}
            title={t.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
