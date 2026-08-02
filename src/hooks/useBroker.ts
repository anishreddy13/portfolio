"use client";

import { useState } from "react";

export interface BrokerAccountData {
  accountId: string;
  brokerName: string;
  totalEquity: number;
  cashBalance: number;
  buyingPower: number;
  marginUsed: number;
  currency: string;
}

export interface BrokerPositionData {
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  pnlPct: number;
}

export interface BrokerOrderData {
  brokerOrderId: string;
  clientOrderId: string;
  symbol: string;
  side: string;
  quantity: number;
  filledQty: number;
  orderType: string;
  price: number;
  status: string;
  submittedAt: string;
}

export interface BrokerConnectionStatusData {
  sessionId: string;
  brokerName: string;
  status: "CONNECTED" | "DISCONNECTED" | "RECONNECTING" | "ERROR";
  connectedAt: string;
  latencyMs: number;
  health: "HEALTHY" | "DEGRADED" | "CRITICAL";
}

const INITIAL_ACCOUNT: BrokerAccountData = {
  accountId: "ACC-ALPACA-1001",
  brokerName: "Alpaca Markets",
  totalEquity: 125000.0,
  cashBalance: 35000.0,
  buyingPower: 140000.0,
  marginUsed: 0.0,
  currency: "USD",
};

const INITIAL_POSITIONS: BrokerPositionData[] = [
  { symbol: "AAPL", quantity: 50, avgEntryPrice: 180.0, currentPrice: 185.2, marketValue: 9260.0, unrealizedPnl: 260.0, pnlPct: 2.89 },
  { symbol: "MSFT", quantity: 30, avgEntryPrice: 410.0, currentPrice: 418.5, marketValue: 12555.0, unrealizedPnl: 255.0, pnlPct: 2.07 },
  { symbol: "NVDA", quantity: 40, avgEntryPrice: 120.0, currentPrice: 124.8, marketValue: 4992.0, unrealizedPnl: 192.0, pnlPct: 4.0 },
];

const INITIAL_ORDERS: BrokerOrderData[] = [
  { brokerOrderId: "b-ord-101", clientOrderId: "cl-9912", symbol: "AAPL", side: "BUY", quantity: 10, filledQty: 0, orderType: "LIMIT", price: 182.5, status: "OPEN", submittedAt: "10:14:02 AM" },
  { brokerOrderId: "b-ord-102", clientOrderId: "cl-9913", symbol: "MSFT", side: "SELL", quantity: 5, filledQty: 5, orderType: "MARKET", price: 418.5, status: "FILLED", submittedAt: "10:11:45 AM" },
];

const INITIAL_STATUS: BrokerConnectionStatusData = {
  sessionId: "sess-alpaca-9981",
  brokerName: "Alpaca Markets",
  status: "CONNECTED",
  connectedAt: new Date().toLocaleTimeString(),
  latencyMs: 14.2,
  health: "HEALTHY",
};

export function useBroker() {
  const [activeBroker, setActiveBroker] = useState<string>("Alpaca Markets");
  const [account, setAccount] = useState<BrokerAccountData>(INITIAL_ACCOUNT);
  const [positions, setPositions] = useState<BrokerPositionData[]>(INITIAL_POSITIONS);
  const [orders, setOrders] = useState<BrokerOrderData[]>(INITIAL_ORDERS);
  const [connectionStatus, setConnectionStatus] = useState<BrokerConnectionStatusData>(INITIAL_STATUS);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const reconnect = (brokerName?: string) => {
    const target = brokerName || activeBroker;
    setIsReconnecting(true);
    setTimeout(() => {
      setConnectionStatus({
        sessionId: `sess-${target.toLowerCase().replace(" ", "")}-${Date.now().toString().slice(-4)}`,
        brokerName: target,
        status: "CONNECTED",
        connectedAt: new Date().toLocaleTimeString(),
        latencyMs: Math.round(10 + Math.random() * 8),
        health: "HEALTHY",
      });
      setIsReconnecting(false);
    }, 800);
  };

  const switchBroker = (brokerName: string) => {
    setActiveBroker(brokerName);
    if (brokerName === "InteractiveBrokers") {
      setAccount({
        accountId: "U1029384",
        brokerName: "Interactive Brokers",
        totalEquity: 250000.0,
        cashBalance: 75000.0,
        buyingPower: 500000.0,
        marginUsed: 12500.0,
        currency: "USD",
      });
    } else if (brokerName === "PaperTrading") {
      setAccount({
        accountId: "ACC-PAPER-9999",
        brokerName: "Paper Trading",
        totalEquity: 100000.0,
        cashBalance: 100000.0,
        buyingPower: 200000.0,
        marginUsed: 0.0,
        currency: "USD",
      });
    } else {
      setAccount(INITIAL_ACCOUNT);
    }
    reconnect(brokerName);
  };

  return {
    activeBroker,
    switchBroker,
    account,
    positions,
    orders,
    connectionStatus,
    isReconnecting,
    reconnect,
  };
}
