"use client";

import { useState } from "react";

export interface FillItem {
  fillId: string;
  executionId: string;
  symbol: string;
  quantity: number;
  price: number;
  venue: string;
  timestamp: string;
}

export interface ExecutionReportItem {
  reportId: string;
  requestId: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  filledQuantity: number;
  avgFillPrice: number;
  status: "SUBMITTED" | "FILLED" | "PARTIALLY_FILLED" | "CANCELLED" | "REJECTED";
  venueRoute: string;
  latencyMs: number;
  updatedAt: string;
  fills: FillItem[];
}

export interface EMSStatisticsData {
  totalRequests: number;
  filledRequests: number;
  partialFills: number;
  cancelledRequests: number;
  averageLatencyMs: number;
  totalVolume: number;
}

const INITIAL_REPORTS: ExecutionReportItem[] = [
  {
    reportId: "rpt-801",
    requestId: "req-101",
    symbol: "AAPL",
    side: "BUY",
    quantity: 50,
    filledQuantity: 50,
    avgFillPrice: 175.02,
    status: "FILLED",
    venueRoute: "DARK_POOL_ALPHA",
    latencyMs: 3.42,
    updatedAt: "10:14:02 AM",
    fills: [
      { fillId: "f-1", executionId: "rpt-801", symbol: "AAPL", quantity: 50, price: 175.02, venue: "DARK_POOL_ALPHA", timestamp: "10:14:02 AM" },
    ],
  },
  {
    reportId: "rpt-802",
    requestId: "req-102",
    symbol: "MSFT",
    side: "BUY",
    quantity: 100,
    filledQuantity: 60,
    avgFillPrice: 410.15,
    status: "PARTIALLY_FILLED",
    venueRoute: "DIRECT_ECN_BETA",
    latencyMs: 4.85,
    updatedAt: "10:22:15 AM",
    fills: [
      { fillId: "f-2", executionId: "rpt-802", symbol: "MSFT", quantity: 60, price: 410.15, venue: "DIRECT_ECN_BETA", timestamp: "10:22:15 AM" },
    ],
  },
];

export function useExecution() {
  const [reports, setReports] = useState<ExecutionReportItem[]>(INITIAL_REPORTS);
  const [statistics, setStatistics] = useState<EMSStatisticsData>({
    totalRequests: 2,
    filledRequests: 1,
    partialFills: 1,
    cancelledRequests: 0,
    averageLatencyMs: 4.13,
    totalVolume: 33361.0,
  });

  return {
    reports,
    statistics,
  };
}
