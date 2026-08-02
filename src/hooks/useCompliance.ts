"use client";

import { useState } from "react";

export interface ComplianceRuleData {
  ruleId: string;
  name: string;
  ruleType: string;
  description: string;
  isActive: boolean;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface ComplianceViolationData {
  violationId: string;
  ruleId: string;
  ruleName: string;
  severity: string;
  description: string;
  timestamp: string;
}

export interface ComplianceDecisionData {
  decisionId: string;
  allocationId: string;
  symbol: string;
  direction: string;
  isCompliant: boolean;
  violations: ComplianceViolationData[];
  approvedShares: number;
  approvedCapital: number;
  timestamp: string;
}

export interface RestrictedSecurityData {
  symbol: string;
  reason: string;
  restrictedSince: string;
  category: "RESTRICTED" | "WATCHLIST" | "SHORT_BAN";
}

export interface ComplianceLimitsData {
  maxPositionSizePct: number;
  maxSectorExposurePct: number;
  maxCountryExposurePct: number;
  maxGrossLeverage: number;
  minCashReservePct: number;
  maxMonthlyTurnoverPct: number;
}

const INITIAL_RULES: ComplianceRuleData[] = [
  { ruleId: "cr-01", name: "Restricted Security List Check", ruleType: "RESTRICTED_SECURITY", description: "Blocks trading in embargoed or restricted assets.", isActive: true, severity: "CRITICAL" },
  { ruleId: "cr-02", name: "Max Position Capital Limit (15%)", ruleType: "MAX_POSITION_LIMIT", description: "Caps single asset capital exposure at 15% of portfolio equity.", isActive: true, severity: "HIGH" },
  { ruleId: "cr-03", name: "Minimum Cash Reserve Requirement (5%)", ruleType: "CASH_REQUIREMENT", description: "Mandates maintaining at least 5% cash liquidity.", isActive: true, severity: "HIGH" },
  { ruleId: "cr-04", name: "IRS 30-Day Wash-Sale Prevention", ruleType: "WASH_SALE", description: "Detects repurchases within 30 days of loss sale.", isActive: true, severity: "MEDIUM" },
  { ruleId: "cr-05", name: "Max Sector Concentration (35%)", ruleType: "MAX_SECTOR_LIMIT", description: "Limits aggregate single-sector allocation.", isActive: true, severity: "HIGH" },
  { ruleId: "cr-06", name: "ESG Sustainability Threshold", ruleType: "ESG_CONSTRAINT", description: "Enforces minimum ESG rating score of 50.", isActive: true, severity: "MEDIUM" },
];

const INITIAL_RESTRICTED: RestrictedSecurityData[] = [
  { symbol: "LMT", reason: "Defense Export Restriction Mandate", restrictedSince: "2024-01-15", category: "RESTRICTED" },
  { symbol: "XOM", reason: "ESG Investment Exclusion List", restrictedSince: "2024-03-01", category: "WATCHLIST" },
  { symbol: "GME", reason: "Short Sale Embargo & Extreme Volatility Lock", restrictedSince: "2024-05-10", category: "SHORT_BAN" },
];

const INITIAL_AUDIT: ComplianceDecisionData[] = [
  {
    decisionId: "comp-901",
    allocationId: "alloc-301",
    symbol: "AAPL",
    direction: "BUY",
    isCompliant: true,
    violations: [],
    approvedShares: 45.0,
    approvedCapital: 8100.0,
    timestamp: "10:14:05 AM",
  },
  {
    decisionId: "comp-902",
    allocationId: "alloc-302",
    symbol: "MSFT",
    direction: "BUY",
    isCompliant: true,
    violations: [],
    approvedShares: 30.0,
    approvedCapital: 12300.0,
    timestamp: "10:22:20 AM",
  },
  {
    decisionId: "comp-903",
    allocationId: "alloc-303",
    symbol: "LMT",
    direction: "BUY",
    isCompliant: false,
    violations: [
      {
        violationId: "viol-101",
        ruleId: "cr-01",
        ruleName: "Restricted Security List Check",
        severity: "CRITICAL",
        description: "Security 'LMT' is on the firm's restricted trading list.",
        timestamp: "10:35:10 AM",
      },
    ],
    approvedShares: 0.0,
    approvedCapital: 0.0,
    timestamp: "10:35:10 AM",
  },
];

const INITIAL_LIMITS: ComplianceLimitsData = {
  maxPositionSizePct: 15.0,
  maxSectorExposurePct: 35.0,
  maxCountryExposurePct: 40.0,
  maxGrossLeverage: 1.5,
  minCashReservePct: 5.0,
  maxMonthlyTurnoverPct: 200.0,
};

export function useCompliance() {
  const [rules] = useState<ComplianceRuleData[]>(INITIAL_RULES);
  const [restrictedSecurities] = useState<RestrictedSecurityData[]>(INITIAL_RESTRICTED);
  const [auditHistory, setAuditHistory] = useState<ComplianceDecisionData[]>(INITIAL_AUDIT);
  const [limits] = useState<ComplianceLimitsData>(INITIAL_LIMITS);

  const activeViolations = auditHistory.flatMap((a) => a.violations);
  const approvedCount = auditHistory.filter((a) => a.isCompliant).length;
  const rejectedCount = auditHistory.filter((a) => !a.isCompliant).length;

  const approveDecision = (decisionId: string) => {
    setAuditHistory((prev) =>
      prev.map((item) =>
        item.decisionId === decisionId
          ? { ...item, isCompliant: true, violations: [] }
          : item
      )
    );
  };

  const rejectDecision = (decisionId: string) => {
    setAuditHistory((prev) =>
      prev.map((item) =>
        item.decisionId === decisionId
          ? { ...item, isCompliant: false }
          : item
      )
    );
  };

  return {
    rules,
    restrictedSecurities,
    auditHistory,
    limits,
    activeViolations,
    approvedCount,
    rejectedCount,
    approveDecision,
    rejectDecision,
  };
}
