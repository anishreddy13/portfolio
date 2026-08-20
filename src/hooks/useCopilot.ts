"use client";

import { useState } from "react";

export interface CopilotActionData {
  actionId: string;
  actionType: string;
  targetSymbol: string;
  parameters: Record<string, unknown>;
  status: string;
}

export interface CopilotMessageData {
  msgId: string;
  sender: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  timestamp: string;
  actions?: CopilotActionData[];
}

export interface CopilotSuggestionData {
  suggestionId: string;
  title: string;
  description: string;
  category: "TRADE" | "HEDGE" | "REBALANCE" | "RISK_ALERT";
  confidence: number;
}

export interface CopilotExecutionPlanData {
  planId: string;
  title: string;
  steps: Array<{ step: number; name: string; description: string }>;
  estimatedImpact: string;
  complianceStatus: string;
}

export interface CopilotStatisticsData {
  totalConversations: number;
  totalQueriesAnswered: number;
  totalPlansGenerated: number;
  totalRecommendationsMade: number;
}

const INITIAL_MESSAGES: CopilotMessageData[] = [
  {
    msgId: "msg-1",
    sender: "ASSISTANT",
    content: "Hello! I am your Enterprise AI Trading Copilot. I analyze all 37 completed subsystems to explain signals, portfolio risk, and generate execution plans.",
    timestamp: "10:00:00 AM",
  },
];

const INITIAL_SUGGESTIONS: CopilotSuggestionData[] = [
  { suggestionId: "sug-1", title: "Rebalance Tech Allocation", description: "AAPL allocation exceeds 15% portfolio limit. Consider trimming 2%.", category: "REBALANCE", confidence: 0.94 },
  { suggestionId: "sug-2", title: "Add SPY Downside Hedge", description: "MarketRegimeEngine detects HIGH_VOLATILITY regime. Protective put recommended.", category: "HEDGE", confidence: 0.88 },
  { suggestionId: "sug-3", title: "Strong Momentum Signal for MSFT", description: "SignalEngine composite score 0.88 with 0.92 conviction.", category: "TRADE", confidence: 0.91 },
];

const INITIAL_STATS: CopilotStatisticsData = {
  totalConversations: 1,
  totalQueriesAnswered: 5,
  totalPlansGenerated: 2,
  totalRecommendationsMade: 3,
};

export function useCopilot() {
  const [messages, setMessages] = useState<CopilotMessageData[]>(INITIAL_MESSAGES);
  const [suggestions] = useState<CopilotSuggestionData[]>(INITIAL_SUGGESTIONS);
  const [executionPlan, setExecutionPlan] = useState<CopilotExecutionPlanData | null>(null);
  const [stats, setStats] = useState<CopilotStatisticsData>(INITIAL_STATS);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString();

    const userMsg: CopilotMessageData = {
      msgId: `msg-u-${Date.now()}`,
      sender: "USER",
      content: text,
      timestamp: now,
    };

    let replyText = "Copilot Analysis: All 37 subsystems operational. Latency P95=12.4ms, Audit chain verified (SHA-256).";
    const lower = text.toLowerCase();

    if (lower.includes("risk")) {
      replyText = "EnterpriseRiskEngine Analysis: Daily VaR (95%)=$1,250.00, Expected Shortfall (CVaR)=$1,850.00, Current Leverage=1.0x. Status: COMPLIANT.";
    } else if (lower.includes("portfolio")) {
      replyText = "Portfolio Accounting: Total Equity=$100,000.00, Cash=$25,000.00, Long Equity Allocation=75%. Top position: AAPL (14.2%).";
    } else if (lower.includes("signal") || lower.includes("aapl")) {
      replyText = "SignalEngine Analysis for AAPL: Direction=BUY, Composite Score=0.88, Conviction=0.92. Price Target=$189.80, Stop Loss=$178.85.";
    }

    const assistantMsg: CopilotMessageData = {
      msgId: `msg-a-${Date.now()}`,
      sender: "ASSISTANT",
      content: replyText,
      timestamp: now,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStats((prev) => ({ ...prev, totalQueriesAnswered: prev.totalQueriesAnswered + 1 }));
  };

  const generatePlan = (title: string = "Recommended Trade Execution Plan") => {
    const plan: CopilotExecutionPlanData = {
      planId: `plan-${Date.now()}`,
      title,
      steps: [
        { step: 1, name: "Signal Validation", description: "Validate signal parameters in SignalEngine." },
        { step: 2, name: "Capital Sizing", description: "Calculate Risk Parity capital allocation in PortfolioConstructionEngine." },
        { step: 3, name: "Compliance Gate", description: "Validate pre-trade mandate rules in ComplianceEngine." },
        { step: 4, name: "OMS Slicing", description: "Initialize parent/child orders in OMS." },
      ],
      estimatedImpact: "Neutral risk shift, +0.2% expected alpha",
      complianceStatus: "PASSED",
    };
    setExecutionPlan(plan);
    setStats((prev) => ({ ...prev, totalPlansGenerated: prev.totalPlansGenerated + 1 }));
  };

  return {
    messages,
    suggestions,
    executionPlan,
    statistics: stats,
    sendMessage,
    generatePlan,
  };
}
