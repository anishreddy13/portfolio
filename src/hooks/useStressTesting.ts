"use client";

import { useState } from "react";

export interface ScenarioResultData {
  scenarioId: string;
  scenarioName: string;
  isHistorical: boolean;
  portfolioLossPct: number;
  worstCasePnl: number;
  stressedVar95: number;
  stressedExpectedShortfall95: number;
  dominantRiskFactor: string;
  recoveryEstimateDays: number;
}

export interface FactorShockMatrixEntry {
  factor: string;
  minus20Pct: number;
  minus10Pct: number;
  plus10Pct: number;
  plus20Pct: number;
}

const INITIAL_SCENARIOS: ScenarioResultData[] = [
  {
    scenarioId: "hist-2008",
    scenarioName: "2008 Global Financial Crisis",
    isHistorical: true,
    portfolioLossPct: -58.275,
    worstCasePnl: -58275.0,
    stressedVar95: 4.89,
    stressedExpectedShortfall95: 6.61,
    dominantRiskFactor: "MARKET_BETA",
    recoveryEstimateDays: 1250,
  },
  {
    scenarioId: "hist-2020",
    scenarioName: "2020 COVID Flash Crash",
    isHistorical: true,
    portfolioLossPct: -35.595,
    worstCasePnl: -35595.0,
    stressedVar95: 5.39,
    stressedExpectedShortfall95: 7.27,
    dominantRiskFactor: "VOLATILITY",
    recoveryEstimateDays: 148,
  },
  {
    scenarioId: "hist-2000",
    scenarioName: "2000 Dot-Com Bubble Collapse",
    isHistorical: true,
    portfolioLossPct: -51.555,
    worstCasePnl: -51555.0,
    stressedVar95: 3.48,
    stressedExpectedShortfall95: 4.70,
    dominantRiskFactor: "GROWTH",
    recoveryEstimateDays: 1810,
  },
  {
    scenarioId: "hypo-geo",
    scenarioName: "Geopolitical Escalation Flash Crash",
    isHistorical: false,
    portfolioLossPct: -25.125,
    worstCasePnl: -25125.0,
    stressedVar95: 3.56,
    stressedExpectedShortfall95: 4.81,
    dominantRiskFactor: "VOLATILITY",
    recoveryEstimateDays: 25,
  },
  {
    scenarioId: "hypo-tech",
    scenarioName: "Mega-Cap Tech Valuation Unwind",
    isHistorical: false,
    portfolioLossPct: -29.25,
    worstCasePnl: -29250.0,
    stressedVar95: 3.30,
    stressedExpectedShortfall95: 4.45,
    dominantRiskFactor: "MOMENTUM",
    recoveryEstimateDays: 75,
  },
  {
    scenarioId: "hypo-rate",
    scenarioName: "Emergency +150bps Rate Hike",
    isHistorical: false,
    portfolioLossPct: -18.25,
    worstCasePnl: -18250.0,
    stressedVar95: 2.85,
    stressedExpectedShortfall95: 3.85,
    dominantRiskFactor: "INTEREST_RATE",
    recoveryEstimateDays: 50,
  },
];

const INITIAL_SHOCK_MATRIX: FactorShockMatrixEntry[] = [
  { factor: "Market Beta", minus20Pct: -21.0, minus10Pct: -10.5, plus10Pct: 10.5, plus20Pct: 21.0 },
  { factor: "Momentum", minus20Pct: -8.4, minus10Pct: -4.2, plus10Pct: 4.2, plus20Pct: 8.4 },
  { factor: "Growth", minus20Pct: -13.0, minus10Pct: -6.5, plus10Pct: 6.5, plus20Pct: 13.0 },
  { factor: "Quality", minus20Pct: -7.6, minus10Pct: -3.8, plus10Pct: 3.8, plus20Pct: 7.6 },
];

export function useStressTesting() {
  const [scenarios] = useState<ScenarioResultData[]>(INITIAL_SCENARIOS);
  const [shockMatrix] = useState<FactorShockMatrixEntry[]>(INITIAL_SHOCK_MATRIX);

  const worstScenario = scenarios.reduce((prev, curr) =>
    curr.portfolioLossPct < prev.portfolioLossPct ? curr : prev
  );

  const aggregateStressedVar = 4.24;
  const aggregateExpectedShortfall = 5.73;

  const recommendations = [
    "CRITICAL: Tail risk breach under scenario '2008 Global Financial Crisis' (-58.3% loss). Implement downside options collar.",
    "HIGH RISK: Stressed 95% VaR exceeds threshold in 4 of 6 scenarios. Reduce gross leverage by 15-20%.",
    "RECOMMENDATION: Increase allocation to Quality (+15%) and Low Volatility (+10%) factors to buffer rate shock downside.",
  ];

  return {
    scenarios,
    worstScenario,
    aggregateStressedVar,
    aggregateExpectedShortfall,
    shockMatrix,
    recommendations,
  };
}
