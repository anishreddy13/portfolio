"use client";

import { useState } from "react";

export interface ManagedPortfolioItem {
  portfolioId: string;
  name: string;
  strategyType: string;
  totalEquity: number;
  cashBalance: number;
  positionsCount: number;
  unrealizedPnl: number;
  realizedPnl: number;
  weightInGroupPct: number;
}

export interface CrossPortfolioExposureItem {
  symbol: string;
  totalShares: number;
  totalMarketValue: number;
  groupExposurePct: number;
  portfoliosHolding: string[];
  isOverlapping: boolean;
}

export interface PortfolioAggregateData {
  groupId: string;
  groupName: string;
  totalGroupEquity: number;
  totalGroupCash: number;
  totalPositionsCount: number;
  grossMarketExposure: number;
  aggregateLeverage: number;
  aggregateVar95Pct: number;
  topOverlappingSymbols: CrossPortfolioExposureItem[];
  sectorWeights: Record<string, number>;
  factorExposures: Record<string, number>;
}

export interface PortfolioComparisonData {
  portfolioIdA: string;
  portfolioNameA: string;
  portfolioIdB: string;
  portfolioNameB: string;
  equityRatio: number;
  holdingOverlapPct: number;
  betaDifference: number;
  returnCorrelation: number;
}

const INITIAL_MANAGED: ManagedPortfolioItem[] = [
  {
    portfolioId: "default",
    name: "Main Trading Portfolio",
    strategyType: "ALPHA_MOMENTUM",
    totalEquity: 115200.0,
    cashBalance: 25000.0,
    positionsCount: 4,
    unrealizedPnl: 10450.0,
    realizedPnl: 4750.0,
    weightInGroupPct: 42.6,
  },
  {
    portfolioId: "quant_alpha",
    name: "Quant Systematic Alpha",
    strategyType: "SYSTEMATIC_STAT_ARB",
    totalEquity: 85400.0,
    cashBalance: 18200.0,
    positionsCount: 6,
    unrealizedPnl: 6820.0,
    realizedPnl: 3100.0,
    weightInGroupPct: 31.6,
  },
  {
    portfolioId: "growth_core",
    name: "Tech & Innovation Core",
    strategyType: "GROWTH_TREND",
    totalEquity: 69800.0,
    cashBalance: 12000.0,
    positionsCount: 3,
    unrealizedPnl: 8100.0,
    realizedPnl: 1900.0,
    weightInGroupPct: 25.8,
  },
];

const INITIAL_AGGREGATE: PortfolioAggregateData = {
  groupId: "default_group",
  groupName: "Main Enterprise Fund Group",
  totalGroupEquity: 270400.0,
  totalGroupCash: 55200.0,
  totalPositionsCount: 13,
  grossMarketExposure: 215200.0,
  aggregateLeverage: 0.80,
  aggregateVar95Pct: 2.14,
  topOverlappingSymbols: [
    {
      symbol: "AAPL",
      totalShares: 120.0,
      totalMarketValue: 21000.0,
      groupExposurePct: 7.76,
      portfoliosHolding: ["Main Trading Portfolio", "Quant Systematic Alpha"],
      isOverlapping: true,
    },
    {
      symbol: "MSFT",
      totalShares: 85.0,
      totalMarketValue: 34850.0,
      groupExposurePct: 12.89,
      portfoliosHolding: ["Main Trading Portfolio", "Tech & Innovation Core"],
      isOverlapping: true,
    },
    {
      symbol: "NVDA",
      totalShares: 40.0,
      totalMarketValue: 33600.0,
      groupExposurePct: 12.43,
      portfoliosHolding: ["Quant Systematic Alpha", "Tech & Innovation Core"],
      isOverlapping: true,
    },
  ],
  sectorWeights: {
    "Information Technology": 45.2,
    "Healthcare": 18.5,
    "Financials": 14.8,
    "Consumer Discretionary": 12.5,
    "Communication Services": 9.0,
  },
  factorExposures: {
    "Market Beta": 1.02,
    "Momentum": 0.38,
    "Growth": 0.58,
    "Quality": 0.42,
    "Value": -0.12,
  },
};

const INITIAL_COMPARISON: PortfolioComparisonData = {
  portfolioIdA: "default",
  portfolioNameA: "Main Trading Portfolio",
  portfolioIdB: "quant_alpha",
  portfolioNameB: "Quant Systematic Alpha",
  equityRatio: 1.35,
  holdingOverlapPct: 33.3,
  betaDifference: 0.13,
  returnCorrelation: 0.74,
};

export function useMultiPortfolio() {
  const [activePortfolioId, setActivePortfolioId] = useState<string>("default");
  const [managedPortfolios] = useState<ManagedPortfolioItem[]>(INITIAL_MANAGED);
  const [groupAggregate] = useState<PortfolioAggregateData>(INITIAL_AGGREGATE);
  const [comparison] = useState<PortfolioComparisonData>(INITIAL_COMPARISON);

  return {
    activePortfolioId,
    setActivePortfolioId,
    managedPortfolios,
    groupAggregate,
    comparison,
  };
}
