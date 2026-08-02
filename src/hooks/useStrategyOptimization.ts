"use client";

import { useState } from "react";

export interface StrategyParameterItem {
  paramName: string;
  currentValue: number;
  minValue: number;
  maxValue: number;
  optimalValue: number;
}

export interface OptimizationCandidateItem {
  candidateId: string;
  fastPeriod: number;
  slowPeriod: number;
  sharpeRatio: number;
  totalReturnPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  compositeScore: number;
}

export interface WalkForwardResultData {
  windowId: string;
  inSampleSharpe: number;
  outOfSampleSharpe: number;
  efficiencyRatio: number;
}

export interface OptimizationRecommendationItem {
  recId: string;
  paramName: string;
  currentValue: number;
  recommendedValue: number;
  expectedSharpeGain: number;
  rationale: string;
}

const INITIAL_PARAMETERS: StrategyParameterItem[] = [
  { paramName: "fast_period", currentValue: 12.0, minValue: 5.0, maxValue: 30.0, optimalValue: 10.0 },
  { paramName: "slow_period", currentValue: 26.0, minValue: 15.0, maxValue: 60.0, optimalValue: 24.0 },
];

const INITIAL_CANDIDATES: OptimizationCandidateItem[] = [
  { candidateId: "cand-101", fastPeriod: 10.0, slowPeriod: 24.0, sharpeRatio: 2.35, totalReturnPct: 18.5, maxDrawdownPct: 6.4, winRatePct: 68.5, compositeScore: 94.2 },
  { candidateId: "cand-102", fastPeriod: 12.0, slowPeriod: 26.0, sharpeRatio: 1.85, totalReturnPct: 14.8, maxDrawdownPct: 8.2, winRatePct: 62.0, compositeScore: 82.5 },
  { candidateId: "cand-103", fastPeriod: 8.0, slowPeriod: 20.0, sharpeRatio: 1.62, totalReturnPct: 12.1, maxDrawdownPct: 11.5, winRatePct: 58.0, compositeScore: 71.0 },
];

const INITIAL_RECOMMENDATIONS: OptimizationRecommendationItem[] = [
  { recId: "rec-1", paramName: "fast_period", currentValue: 12.0, recommendedValue: 10.0, expectedSharpeGain: 0.35, rationale: "Optimal grid search candidate increases Sharpe ratio from 1.85 to 2.35." },
  { recId: "rec-2", paramName: "slow_period", currentValue: 26.0, recommendedValue: 24.0, expectedSharpeGain: 0.15, rationale: "Improves win rate by 6.5% with reduced drawdown." },
];

export function useStrategyOptimization() {
  const [parameters] = useState<StrategyParameterItem[]>(INITIAL_PARAMETERS);
  const [candidates] = useState<OptimizationCandidateItem[]>(INITIAL_CANDIDATES);
  const [recommendations] = useState<OptimizationRecommendationItem[]>(INITIAL_RECOMMENDATIONS);
  const [walkForward] = useState<WalkForwardResultData>({
    windowId: "wf-win-1",
    inSampleSharpe: 2.35,
    outOfSampleSharpe: 2.10,
    efficiencyRatio: 0.89,
  });
  const [robustnessScore] = useState(88.5);
  const [overfittingScore] = useState(12.0);

  return {
    parameters,
    candidates,
    recommendations,
    walkForward,
    robustnessScore,
    overfittingScore,
  };
}
