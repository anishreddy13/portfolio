"use client";

import { useState } from "react";

export interface ExecutionQualityData {
  executionId: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  avgFillPrice: number;
  arrivalPrice: number;
  vwap: number;
  twap: number;
  arrivalSlippageBps: number;
  vwapSlippageBps: number;
  marketImpactBps: number;
  implementationShortfallBps: number;
  executionCostDollars: number;
  qualityScore: number;
  rating: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  timestamp: string;
}

export interface TCAStatisticsData {
  totalExecutionsAnalyzed: number;
  averageSlippageBps: number;
  averageMarketImpactBps: number;
  totalShortfallDollars: number;
  averageQualityScore: number;
}

const INITIAL_ANALYTICS: ExecutionQualityData[] = [
  {
    executionId: "rpt-801",
    symbol: "AAPL",
    side: "BUY",
    quantity: 50,
    avgFillPrice: 175.02,
    arrivalPrice: 175.0,
    vwap: 175.01,
    twap: 175.01,
    arrivalSlippageBps: 1.14,
    vwapSlippageBps: 0.57,
    marketImpactBps: 0.85,
    implementationShortfallBps: 1.14,
    executionCostDollars: 1.0,
    qualityScore: 97.5,
    rating: "EXCELLENT",
    timestamp: "10:14:02 AM",
  },
  {
    executionId: "rpt-802",
    symbol: "MSFT",
    side: "BUY",
    quantity: 60,
    avgFillPrice: 410.15,
    arrivalPrice: 410.0,
    vwap: 410.08,
    twap: 410.05,
    arrivalSlippageBps: 3.66,
    vwapSlippageBps: 1.71,
    marketImpactBps: 2.15,
    implementationShortfallBps: 3.66,
    executionCostDollars: 9.0,
    qualityScore: 92.0,
    rating: "EXCELLENT",
    timestamp: "10:22:15 AM",
  },
];

export function useExecutionAnalytics() {
  const [analytics, setAnalytics] = useState<ExecutionQualityData[]>(INITIAL_ANALYTICS);
  const [statistics] = useState<TCAStatisticsData>({
    totalExecutionsAnalyzed: 2,
    averageSlippageBps: 2.4,
    averageMarketImpactBps: 1.5,
    totalShortfallDollars: 10.0,
    averageQualityScore: 94.75,
  });

  return {
    analytics,
    statistics,
  };
}
