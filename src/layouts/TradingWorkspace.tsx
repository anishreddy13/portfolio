"use client";

import React, { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import WorkspaceHeader from "@/components/workspace/WorkspaceHeader";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import WorkspaceDock from "@/components/workspace/WorkspaceDock";
import WorkspaceStatusBar from "@/components/workspace/WorkspaceStatusBar";
import WorkspaceTabs from "@/components/workspace/WorkspaceTabs";
import WorkspaceLayoutManager from "@/components/workspace/WorkspaceLayoutManager";

// Existing production panels
import PortfolioDashboard from "@/components/PortfolioDashboard";
import ChartWorkspace from "@/components/charts/ChartWorkspace";
import CopilotPanel from "@/components/CopilotPanel";
import PortfolioPanel from "@/components/PortfolioPanel";
import OrderEntryPanel from "@/components/OrderEntryPanel";
import OpenOrdersPanel from "@/components/OpenOrdersPanel";
import SignalFeed from "@/components/SignalFeed";
import SignalPanel from "@/components/SignalPanel";
import PortfolioConstructionPanel from "@/components/PortfolioConstructionPanel";
import RiskPanel from "@/components/RiskPanel";
import CompliancePanel from "@/components/CompliancePanel";
import OMSPanel from "@/components/OMSPanel";
import ExecutionAnalyticsPanel from "@/components/ExecutionAnalyticsPanel";
import ExecutionPanel from "@/components/ExecutionPanel";
import BrokerPanel from "@/components/BrokerPanel";
import StrategyPanel from "@/components/StrategyPanel";
import BacktestPanel from "@/components/BacktestPanel";
import ObservabilityPanel from "@/components/ObservabilityPanel";
import SettingsPanel from "@/components/SettingsPanel";
import BrokerConnectivityPanel from "@/components/BrokerConnectivityPanel";
import HighAvailabilityPanel from "@/components/HighAvailabilityPanel";
import PlatformPanel from "@/components/PlatformPanel";
import SecurityPanel from "@/components/SecurityPanel";
import BenchmarkPanel from "@/components/BenchmarkPanel";
import SystemStatusPanel from "@/components/SystemStatusPanel";
import { useIdentity } from "@/hooks/useIdentity";
import { LoginPanel } from "@/components/LoginPanel";
import { UserMenu } from "@/components/UserMenu";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { AdminPanel } from "@/components/AdminPanel";
import DeploymentPanel from "@/components/DeploymentPanel";
import OperationsPanel from "@/components/OperationsPanel";
import ReleasePanel from "@/components/ReleasePanel";

// Icons
import {
  TrendingUp,
  PieChart,
  ShoppingCart,
  ListOrdered,
  Zap,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Layers,
  BarChart2,
  Server,
  Activity,
  GitBranch,
  Lock,
  Gauge,
  CheckCircle2,
  Settings as SettingsIcon,
  FileText,
} from "lucide-react";

export default function TradingWorkspace() {
  const { user, workspaces, activeWorkspace, isLoading, login, logout, switchWorkspace } = useIdentity();
  
  const {
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
  } = useWorkspace();

  const [activeSymbol, setActiveSymbol] = useState("AAPL");

  const filterTab = (category: "trading" | "analytics" | "governance" | "system") => {
    if (activeTab === "all") return true;
    return activeTab === category;
  };

  if (!user) {
    return <LoginPanel onLogin={login} isLoading={isLoading} />;
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} flex flex-col`}>
      {/* Workstation Header */}
      <WorkspaceHeader
        preset={preset}
        applyPreset={applyPreset}
        isCommandPaletteOpen={isCommandPaletteOpen}
        setIsCommandPaletteOpen={setIsCommandPaletteOpen}
        theme={theme}
        toggleTheme={toggleTheme}
        notifications={notifications}
        dismissNotification={dismissNotification}
      />

      {/* IAM Status Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <WorkspaceSelector workspaces={workspaces} activeWorkspace={activeWorkspace} onSwitch={switchWorkspace} />
          {user.roles.includes('ADMIN') && (
            <span className="text-[10px] bg-red-900/40 text-red-400 border border-red-800/50 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
              Admin Mode
            </span>
          )}
        </div>
        <div className="flex items-center">
          <UserMenu user={user} onLogout={logout} />
        </div>
      </div>

      {/* Main Workstation Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Left Navigation Sidebar */}
        <WorkspaceSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          panelVisibility={panelVisibility}
          togglePanel={togglePanel}
        />

        {/* Central Multi-Panel Workspace */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
          {/* Horizontal View Category Filter Tabs */}
          <WorkspaceTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Grid Layout Container */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Central Institutional Charting Workstation (Full Width Hero Panel) */}
            {filterTab("trading") && (
              <div className="xl:col-span-2 space-y-6">
                <ChartWorkspace activeSymbol={activeSymbol} onSymbolChange={setActiveSymbol} />
                <CopilotPanel />
              </div>
            )}

            {/* 1. Market Overview & Quotes */}
            {filterTab("trading") && (
              <WorkspaceDock
                title="Market Overview & Real-Time Quotes"
                icon={TrendingUp}
                isVisible={panelVisibility.marketOverview}
                onToggle={() => togglePanel("marketOverview")}
              >
                <PortfolioDashboard />
              </WorkspaceDock>
            )}

            {/* 2. Portfolio Summary */}
            {filterTab("trading") && (
              <WorkspaceDock
                title="Portfolio Accounting & Positions"
                icon={PieChart}
                isVisible={panelVisibility.portfolio}
                onToggle={() => togglePanel("portfolio")}
              >
                <PortfolioPanel />
              </WorkspaceDock>
            )}

            {/* 3. Order Entry & Slicing */}
            {filterTab("trading") && (
              <WorkspaceDock
                title="Order Entry & Trade Submission"
                icon={ShoppingCart}
                isVisible={panelVisibility.orderEntry}
                onToggle={() => togglePanel("orderEntry")}
              >
                <OrderEntryPanel activeSymbol={activeSymbol} />
              </WorkspaceDock>
            )}

            {/* 4. Open Orders & Fills */}
            {filterTab("trading") && (
              <WorkspaceDock
                title="Open Orders & Active Fills"
                icon={ListOrdered}
                isVisible={panelVisibility.openOrders}
                onToggle={() => togglePanel("openOrders")}
              >
                <OpenOrdersPanel />
              </WorkspaceDock>
            )}

            {/* 5. Signal Engine Feed */}
            {filterTab("trading") && (
              <WorkspaceDock
                title="Quantitative Signal Engine Feed"
                icon={Zap}
                isVisible={panelVisibility.signals}
                onToggle={() => togglePanel("signals")}
              >
                <SignalPanel />
              </WorkspaceDock>
            )}

            {/* 6. Portfolio Construction & Optimization */}
            {filterTab("trading") && (
              <WorkspaceDock
                title="Portfolio Construction & Capital Optimization"
                icon={Sliders}
                isVisible={panelVisibility.portfolioConstruction}
                onToggle={() => togglePanel("portfolioConstruction")}
              >
                <PortfolioConstructionPanel />
              </WorkspaceDock>
            )}

            {/* 7. Risk Management Engine */}
            {filterTab("governance") && (
              <WorkspaceDock
                title="Enterprise Risk Engine & VaR Analytics"
                icon={ShieldAlert}
                isVisible={panelVisibility.risk}
                onToggle={() => togglePanel("risk")}
              >
                <RiskPanel />
              </WorkspaceDock>
            )}

            {/* 8. Pre-Trade Compliance Gate */}
            {filterTab("governance") && (
              <WorkspaceDock
                title="Pre-Trade Compliance & Mandate Gatekeeper"
                icon={ShieldCheck}
                isVisible={panelVisibility.compliance}
                onToggle={() => togglePanel("compliance")}
              >
                <CompliancePanel />
              </WorkspaceDock>
            )}

            {/* 9. Order Management System (OMS) */}
            {filterTab("trading") && (
              <WorkspaceDock
                title="Order Management System (OMS Lifecycle)"
                icon={Layers}
                isVisible={panelVisibility.oms}
                onToggle={() => togglePanel("oms")}
              >
                <OMSPanel />
              </WorkspaceDock>
            )}

            {/* 10. Execution Analytics & TCA */}
            {filterTab("analytics") && (
              <WorkspaceDock
                title="Transaction Cost Analysis (TCA) & Execution Manager"
                icon={BarChart2}
                isVisible={panelVisibility.execution}
                onToggle={() => togglePanel("execution")}
              >
                <ExecutionAnalyticsPanel />
              </WorkspaceDock>
            )}

            {/* 11. Broker Gateway & Adapters */}
            {filterTab("trading") && (
              <WorkspaceDock
                title="Broker Gateway & Execution Adapters"
                icon={Server}
                isVisible={panelVisibility.broker}
                onToggle={() => togglePanel("broker")}
              >
                <BrokerPanel />
              </WorkspaceDock>
            )}

            {/* 12. Strategy Optimization */}
            {filterTab("analytics") && (
              <WorkspaceDock
                title="Strategy Optimization & Hyperparameter Grid"
                icon={Activity}
                isVisible={panelVisibility.strategy}
                onToggle={() => togglePanel("strategy")}
              >
                <StrategyPanel />
              </WorkspaceDock>
            )}

            {/* 13. Backtesting Engine */}
            {filterTab("analytics") && (
              <WorkspaceDock
                title="Backtest Engine & Historical Simulation"
                icon={GitBranch}
                isVisible={panelVisibility.backtest}
                onToggle={() => togglePanel("backtest")}
              >
                <BacktestPanel />
              </WorkspaceDock>
            )}

            {/* 14. Telemetry & Observability */}
            {filterTab("system") && (
              <WorkspaceDock
                title="Telemetry & Observability Engine"
                icon={Activity}
                isVisible={panelVisibility.telemetry}
                onToggle={() => togglePanel("telemetry")}
              >
                <ObservabilityPanel />
              </WorkspaceDock>
            )}

            {/* 15. Broker Connectivity Sessions */}
            {filterTab("governance") && (
              <WorkspaceDock
                title="Broker Connectivity & Session Management"
                icon={Server}
                isVisible={panelVisibility.brokerConnectivity}
                onToggle={() => togglePanel("brokerConnectivity")}
              >
                <BrokerConnectivityPanel />
              </WorkspaceDock>
            )}

            {/* 16. High Availability Cluster */}
            {filterTab("system") && (
              <WorkspaceDock
                title="High Availability & Cluster Failover"
                icon={Server}
                isVisible={panelVisibility.highAvailability}
                onToggle={() => togglePanel("highAvailability")}
              >
                <HighAvailabilityPanel />
              </WorkspaceDock>
            )}

            {/* 17. Platform Kubernetes Deployment */}
            {filterTab("system") && (
              <WorkspaceDock
                title="Platform Deployment & Kubernetes Orchestration"
                icon={Server}
                isVisible={panelVisibility.platform}
                onToggle={() => togglePanel("platform")}
              >
                <PlatformPanel />
              </WorkspaceDock>
            )}

            {/* 18. Security & Identity Engine */}
            {filterTab("governance") && (
              <WorkspaceDock
                title="Security Engine & Vault Secret Management"
                icon={Lock}
                isVisible={panelVisibility.security}
                onToggle={() => togglePanel("security")}
              >
                <SecurityPanel />
              </WorkspaceDock>
            )}

            {/* 19. Benchmark & Load Testing Engine */}
            {filterTab("analytics") && (
              <WorkspaceDock
                title="Benchmark & SLA Load Testing Engine"
                icon={Gauge}
                isVisible={panelVisibility.benchmark}
                onToggle={() => togglePanel("benchmark")}
              >
                <BenchmarkPanel />
              </WorkspaceDock>
            )}

            {/* 20. System Quality Status */}
            {filterTab("system") && (
              <WorkspaceDock
                title="System Quality Assurance & Status"
                icon={CheckCircle2}
                isVisible={panelVisibility.systemStatus}
                onToggle={() => togglePanel("systemStatus")}
              >
                <SystemStatusPanel />
              </WorkspaceDock>
            )}

            {/* 21. IAM Admin Console */}
            {filterTab("system") && user.roles.includes("ADMIN") && (
              <WorkspaceDock
                title="IAM Admin Console"
                icon={Lock}
                isVisible={panelVisibility.iamAdmin}
                onToggle={() => togglePanel("iamAdmin")}
              >
                <AdminPanel user={user} />
              </WorkspaceDock>
            )}

            {/* 22. Deployment Infrastructure */}
            {filterTab("system") && (
              <WorkspaceDock
                title="Cloud Deployment & Infrastructure"
                icon={Server}
                isVisible={panelVisibility.deployment}
                onToggle={() => togglePanel("deployment")}
              >
                <DeploymentPanel />
              </WorkspaceDock>
            )}

            {/* 23. SRE & Operations Center */}
            {filterTab("system") && (
              <div className="xl:col-span-2">
                <WorkspaceDock
                  title="SRE & Operations Center"
                  icon={Activity}
                  isVisible={panelVisibility.operations}
                  onToggle={() => togglePanel("operations")}
                >
                  <OperationsPanel />
                </WorkspaceDock>
              </div>
            )}

            {/* 24. Release Dashboard */}
            {filterTab("system") && (
              <div className="xl:col-span-2">
                <WorkspaceDock
                  title="v1.0 Release Dashboard"
                  icon={FileText}
                  isVisible={panelVisibility.release}
                  onToggle={() => togglePanel("release")}
                >
                  <ReleasePanel />
                </WorkspaceDock>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Workstation Status Footer Bar */}
      <WorkspaceStatusBar />

      {/* Command Palette Modal */}
      <WorkspaceLayoutManager
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        panelVisibility={panelVisibility}
        togglePanel={togglePanel}
        preset={preset}
        applyPreset={applyPreset}
      />
    </div>
  );
}
