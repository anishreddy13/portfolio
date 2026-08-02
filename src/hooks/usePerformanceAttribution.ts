"use client";

import { useState } from "react";

export interface AssetContributionItem {
  symbol: string;
  weightPct: number;
  returnPct: number;
  contributionPct: number;
}

export interface SectorContributionItem {
  sectorName: string;
  weightPct: number;
  allocationEffectPct: number;
  selectionEffectPct: number;
  totalContributionPct: number;
}

export interface StrategyContributionItem {
  strategyName: string;
  allocatedCapital: number;
  realizedPnl: number;
  returnPct: number;
  contributionPct: number;
}

export interface PerformanceMetricsData {
  alpha: number;
  beta: number;
  trackingErrorPct: number;
  informationRatio: number;
  sharpeRatio: number;
  sortinoRatio: number;
  treynorRatio: number;
}

const INITIAL_ASSET_CONTRIBS: AssetContributionItem[] = [
  { symbol: "AAPL", weightPct: 8.5, returnPct: 12.4, contributionPct: 1.05 },
  { symbol: "MSFT", weightPct: 10.0, returnPct: 15.2, contributionPct: 1.52 },
  { symbol: "NVDA", weightPct: 6.2, returnPct: 28.5, contributionPct: 1.77 },
];

const INITIAL_SECTOR_CONTRIBS: SectorContributionItem[] = [
  { sectorName: "Information Technology", weightPct: 24.7, allocationEffectPct: 1.25, selectionEffectPct: 2.15, totalContributionPct: 3.4 },
  { sectorName: "Healthcare", weightPct: 14.2, allocationEffectPct: 0.35, selectionEffectPct: 0.82, totalContributionPct: 1.17 },
  { sectorName: "Financials", weightPct: 12.5, allocationEffectPct: -0.15, selectionEffectPct: 0.45, totalContributionPct: 0.3 },
];

const INITIAL_STRATEGY_CONTRIBS: StrategyContributionItem[] = [
  { strategyName: "EMA_CROSSOVER", allocatedCapital: 40000.0, realizedPnl: 4200.0, returnPct: 10.5, contributionPct: 4.2 },
  { strategyName: "RSI_MEAN_REVERSION", allocatedCapital: 35000.0, realizedPnl: 3800.0, returnPct: 10.85, contributionPct: 3.8 },
];

export function usePerformanceAttribution() {
  const [portfolioReturnPct] = useState(14.8);
  const [benchmarkReturnPct] = useState(10.5);
  const [assetContributions] = useState<AssetContributionItem[]>(INITIAL_ASSET_CONTRIBS);
  const [sectorContributions] = useState<SectorContributionItem[]>(INITIAL_SECTOR_CONTRIBS);
  const [strategyContributions] = useState<StrategyContributionItem[]>(INITIAL_STRATEGY_CONTRIBS);
  const [metrics] = useState<PerformanceMetricsData>({
    alpha: 3.82,
    beta: 0.92,
    trackingErrorPct: 3.25,
    informationRatio: 1.32,
    sharpeRatio: 1.85,
    sortinoRatio: 2.14,
    treynorRatio: 0.18,
  });

  return {
    portfolioReturnPct,
    benchmarkReturnPct,
    assetContributions,
    sectorContributions,
    strategyContributions,
    metrics,
  };
}
