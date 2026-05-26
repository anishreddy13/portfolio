"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface PlantAnalyticsScan {
  id: string;
  className: string;
  displayName: string;
  confidence: number;
  status: string;
  isHealthy: boolean;
  apiMs: number | null;
  modelMs: number | null;
  uploadKb: number;
  timestamp: string;
}

interface PlantAnalyticsState {
  totalScans: number;
  successfulPredictions: number;
  confidenceTotal: number;
  diseaseDistribution: Record<string, number>;
  recentScans: PlantAnalyticsScan[];
}

const STORAGE_KEY = "plant-disease-scan-analytics";

const initialState: PlantAnalyticsState = {
  totalScans: 0,
  successfulPredictions: 0,
  confidenceTotal: 0,
  diseaseDistribution: {},
  recentScans: [],
};

export function usePlantScanAnalytics() {
  const [state, setState] = useState<PlantAnalyticsState>(initialState);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setState({ ...initialState, ...JSON.parse(stored) });
    } catch {
      setState(initialState);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Local analytics are non-critical.
    }
  }, [state]);

  const recordScan = useCallback((scan: PlantAnalyticsScan) => {
    setState((current) => ({
      totalScans: current.totalScans + 1,
      successfulPredictions: current.successfulPredictions + 1,
      confidenceTotal: current.confidenceTotal + scan.confidence,
      diseaseDistribution: {
        ...current.diseaseDistribution,
        [scan.displayName]: (current.diseaseDistribution[scan.displayName] || 0) + 1,
      },
      recentScans: [scan, ...current.recentScans].slice(0, 6),
    }));
  }, []);

  const clearAnalytics = useCallback(() => setState(initialState), []);

  const summary = useMemo(() => {
    const averageConfidence =
      state.successfulPredictions > 0
        ? state.confidenceTotal / state.successfulPredictions
        : 0;

    const distribution = Object.entries(state.diseaseDistribution)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalScans: state.totalScans,
      successfulPredictions: state.successfulPredictions,
      averageConfidence,
      distribution,
      recentScans: state.recentScans,
    };
  }, [state]);

  return {
    analytics: summary,
    recordScan,
    clearAnalytics,
  };
}
