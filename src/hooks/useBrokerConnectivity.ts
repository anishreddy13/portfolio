"use client";

import { useState } from "react";

export interface BrokerCapabilityData {
  brokerName: string;
  supportsFractional: boolean;
  supportsShorting: boolean;
  supportsStopLimit: boolean;
  maxOrderRatePerSec: number;
  supportedAssetClasses: string[];
}

export interface BrokerConnectionData {
  brokerId: string;
  brokerName: string;
  status: "CONNECTED" | "DISCONNECTED" | "RECONNECTING" | "DEGRADED" | "FAILED";
  isPrimary: boolean;
  isFailover: boolean;
  primaryUrl: string;
  backupUrl: string;
  lastHeartbeat: string;
  latencyMs: number;
  reconnectCount: number;
  capability: BrokerCapabilityData;
}

export interface BrokerConnectivityStatisticsData {
  totalConfigured: number;
  activeConnected: number;
  primaryBrokerName: string;
  failoverBrokerName: string;
  averageLatencyMs: number;
  totalReconnects: number;
}

const INITIAL_CONNECTIONS: BrokerConnectionData[] = [
  {
    brokerId: "bconn-paper",
    brokerName: "PAPER_BROKER",
    status: "CONNECTED",
    isPrimary: true,
    isFailover: false,
    primaryUrl: "sim://paper-trading-engine/v1",
    backupUrl: "sim://backup-paper-trading/v1",
    lastHeartbeat: "10:14:00 AM",
    latencyMs: 1.2,
    reconnectCount: 0,
    capability: {
      brokerName: "PAPER_BROKER",
      supportsFractional: true,
      supportsShorting: true,
      supportsStopLimit: true,
      maxOrderRatePerSec: 100,
      supportedAssetClasses: ["EQUITY", "OPTION", "CRYPTO"],
    },
  },
  {
    brokerId: "bconn-alpaca",
    brokerName: "ALPACA_PRIMARY",
    status: "CONNECTED",
    isPrimary: false,
    isFailover: true,
    primaryUrl: "wss://stream.data.alpaca.markets/v2/sip",
    backupUrl: "wss://stream.data.alpaca.markets/v2/iex",
    lastHeartbeat: "10:14:00 AM",
    latencyMs: 18.5,
    reconnectCount: 1,
    capability: {
      brokerName: "ALPACA_PRIMARY",
      supportsFractional: true,
      supportsShorting: true,
      supportsStopLimit: true,
      maxOrderRatePerSec: 50,
      supportedAssetClasses: ["EQUITY", "OPTION"],
    },
  },
  {
    brokerId: "bconn-ibkr",
    brokerName: "IBKR_GATEWAY",
    status: "CONNECTED",
    isPrimary: false,
    isFailover: false,
    primaryUrl: "wss://localhost:5000/v1/api/ws",
    backupUrl: "wss://localhost:5001/v1/api/ws",
    lastHeartbeat: "10:14:00 AM",
    latencyMs: 32.0,
    reconnectCount: 0,
    capability: {
      brokerName: "IBKR_GATEWAY",
      supportsFractional: true,
      supportsShorting: true,
      supportsStopLimit: true,
      maxOrderRatePerSec: 30,
      supportedAssetClasses: ["EQUITY", "OPTION", "FUTURE", "FOREX"],
    },
  },
];

const INITIAL_STATS: BrokerConnectivityStatisticsData = {
  totalConfigured: 3,
  activeConnected: 3,
  primaryBrokerName: "PAPER_BROKER",
  failoverBrokerName: "ALPACA_PRIMARY",
  averageLatencyMs: 17.2,
  totalReconnects: 1,
};

export function useBrokerConnectivity() {
  const [connections, setConnections] = useState<BrokerConnectionData[]>(INITIAL_CONNECTIONS);
  const [stats, setStats] = useState<BrokerConnectivityStatisticsData>(INITIAL_STATS);

  const triggerFailover = () => {
    setConnections((prev) =>
      prev.map((conn) => {
        if (conn.isPrimary) {
          return { ...conn, isPrimary: false, status: "DEGRADED" };
        }
        if (conn.isFailover) {
          return { ...conn, isPrimary: true, isFailover: false, status: "CONNECTED" };
        }
        return conn;
      })
    );

    setStats((prev) => ({
      ...prev,
      primaryBrokerName: "ALPACA_PRIMARY",
      failoverBrokerName: "IBKR_GATEWAY",
    }));
  };

  const reconnectBroker = (brokerName: string) => {
    const now = new Date().toLocaleTimeString();
    setConnections((prev) =>
      prev.map((conn) => {
        if (conn.brokerName === brokerName) {
          return {
            ...conn,
            status: "CONNECTED",
            lastHeartbeat: now,
            reconnectCount: conn.reconnectCount + 1,
          };
        }
        return conn;
      })
    );
  };

  return {
    connections,
    statistics: stats,
    triggerFailover,
    reconnectBroker,
  };
}
