"use client";

import { useState } from "react";

export interface FactorExposureData {
  factorName: string;
  factorType: string;
  exposureValue: number;
  normalizedExposure: number;
  isSignificant: boolean;
}

export interface FactorContributionData {
  factorName: string;
  contributionPct: number;
  weightPct: number;
}

export interface FactorRiskData {
  factorName: string;
  varianceContributionPct: number;
  marginalRiskPct: number;
}

export interface FactorCorrelationEntry {
  factorA: string;
  factorB: string;
  correlation: number;
}

const INITIAL_EXPOSURES: FactorExposureData[] = [
  { factorName: "Market Beta", factorType: "MARKET_BETA", exposureValue: 1.05, normalizedExposure: 0.0, isSignificant: true },
  { factorName: "Momentum", factorType: "MOMENTUM", exposureValue: 0.42, normalizedExposure: 0.0, isSignificant: true },
  { factorName: "Value", factorType: "VALUE", exposureValue: -0.18, normalizedExposure: 0.0, isSignificant: true },
  { factorName: "Growth", factorType: "GROWTH", exposureValue: 0.65, normalizedExposure: 0.0, isSignificant: true },
  { factorName: "Quality", factorType: "QUALITY", exposureValue: 0.38, normalizedExposure: 0.0, isSignificant: true },
  { factorName: "Low Volatility", factorType: "LOW_VOLATILITY", exposureValue: -0.25, normalizedExposure: 0.0, isSignificant: true },
  { factorName: "Sector", factorType: "SECTOR", exposureValue: 0.55, normalizedExposure: 0.0, isSignificant: true },
];

const INITIAL_CONTRIBUTIONS: FactorContributionData[] = [
  { factorName: "Market Beta", contributionPct: 8.93, weightPct: 62.8 },
  { factorName: "Momentum", contributionPct: 1.76, weightPct: 12.4 },
  { factorName: "Growth", contributionPct: 1.82, weightPct: 12.8 },
  { factorName: "Quality", contributionPct: 0.95, weightPct: 6.7 },
  { factorName: "Sector", contributionPct: 0.61, weightPct: 4.3 },
  { factorName: "Value", contributionPct: -0.56, weightPct: 3.9 },
  { factorName: "Low Volatility", contributionPct: -0.48, weightPct: 3.4 },
];

const INITIAL_RISKS: FactorRiskData[] = [
  { factorName: "Market Beta", varianceContributionPct: 248.06, marginalRiskPct: 64.2 },
  { factorName: "Growth", varianceContributionPct: 27.04, marginalRiskPct: 7.0 },
  { factorName: "Sector", varianceContributionPct: 19.36, marginalRiskPct: 5.0 },
  { factorName: "Momentum", varianceContributionPct: 11.29, marginalRiskPct: 2.9 },
  { factorName: "Quality", varianceContributionPct: 9.25, marginalRiskPct: 2.4 },
  { factorName: "Low Volatility", varianceContributionPct: 4.0, marginalRiskPct: 1.0 },
  { factorName: "Value", varianceContributionPct: 2.07, marginalRiskPct: 0.5 },
];

const INITIAL_CORRELATIONS: FactorCorrelationEntry[] = [
  { factorA: "Market Beta", factorB: "Momentum", correlation: 0.35 },
  { factorA: "Momentum", factorB: "Growth", correlation: 0.42 },
  { factorA: "Value", factorB: "Quality", correlation: 0.28 },
  { factorA: "Quality", factorB: "Low Vol", correlation: 0.38 },
  { factorA: "Market Beta", factorB: "Growth", correlation: 0.30 },
  { factorA: "Value", factorB: "Low Vol", correlation: 0.22 },
];

export function useFactorModel() {
  const [exposures] = useState<FactorExposureData[]>(INITIAL_EXPOSURES);
  const [contributions] = useState<FactorContributionData[]>(INITIAL_CONTRIBUTIONS);
  const [risks] = useState<FactorRiskData[]>(INITIAL_RISKS);
  const [correlations] = useState<FactorCorrelationEntry[]>(INITIAL_CORRELATIONS);

  const totalFactorReturn = 14.21;
  const residualReturn = 0.59;

  return {
    exposures,
    contributions,
    risks,
    correlations,
    totalFactorReturn,
    residualReturn,
  };
}
