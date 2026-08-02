"use client";

import { useState } from "react";

export interface RegimeSnapshotData {
  snapshotId: string;
  regime: string;
  confidencePct: number;
  trendScore: number;
  volatilityScore: number;
  momentumScore: number;
  meanReversionScore: number;
  durationMinutes: number;
  timestamp: string;
}

export interface RegimeTransitionData {
  transitionId: string;
  fromRegime: string;
  toRegime: string;
  probabilityPct: number;
  timestamp: string;
}

export interface RegimeProbabilityData {
  regime: string;
  probabilityPct: number;
}

const INITIAL_SNAPSHOT: RegimeSnapshotData = {
  snapshotId: "snap-001",
  regime: "BULL_TREND",
  confidencePct: 88.5,
  trendScore: 0.72,
  volatilityScore: 0.35,
  momentumScore: 0.58,
  meanReversionScore: 0.22,
  durationMinutes: 145,
  timestamp: "10:14:00 AM",
};

const INITIAL_TRANSITIONS: RegimeTransitionData[] = [
  { transitionId: "tr-1", fromRegime: "NEUTRAL", toRegime: "BULL_TREND", probabilityPct: 14.0, timestamp: "09:30:00 AM" },
  { transitionId: "tr-2", fromRegime: "LOW_VOLATILITY", toRegime: "NEUTRAL", probabilityPct: 14.0, timestamp: "09:15:00 AM" },
];

const INITIAL_MATRIX: RegimeProbabilityData[] = [
  { regime: "BULL_TREND", probabilityPct: 72.0 },
  { regime: "NEUTRAL", probabilityPct: 14.0 },
  { regime: "MOMENTUM", probabilityPct: 14.0 },
  { regime: "BEAR_TREND", probabilityPct: 4.7 },
  { regime: "HIGH_VOLATILITY", probabilityPct: 4.7 },
  { regime: "LOW_VOLATILITY", probabilityPct: 4.7 },
  { regime: "MEAN_REVERTING", probabilityPct: 4.7 },
  { regime: "RISK_OFF", probabilityPct: 4.7 },
];

export function useMarketRegime() {
  const [currentSnapshot] = useState<RegimeSnapshotData>(INITIAL_SNAPSHOT);
  const [transitions] = useState<RegimeTransitionData[]>(INITIAL_TRANSITIONS);
  const [transitionMatrix] = useState<RegimeProbabilityData[]>(INITIAL_MATRIX);

  return {
    currentSnapshot,
    transitions,
    transitionMatrix,
  };
}
