"use client";

import { useState } from "react";

export interface SubsystemHealthData {
  subsystem: string;
  status: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
  healthScore: number;
  latencyP95Ms: number;
  errorRatePct: number;
  throughputMsgSec: number;
}

export interface LatencyChartEntry {
  subsystem: string;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
}

export interface AlertData {
  alertId: string;
  ruleId: string;
  subsystem: string;
  message: string;
  severity: "INFO" | "WARNING" | "HIGH" | "CRITICAL";
  timestamp: string;
  isResolved: boolean;
}

export interface SystemResourceData {
  overallHealthScore: number;
  systemStatus: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
  cpuUsagePct: number;
  memoryUsageMb: number;
  queueDepth: number;
  activeAlertsCount: number;
}

const INITIAL_HEALTHS: SubsystemHealthData[] = [
  { subsystem: "REQUEST_COORDINATOR", status: "HEALTHY", healthScore: 98.5, latencyP95Ms: 12.4, errorRatePct: 0.0, throughputMsgSec: 340.0 },
  { subsystem: "STREAMING_MANAGER", status: "HEALTHY", healthScore: 99.2, latencyP95Ms: 3.5, errorRatePct: 0.0, throughputMsgSec: 1250.0 },
  { subsystem: "CONSENSUS_ENGINE", status: "HEALTHY", healthScore: 97.8, latencyP95Ms: 9.1, errorRatePct: 0.1, throughputMsgSec: 280.0 },
  { subsystem: "COMPLIANCE_ENGINE", status: "HEALTHY", healthScore: 99.5, latencyP95Ms: 6.5, errorRatePct: 0.0, throughputMsgSec: 85.0 },
  { subsystem: "ORDER_MANAGEMENT", status: "HEALTHY", healthScore: 95.0, latencyP95Ms: 22.0, errorRatePct: 0.2, throughputMsgSec: 65.0 },
  { subsystem: "EXECUTION_MANAGER", status: "HEALTHY", healthScore: 94.2, latencyP95Ms: 42.0, errorRatePct: 0.3, throughputMsgSec: 45.0 },
  { subsystem: "BROKER_GATEWAY", status: "HEALTHY", healthScore: 96.0, latencyP95Ms: 38.0, errorRatePct: 0.1, throughputMsgSec: 45.0 },
  { subsystem: "AUDIT_ENGINE", status: "HEALTHY", healthScore: 99.8, latencyP95Ms: 2.2, errorRatePct: 0.0, throughputMsgSec: 420.0 },
  { subsystem: "PORTFOLIO_MANAGER", status: "HEALTHY", healthScore: 99.0, latencyP95Ms: 4.8, errorRatePct: 0.0, throughputMsgSec: 110.0 },
  { subsystem: "RISK_ENGINE", status: "HEALTHY", healthScore: 98.0, latencyP95Ms: 8.2, errorRatePct: 0.0, throughputMsgSec: 130.0 },
];

const INITIAL_LATENCY: LatencyChartEntry[] = [
  { subsystem: "Request Coord", p50Ms: 5.2, p95Ms: 12.4, p99Ms: 18.0, maxMs: 24.5 },
  { subsystem: "Streaming Mgr", p50Ms: 1.1, p95Ms: 3.5, p99Ms: 4.2, maxMs: 6.0 },
  { subsystem: "Consensus", p50Ms: 3.4, p95Ms: 9.1, p99Ms: 14.0, maxMs: 21.0 },
  { subsystem: "Compliance", p50Ms: 2.1, p95Ms: 6.5, p99Ms: 9.8, maxMs: 12.0 },
  { subsystem: "OMS", p50Ms: 8.5, p95Ms: 22.0, p99Ms: 35.0, maxMs: 48.0 },
  { subsystem: "Execution (EMS)", p50Ms: 12.0, p95Ms: 42.0, p99Ms: 65.0, maxMs: 95.0 },
  { subsystem: "Audit Engine", p50Ms: 0.8, p95Ms: 2.2, p99Ms: 3.8, maxMs: 5.0 },
];

const INITIAL_ALERTS: AlertData[] = [
  {
    alertId: "alt-101",
    ruleId: "ar-01",
    subsystem: "REQUEST_COORDINATOR",
    message: "SingleFlight request coalescing latency optimal (P95 = 12.4ms).",
    severity: "INFO",
    timestamp: "10:14:00 AM",
    isResolved: true,
  },
  {
    alertId: "alt-102",
    ruleId: "ar-03",
    subsystem: "COMPLIANCE_ENGINE",
    message: "Pre-trade compliance latency check within threshold (6.5ms < 50ms).",
    severity: "INFO",
    timestamp: "10:14:05 AM",
    isResolved: true,
  },
];

const INITIAL_RESOURCES: SystemResourceData = {
  overallHealthScore: 97.7,
  systemStatus: "HEALTHY",
  cpuUsagePct: 14.2,
  memoryUsageMb: 512.0,
  queueDepth: 0,
  activeAlertsCount: 0,
};

export function useObservability() {
  const [subsystemHealths] = useState<SubsystemHealthData[]>(INITIAL_HEALTHS);
  const [latencyData] = useState<LatencyChartEntry[]>(INITIAL_LATENCY);
  const [alerts] = useState<AlertData[]>(INITIAL_ALERTS);
  const [resources] = useState<SystemResourceData>(INITIAL_RESOURCES);

  return {
    subsystemHealths,
    latencyData,
    alerts,
    resources,
  };
}
