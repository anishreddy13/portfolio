"use client";

import { useState } from "react";

export interface RiskViolationItem {
  ruleName: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  timestamp: string;
}

export interface RiskMetricsData {
  riskScore: number;
  totalExposurePct: number;
  dailyLossPct: number;
  maxDrawdownPct: number;
  leverage: number;
  marginUsagePct: number;
  var95Pct: number;
  expectedShortfall95Pct: number;
  sectorExposure: Array<{ sector: string; exposurePct: number }>;
  recentViolations: RiskViolationItem[];
}

const INITIAL_RISK_DATA: RiskMetricsData = {
  riskScore: 18.5,
  totalExposurePct: 62.4,
  dailyLossPct: 0.85,
  maxDrawdownPct: 1.28,
  leverage: 1.25,
  marginUsagePct: 31.2,
  var95Pct: 1.82,
  expectedShortfall95Pct: 2.45,
  sectorExposure: [
    { sector: "Technology", exposurePct: 38.5 },
    { sector: "Consumer Cyclical", exposurePct: 14.2 },
    { sector: "Communication", exposurePct: 9.7 },
  ],
  recentViolations: [
    {
      ruleName: "Max Position Size Warning",
      severity: "LOW",
      description: "NVDA allocation approaches 12% single position threshold.",
      timestamp: "10:18 AM",
    },
  ],
};

export function useRisk() {
  const [riskData, setRiskData] = useState<RiskMetricsData>(INITIAL_RISK_DATA);

  return {
    riskData,
  };
}
