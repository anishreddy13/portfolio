"use client";

import React from "react";
import { LayoutGrid, LineChart, Activity, Shield, Cpu } from "lucide-react";
import { WorkspaceTab } from "@/hooks/useWorkspace";

interface WorkspaceTabsProps {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
}

export default function WorkspaceTabs({ activeTab, setActiveTab }: WorkspaceTabsProps) {
  const TABS = [
    { id: "all", label: "All Panels (37 Engines)", icon: LayoutGrid },
    { id: "trading", label: "Trading & OMS Execution", icon: LineChart },
    { id: "analytics", label: "Analytics & TCA Benchmark", icon: Activity },
    { id: "governance", label: "Risk, Compliance & Security", icon: Shield },
    { id: "system", label: "Infrastructure & Telemetry", icon: Cpu },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-slate-800/80 pb-3 font-mono text-xs overflow-x-auto">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as WorkspaceTab)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition whitespace-nowrap font-bold ${
              isActive
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900/60"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
