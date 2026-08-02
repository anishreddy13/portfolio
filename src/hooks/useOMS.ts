"use client";

import { useState, useCallback } from "react";

export interface ChildOrderItem {
  childId: string;
  parentId: string;
  symbol: string;
  side: "BUY" | "SELL";
  orderType: string;
  quantity: number;
  price: number;
  status: string;
}

export interface ParentOrderItem {
  parentId: string;
  symbol: string;
  side: "BUY" | "SELL";
  orderType: string;
  quantity: number;
  filledQuantity: number;
  avgFillPrice: number;
  limitPrice: number;
  stopPrice: number;
  status: "CREATED" | "RISK_CHECKED" | "APPROVED" | "ROUTED_TO_EXECUTION" | "FILLED" | "PARTIALLY_FILLED" | "REPLACED" | "CANCELLED" | "REJECTED";
  childOrders: ChildOrderItem[];
  timestamp: string;
}

export interface OrderAuditEntryItem {
  entryId: string;
  orderId: string;
  fromState: string;
  toState: string;
  description: string;
  timestamp: string;
}

const INITIAL_PARENT_ORDERS: ParentOrderItem[] = [
  {
    parentId: "pord-901",
    symbol: "AAPL",
    side: "BUY",
    orderType: "MARKET",
    quantity: 50,
    filledQuantity: 50,
    avgFillPrice: 175.0,
    limitPrice: 0,
    stopPrice: 0,
    status: "FILLED",
    childOrders: [
      { childId: "child-1", parentId: "pord-901", symbol: "AAPL", side: "BUY", orderType: "MARKET", quantity: 50, price: 175.0, status: "FILLED" },
    ],
    timestamp: "10:14:02 AM",
  },
  {
    parentId: "pord-902",
    symbol: "MSFT",
    side: "BUY",
    orderType: "LIMIT",
    quantity: 100,
    filledQuantity: 0,
    avgFillPrice: 0,
    limitPrice: 410.0,
    stopPrice: 0,
    status: "APPROVED",
    childOrders: [
      { childId: "child-2a", parentId: "pord-902", symbol: "MSFT", side: "BUY", orderType: "LIMIT", quantity: 50, price: 410.0, status: "APPROVED" },
      { childId: "child-2b", parentId: "pord-902", symbol: "MSFT", side: "BUY", orderType: "LIMIT", quantity: 50, price: 410.0, status: "APPROVED" },
    ],
    timestamp: "10:22:15 AM",
  },
];

const INITIAL_AUDIT_LOG: OrderAuditEntryItem[] = [
  { entryId: "a-1", orderId: "pord-901", fromState: "NONE", toState: "CREATED", description: "Parent order initialized.", timestamp: "10:14:00 AM" },
  { entryId: "a-2", orderId: "pord-901", fromState: "CREATED", toState: "RISK_CHECKED", description: "Risk evaluation passed.", timestamp: "10:14:01 AM" },
  { entryId: "a-3", orderId: "pord-901", fromState: "RISK_CHECKED", toState: "APPROVED", description: "Order approved by RiskEngine.", timestamp: "10:14:01 AM" },
  { entryId: "a-4", orderId: "pord-901", fromState: "APPROVED", toState: "FILLED", description: "EMS execution completed @ $175.00.", timestamp: "10:14:02 AM" },
];

export function useOMS() {
  const [orders, setOrders] = useState<ParentOrderItem[]>(INITIAL_PARENT_ORDERS);
  const [auditLogs, setAuditLogs] = useState<OrderAuditEntryItem[]>(INITIAL_AUDIT_LOG);

  const cancelOrder = useCallback((parentId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.parentId === parentId ? { ...o, status: "CANCELLED" as const } : o))
    );
  }, []);

  return {
    orders,
    auditLogs,
    cancelOrder,
  };
}
