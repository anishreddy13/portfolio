"use client";

import React from "react";
import { LayoutGrid, LineChart, Shield, Cpu, ChevronLeft, ChevronRight, Eye, Settings, Gauge, Activity } from "lucide-react";
import { WorkspaceTab } from "@/hooks/useWorkspace";

interface WorkspaceSidebarProps {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  panelVisibility: Record<string, boolean>;
  togglePanel: (key: string) => void;
}

export default function WorkspaceSidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  panelVisibility,
  togglePanel,
}: WorkspaceSidebarProps) {
  const TABS = [
    { id: "all", label: "All Panels", icon: LayoutGrid },
    { id: "trading", label: "Trading & Execution", icon: LineChart },
    { id: "analytics", label: "Analytics & TCA", icon: Activity },
    { id: "governance", label: "Risk & Governance", icon: Shield },
    { id: "system", label: "System & Infrastructure", icon: Cpu },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? "w-14" : "w-60"
      } bg-slate-950/90 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 font-mono text-xs z-20`}
    >
      {/* Upper Navigation Tabs */}
      <div className="p-2 space-y-4">
        {/* Toggle Collapse Button */}
        <div className="flex items-center justify-between px-2 py-1">
          {!isCollapsed && <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Workspace Views</span>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition ml-auto"
            title="Toggle Sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* View Selection Tabs */}
        <nav className="space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-left ${
                  isActive
                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
                title={isCollapsed ? tab.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{tab.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Panel Visibility Toggles */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/50">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-sky-400" />
            Quick Panel Toggles
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1 text-[11px]">
            {Object.entries(panelVisibility).map(([key, visible]) => (
              <button
                key={key}
                onClick={() => togglePanel(key)}
                className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg transition ${
                  visible ? "bg-slate-900 text-slate-200" : "text-slate-500 hover:text-slate-400"
                }`}
              >
                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className={`w-2 h-2 rounded-full ${visible ? "bg-lime-400" : "bg-slate-700"}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
