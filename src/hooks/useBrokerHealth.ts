"use client";

import { useState, useCallback } from "react";

export interface BrokerCapabilitiesData {
  supportsMarketOrders: boolean;
  supportsLimitOrders: boolean;
  supportsStopOrders: boolean;
  supportsFractional: boolean;
  supportedAssets: string[];
}

export interface BrokerHealthItem {
  brokerName: string;
  brokerType: string;
  isConnected: boolean;
  latencyMs: number;
  successRatePct: number;
  healthScore: number;
  lastPing: string;
  capabilities: BrokerCapabilitiesData;
}

const INITIAL_BROKERS: BrokerHealthItem[] = [
  {
    brokerName: "PAPER_BROKER",
    brokerType: "PAPER",
    isConnected: true,
    latencyMs: 2.5,
    successRatePct: 100.0,
    healthScore: 98.5,
    lastPing: "Just now",
    capabilities: {
      supportsMarketOrders: true,
      supportsLimitOrders: true,
      supportsStopOrders: true,
      supportsFractional: true,
      supportedAssets: ["EQUITY", "ETF", "CRYPTO"],
    },
  },
  {
    brokerName: "ALPACA_MARKETS",
    brokerType: "ALPACA",
    isConnected: true,
    latencyMs: 42.1,
    successRatePct: 99.8,
    healthScore: 94.2,
    lastPing: "1 sec ago",
    capabilities: {
      supportsMarketOrders: true,
      supportsLimitOrders: true,
      supportsStopOrders: true,
      supportsFractional: true,
      supportedAssets: ["EQUITY", "ETF"],
    },
  },
  {
    brokerName: "INTERACTIVE_BROKERS",
    brokerType: "INTERACTIVE_BROKERS",
    isConnected: true,
    latencyMs: 38.5,
    successRatePct: 99.9,
    healthScore: 96.0,
    lastPing: "2 secs ago",
    capabilities: {
      supportsMarketOrders: true,
      supportsLimitOrders: true,
      supportsStopOrders: true,
      supportsFractional: true,
      supportedAssets: ["EQUITY", "ETF", "OPTIONS", "FUTURES", "FOREX"],
    },
  },
];

export function useBrokerHealth() {
  const [brokers, setBrokers] = useState<BrokerHealthItem[]>(INITIAL_BROKERS);
  const [activeBrokerName, setActiveBrokerName] = useState("PAPER_BROKER");

  const selectActiveBroker = useCallback((name: string) => {
    setActiveBrokerName(name);
  }, []);

  return {
    brokers,
    activeBrokerName,
    selectActiveBroker,
  };
}
