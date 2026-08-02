"use client";

import React from "react";
import { Layout, Maximize2, Minimize2, EyeOff, RotateCcw } from "lucide-react";

interface WorkspaceDockProps {
  title: string;
  icon?: React.ElementType;
  isVisible: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function WorkspaceDock({ title, icon: Icon, isVisible, onToggle, children }: WorkspaceDockProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!isVisible) return null;

  return (
    <div
      className={`bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden transition-all duration-300 ${
        isExpanded ? "fixed inset-4 z-50 shadow-2xl bg-slate-950" : "relative"
      }`}
    >
      {/* Dock Header Bar */}
      <div className="h-9 px-4 bg-slate-950/80 border-b border-slate-800/60 flex items-center justify-between font-mono text-xs select-none">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          {Icon && <Icon className="w-3.5 h-3.5 text-sky-400" />}
          <span>{title}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={isExpanded ? "Restore Size" : "Maximize Panel"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
            title="Hide Panel"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dock Content Body */}
      <div className={`p-4 overflow-y-auto ${isExpanded ? "h-[calc(100%-2.25rem)]" : "max-h-[650px]"}`}>
        {children}
      </div>
    </div>
  );
}
