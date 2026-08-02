"use client";

import { useState, useCallback } from "react";

export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT" | "STOP";
export type OrderStatus = "PENDING" | "FILLED" | "PARTIALLY_FILLED" | "CANCELLED" | "REJECTED";

export interface OrderItem {
  orderId: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  filledQuantity: number;
  limitPrice: number;
  stopPrice: number;
  avgFillPrice: number;
  status: OrderStatus;
  createdAt: string;
}

const INITIAL_ORDERS: OrderItem[] = [
  {
    orderId: "ord-101",
    symbol: "AAPL",
    side: "BUY",
    orderType: "MARKET",
    quantity: 50,
    filledQuantity: 50,
    limitPrice: 0,
    stopPrice: 0,
    avgFillPrice: 175.0,
    status: "FILLED",
    createdAt: "10:14:02 AM",
  },
  {
    orderId: "ord-102",
    symbol: "MSFT",
    side: "BUY",
    orderType: "LIMIT",
    quantity: 15,
    filledQuantity: 0,
    limitPrice: 410.0,
    stopPrice: 0,
    avgFillPrice: 0,
    status: "PENDING",
    createdAt: "10:22:15 AM",
  },
  {
    orderId: "ord-103",
    symbol: "NVDA",
    side: "SELL",
    orderType: "STOP",
    quantity: 5,
    filledQuantity: 0,
    limitPrice: 0,
    stopPrice: 840.0,
    avgFillPrice: 0,
    status: "PENDING",
    createdAt: "10:28:40 AM",
  },
];

export function useOrders() {
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);

  const submitOrder = useCallback(
    (
      symbol: string,
      side: OrderSide,
      orderType: OrderType,
      quantity: number,
      limitPrice: number = 0,
      stopPrice: number = 0,
      currentMarketPrice: number = 180.0
    ) => {
      const sym = symbol.trim().toUpperCase();
      if (!sym || quantity <= 0) return null;

      const orderId = `ord-${Math.random().toString(36).substring(2, 7)}`;
      const nowStr = new Date().toLocaleTimeString();

      // Market order fills immediately
      const isMarket = orderType === "MARKET";
      const fillPrice = isMarket ? currentMarketPrice : 0;
      const initialStatus: OrderStatus = isMarket ? "FILLED" : "PENDING";

      const newOrder: OrderItem = {
        orderId,
        symbol: sym,
        side,
        orderType,
        quantity,
        filledQuantity: isMarket ? quantity : 0,
        limitPrice,
        stopPrice,
        avgFillPrice: fillPrice,
        status: initialStatus,
        createdAt: nowStr,
      };

      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    },
    []
  );

  const cancelOrder = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: "CANCELLED" as OrderStatus } : o))
    );
  }, []);

  const openOrders = orders.filter((o) => o.status === "PENDING" || o.status === "PARTIALLY_FILLED");
  const completedOrders = orders.filter((o) => o.status === "FILLED" || o.status === "CANCELLED");

  return {
    orders,
    openOrders,
    completedOrders,
    submitOrder,
    cancelOrder,
  };
}
