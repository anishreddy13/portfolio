"use client";

import { useState, useEffect } from "react";

export type WorkspaceLayoutPreset = "DEFAULT" | "TRADING" | "ANALYTICS" | "RISK_GOVERNANCE";
export type WorkspaceTab = "all" | "trading" | "analytics" | "governance" | "system";

export interface WorkspaceNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
}

const DEFAULT_PANEL_VISIBILITY: Record<string, boolean> = {
  marketOverview: true,
  portfolio: true,
  orderEntry: true,
  openOrders: true,
  signals: true,
  portfolioConstruction: true,
  risk: true,
  compliance: true,
  oms: true,
  execution: true,
  broker: true,
  strategy: true,
  backtest: true,
  telemetry: true,
  brokerConnectivity: true,
  highAvailability: true,
  platform: true,
  security: true,
  benchmark: true,
  systemStatus: true,
  iamAdmin: true,
  deployment: true,
  operations: true,
  release: true,
  settings: false,
};

const STORAGE_KEY = "enterprise_trading_workspace_layout_v1";

export function useWorkspace() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("all");
  const [preset, setPreset] = useState<WorkspaceLayoutPreset>("DEFAULT");
  const [panelVisibility, setPanelVisibility] = useState<Record<string, boolean>>(DEFAULT_PANEL_VISIBILITY);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>([
    {
      id: "notif-1",
      type: "info",
      title: "Workspace Initialized",
      message: "Enterprise Trading Workstation loaded with 37 active engine subsystems.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Restore layout state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.panelVisibility) setPanelVisibility(parsed.panelVisibility);
        if (parsed.preset) setPreset(parsed.preset);
        if (parsed.theme) setTheme(parsed.theme);
      }
    } catch (e) {
      console.warn("Failed to restore workspace layout from localStorage", e);
    }
  }, []);

  // Save layout state to localStorage when updated
  const saveLayout = (newVisibility: Record<string, boolean>, newPreset?: WorkspaceLayoutPreset) => {
    setPanelVisibility(newVisibility);
    if (newPreset) setPreset(newPreset);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          panelVisibility: newVisibility,
          preset: newPreset || preset,
          theme,
        })
      );
    } catch (e) {
      console.warn("Failed to save workspace layout to localStorage", e);
    }
  };

  const togglePanel = (panelKey: string) => {
    const updated = { ...panelVisibility, [panelKey]: !panelVisibility[panelKey] };
    saveLayout(updated);
  };

  const applyPreset = (newPreset: WorkspaceLayoutPreset) => {
    let visibility = { ...DEFAULT_PANEL_VISIBILITY };

    if (newPreset === "TRADING") {
      visibility = {
        marketOverview: true,
        portfolio: true,
        orderEntry: true,
        openOrders: true,
        signals: true,
        oms: true,
        execution: true,
        broker: true,
        portfolioConstruction: false,
        risk: false,
        compliance: false,
        strategy: false,
        backtest: false,
        telemetry: false,
        brokerConnectivity: false,
        highAvailability: false,
        platform: false,
        security: false,
        benchmark: false,
        systemStatus: false,
        iamAdmin: false,
        deployment: false,
        operations: false,
        release: false,
        settings: false,
      };
    } else if (newPreset === "ANALYTICS") {
      visibility = {
        marketOverview: true,
        signals: true,
        portfolioConstruction: true,
        strategy: true,
        backtest: true,
        telemetry: true,
        benchmark: true,
        portfolio: false,
        orderEntry: false,
        openOrders: false,
        risk: false,
        compliance: false,
        oms: false,
        execution: false,
        broker: false,
        brokerConnectivity: false,
        highAvailability: false,
        platform: false,
        security: false,
        systemStatus: false,
        iamAdmin: false,
        deployment: false,
        operations: false,
        release: false,
        settings: false,
      };
    } else if (newPreset === "RISK_GOVERNANCE") {
      visibility = {
        portfolio: true,
        risk: true,
        compliance: true,
        brokerConnectivity: true,
        highAvailability: true,
        platform: true,
        security: true,
        systemStatus: true,
        marketOverview: false,
        orderEntry: false,
        openOrders: false,
        signals: false,
        portfolioConstruction: false,
        oms: false,
        execution: false,
        broker: false,
        strategy: false,
        backtest: false,
        telemetry: false,
        benchmark: false,
        iamAdmin: true,
        deployment: true,
        operations: true,
        release: true,
        settings: false,
      };
    }

    saveLayout(visibility, newPreset);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const addNotification = (title: string, message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const notif: WorkspaceNotification = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setNotifications((prev) => [notif, ...prev.slice(0, 9)]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Keyboard shortcut listener for Ctrl+K (Command Palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    activeTab,
    setActiveTab,
    preset,
    panelVisibility,
    togglePanel,
    applyPreset,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    theme,
    toggleTheme,
    notifications,
    addNotification,
    dismissNotification,
  };
}
