"use client";

import { useState } from "react";

export interface LatencyResultData {
  subsystem: string;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  minMs: number;
}

export interface ThroughputResultData {
  subsystem: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  requestsPerSec: number;
  successRatePct: number;
}

export interface BenchmarkReportData {
  reportId: string;
  runId: string;
  scenarioName: string;
  timestamp: string;
  latency: LatencyResultData;
  throughput: ThroughputResultData;
  deploymentTag: string;
  status: "PASSED" | "FAILED" | "DEGRADED";
}

export interface BenchmarkStatisticsData {
  totalRunsExecuted: number;
  baselineP95Ms: number;
  currentP95Ms: number;
  maxThroughputRps: number;
  overallSuccessRatePct: number;
}

const INITIAL_REPORTS: BenchmarkReportData[] = [
  {
    reportId: "rpt-bm-01",
    runId: "run-bm-01",
    scenarioName: "Full Platform Peak Load Benchmark",
    timestamp: "10:00:00 AM",
    latency: { subsystem: "PLATFORM", p50Ms: 4.2, p95Ms: 12.4, p99Ms: 18.5, maxMs: 28.0, minMs: 0.8 },
    throughput: { subsystem: "PLATFORM", totalRequests: 100000, successfulRequests: 99980, failedRequests: 20, requestsPerSec: 3450.0, successRatePct: 99.98 },
    deploymentTag: "v1.28.0",
    status: "PASSED",
  },
  {
    reportId: "rpt-bm-02",
    runId: "run-bm-02",
    scenarioName: "OMS & EMS Execution Stress Benchmark",
    timestamp: "10:15:00 AM",
    latency: { subsystem: "ORDER_MANAGEMENT", p50Ms: 8.5, p95Ms: 22.0, p99Ms: 35.0, maxMs: 48.0, minMs: 2.1 },
    throughput: { subsystem: "ORDER_MANAGEMENT", totalRequests: 50000, successfulRequests: 49995, failedRequests: 5, requestsPerSec: 1850.0, successRatePct: 99.99 },
    deploymentTag: "v1.28.0",
    status: "PASSED",
  },
];

const INITIAL_STATS: BenchmarkStatisticsData = {
  totalRunsExecuted: 2,
  baselineP95Ms: 14.5,
  currentP95Ms: 12.4,
  maxThroughputRps: 3450.0,
  overallSuccessRatePct: 99.99,
};

export function useBenchmark() {
  const [reports, setReports] = useState<BenchmarkReportData[]>(INITIAL_REPORTS);
  const [stats, setStats] = useState<BenchmarkStatisticsData>(INITIAL_STATS);

  const runBenchmark = (scenarioName: string = "On-Demand Subsystem Stress Run") => {
    const now = new Date().toLocaleTimeString();
    const newReport: BenchmarkReportData = {
      reportId: `rpt-${Date.now()}`,
      runId: `run-${Date.now()}`,
      scenarioName,
      timestamp: now,
      latency: { subsystem: "ALL_SUBSYSTEMS", p50Ms: 3.8, p95Ms: 11.2, p99Ms: 16.5, maxMs: 24.0, minMs: 0.6 },
      throughput: { subsystem: "ALL_SUBSYSTEMS", totalRequests: 60000, successfulRequests: 59998, failedRequests: 2, requestsPerSec: 3600.0, successRatePct: 99.99 },
      deploymentTag: "v1.28.0",
      status: "PASSED",
    };

    setReports((prev) => [newReport, ...prev]);
    setStats((prev) => ({
      ...prev,
      totalRunsExecuted: prev.totalRunsExecuted + 1,
      currentP95Ms: 11.2,
      maxThroughputRps: 3600.0,
    }));
  };

  return {
    reports,
    statistics: stats,
    runBenchmark,
  };
}
