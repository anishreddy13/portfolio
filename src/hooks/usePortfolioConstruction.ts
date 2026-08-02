"use client";

import { useState } from "react";

export interface TargetPositionItem {
  symbol: string;
  targetWeightPct: number;
  currentWeightPct: number;
  targetShares: number;
  targetDollarAllocation: number;
  sizingModel: "RISK_PARITY" | "KELLY" | "VOLATILITY_TARGET" | "EQUAL_WEIGHT";
}

export interface PortfolioConstraintData {
  maxSinglePositionPct: number;
  maxSectorWeightPct: number;
  minCashBufferPct: number;
  targetVolatilityPct: number;
}

const INITIAL_TARGET_POSITIONS: TargetPositionItem[] = [
  {
    symbol: "AAPL",
    targetWeightPct: 8.5,
    currentWeightPct: 7.2,
    targetShares: 48.5,
    targetDollarAllocation: 8500.0,
    sizingModel: "RISK_PARITY",
  },
  {
    symbol: "MSFT",
    targetWeightPct: 10.0,
    currentWeightPct: 9.8,
    targetShares: 24.4,
    targetDollarAllocation: 10000.0,
    sizingModel: "RISK_PARITY",
  },
  {
    symbol: "NVDA",
    targetWeightPct: 6.2,
    currentWeightPct: 8.4,
    targetShares: 7.3,
    targetDollarAllocation: 6200.0,
    sizingModel: "VOLATILITY_TARGET",
  },
];

export function usePortfolioConstruction() {
  const [targetPositions, setTargetPositions] = useState<TargetPositionItem[]>(INITIAL_TARGET_POSITIONS);
  const [constraints] = useState<PortfolioConstraintData>({
    maxSinglePositionPct: 10.0,
    maxSectorWeightPct: 30.0,
    minCashBufferPct: 5.0,
    targetVolatilityPct: 15.0,
  });

  return {
    targetPositions,
    constraints,
  };
}
