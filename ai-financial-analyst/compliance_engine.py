"""
compliance_engine.py — Production-Grade Enterprise Compliance Engine

Sole owner of pre-trade compliance validation. Evaluates AllocationDecision envelopes
against firm restricted lists, position limits, liquidity requirements, wash-sale rules,
and ESG constraints before forwarding compliant decisions to the OrderManagementSystem (OMS).
"""

from __future__ import annotations

import logging
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from compliance_models import (
    ComplianceDecision,
    ComplianceReport,
    ComplianceRule,
    ComplianceStatistics,
    ComplianceViolation,
    RestrictedSecurity,
)
from compliance_rules import evaluate_compliance
from multi_portfolio_engine import MultiPortfolioEngine, global_multi_portfolio_engine
from order_management_system import OrderManagementSystem, global_order_management_system
from portfolio_manager import PortfolioManager, global_portfolio_manager
from risk_engine import EnterpriseRiskEngine, global_risk_engine

# Late-bound import to avoid circular dependency at module level
_audit_engine = None


def _get_audit_engine():
    global _audit_engine
    if _audit_engine is None:
        try:
            from audit_engine import global_audit_engine
            _audit_engine = global_audit_engine
        except ImportError:
            _audit_engine = None
    return _audit_engine


_observability_engine = None


def _get_obs_engine():
    global _observability_engine
    if _observability_engine is None:
        try:
            from observability_engine import global_observability_engine
            _observability_engine = global_observability_engine
        except ImportError:
            _observability_engine = None
    return _observability_engine


logger = logging.getLogger("compliance_engine")

DEFAULT_RESTRICTED_SECURITIES = [
    RestrictedSecurity("LMT", "Defense Export Restriction Mandate", "2024-01-15", "RESTRICTED"),
    RestrictedSecurity("XOM", "ESG Investment Exclusion List", "2024-03-01", "WATCHLIST"),
    RestrictedSecurity("GME", "Short Sale Embargo & Extreme Volatility Lock", "2024-05-10", "SHORT_BAN"),
]

DEFAULT_ACTIVE_RULES = [
    ComplianceRule("cr-01", "Restricted Security List Check", "RESTRICTED_SECURITY", "Blocks trading in embargoed or restricted assets.", True, "CRITICAL"),
    ComplianceRule("cr-02", "Max Position Capital Limit (15%)", "MAX_POSITION_LIMIT", "Caps single asset capital exposure at 15% of portfolio equity.", True, "HIGH"),
    ComplianceRule("cr-03", "Minimum Cash Reserve Requirement (5%)", "CASH_REQUIREMENT", "Mandates maintaining at least 5% cash liquidity.", True, "HIGH"),
    ComplianceRule("cr-04", "IRS 30-Day Wash-Sale Prevention", "WASH_SALE", "Detects repurchases within 30 days of loss sale.", True, "MEDIUM"),
    ComplianceRule("cr-05", "Max Sector Concentration (35%)", "MAX_SECTOR_LIMIT", "Limits aggregate single-sector allocation.", True, "HIGH"),
    ComplianceRule("cr-06", "ESG Sustainability Threshold", "ESG_CONSTRAINT", "Enforces minimum ESG rating score of 50.", True, "MEDIUM"),
]


class ComplianceEngine:
    """Production-Grade Enterprise Compliance Engine.

    Usage::

        engine = ComplianceEngine()
        decision = engine.evaluate(allocation_decision)
        if decision.is_compliant:
            # Forwarded to OMS
    """

    def __init__(
        self,
        portfolio_manager: Optional[PortfolioManager] = None,
        multi_portfolio_engine: Optional[MultiPortfolioEngine] = None,
        risk_engine: Optional[EnterpriseRiskEngine] = None,
        oms: Optional[OrderManagementSystem] = None,
    ) -> None:
        self.portfolio_manager = portfolio_manager or global_portfolio_manager
        self.multi_portfolio_engine = multi_portfolio_engine or global_multi_portfolio_engine
        self.risk_engine = risk_engine or global_risk_engine
        self.oms = oms or global_order_management_system
        self._lock = threading.RLock()

        # Storage
        self._restricted_list: List[RestrictedSecurity] = list(DEFAULT_RESTRICTED_SECURITIES)
        self._rules: List[ComplianceRule] = list(DEFAULT_ACTIVE_RULES)
        self._audit_history: List[ComplianceDecision] = []

        # Operational Statistics
        self._total_evaluations = 0
        self._approved_count = 0
        self._rejected_count = 0
        self._violations_count = 0
        self._total_latency_ms = 0.0

        logger.info("ComplianceEngine subsystem initialized.")

    # ─────────────────────────────────────────────
    # Main Compliance Gatekeeper API
    # ─────────────────────────────────────────────

    def evaluate(self, allocation: Any, portfolio_id: str = "default") -> ComplianceDecision:
        """Validate an AllocationDecision envelope against all active compliance rules."""
        start_t = time.monotonic()
        now_iso = datetime.now(timezone.utc).isoformat()
        decision_id = f"comp-{uuid.uuid4().hex[:8]}"

        alloc_id = getattr(allocation, "decision_id", f"alloc-{uuid.uuid4().hex[:6]}")
        sym = getattr(allocation, "symbol", "AAPL").strip().upper()
        direction = getattr(allocation, "direction", "BUY").strip().upper()
        shares = float(getattr(allocation, "target_shares", 10.0))
        target_cap = float(getattr(allocation, "target_capital", 1800.0))

        with self._lock:
            self._total_evaluations += 1

            # Fetch portfolio context
            summary = self.portfolio_manager.portfolio_summary(portfolio_id)
            tot_eq = summary.total_equity if summary.total_equity > 0 else 100000.0
            cash = summary.cash_balance

            restricted_symbols = [r.symbol for r in self._restricted_list]

            # Evaluate pure compliance rules
            rule_violations = evaluate_compliance(
                symbol=sym,
                direction=direction,
                target_shares=shares,
                target_capital=target_cap,
                total_equity=tot_eq,
                remaining_cash=cash,
                restricted_symbols=restricted_symbols,
            )

            violations: List[ComplianceViolation] = []
            for r_name, severity, desc in rule_violations:
                v = ComplianceViolation(
                    violation_id=f"viol-{uuid.uuid4().hex[:6]}",
                    rule_id=f"rule-{uuid.uuid4().hex[:4]}",
                    rule_name=r_name,
                    severity=severity,
                    description=desc,
                    timestamp=now_iso,
                )
                violations.append(v)
                self._violations_count += 1

            is_compliant = len(violations) == 0

            decision = ComplianceDecision(
                decision_id=decision_id,
                allocation_id=alloc_id,
                symbol=sym,
                direction=direction,
                is_compliant=is_compliant,
                violations=violations,
                approved_shares=shares if is_compliant else 0.0,
                approved_capital=target_cap if is_compliant else 0.0,
                timestamp=now_iso,
            )

            if is_compliant:
                self._approved_count += 1
            else:
                self._rejected_count += 1

            self._audit_history.append(decision)

            latency = (time.monotonic() - start_t) * 1000.0
            self._total_latency_ms += latency

        obs = _get_obs_engine()
        if obs is not None:
            obs.record("COMPLIANCE_ENGINE", "compliance_latency_ms", latency)

        # If compliant, route to OMS (assuming quantity & sizing are finalized)
        if is_compliant:
            self.oms.submit_order(
                symbol=sym,
                side=direction,
                order_type="LIMIT",
                quantity=shares,
                limit_price=target_cap / max(shares, 1.0),
                portfolio_id=portfolio_id,
            )

        logger.info(
            "Compliance evaluation '%s' for %s (%s): %s (violations=%d, latency=%.2fms)",
            decision_id, sym, direction, "APPROVED" if is_compliant else "REJECTED", len(violations), latency,
        )

        # Record compliance decision in AuditEngine
        aud = _get_audit_engine()
        if aud is not None:
            aud.record(
                subsystem="COMPLIANCE_ENGINE",
                event_type="COMPLIANCE_APPROVED" if is_compliant else "COMPLIANCE_REJECTED",
                severity="INFO" if is_compliant else "HIGH",
                symbol=sym,
                portfolio_id=portfolio_id,
                payload={
                    "decision_id": decision_id,
                    "allocation_id": alloc_id,
                    "is_compliant": is_compliant,
                    "violations_count": len(violations),
                },
            )

        return decision

    def approve(self, decision_id: str) -> bool:
        """Manually override approval for an audit record."""
        with self._lock:
            for d in self._audit_history:
                if d.decision_id == decision_id:
                    d.is_compliant = True
                    logger.info("Manually approved compliance decision '%s'.", decision_id)
                    return True
        return False

    def reject(self, decision_id: str, reason: str = "Manual Compliance Officer Overrule") -> bool:
        """Manually reject an audit record."""
        with self._lock:
            for d in self._audit_history:
                if d.decision_id == decision_id:
                    d.is_compliant = False
                    d.violations.append(
                        ComplianceViolation(
                            violation_id=f"viol-{uuid.uuid4().hex[:6]}",
                            rule_id="manual-override",
                            rule_name="Officer Overrule",
                            severity="CRITICAL",
                            description=reason,
                            timestamp=datetime.now(timezone.utc).isoformat(),
                        )
                    )
                    logger.info("Manually rejected compliance decision '%s'.", decision_id)
                    return True
        return False

    # ─────────────────────────────────────────────
    # Query API
    # ─────────────────────────────────────────────

    def audit_history(self) -> List[ComplianceDecision]:
        """Return all historical ComplianceDecision audit records."""
        with self._lock:
            return list(self._audit_history)

    def active_rules(self) -> List[ComplianceRule]:
        """Return active compliance rules."""
        with self._lock:
            return [r for r in self._rules if r.is_active]

    def restricted_securities(self) -> List[RestrictedSecurity]:
        """Return restricted securities list."""
        with self._lock:
            return list(self._restricted_list)

    def generate_report(self) -> ComplianceReport:
        """Generate comprehensive ComplianceReport snapshot."""
        with self._lock:
            now_iso = datetime.now(timezone.utc).isoformat()
            active_viols = []
            for d in reversed(self._audit_history):
                active_viols.extend(d.violations)
                if len(active_viols) >= 10:
                    break

            return ComplianceReport(
                report_id=f"rpt-{uuid.uuid4().hex[:8]}",
                total_evaluations=self._total_evaluations,
                approved_count=self._approved_count,
                rejected_count=self._rejected_count,
                active_violations=active_viols,
                restricted_securities=list(self._restricted_list),
                timestamp=now_iso,
            )

    def statistics(self) -> ComplianceStatistics:
        """Return operational ComplianceStatistics snapshot."""
        with self._lock:
            cnt = self._total_evaluations if self._total_evaluations > 0 else 1
            return ComplianceStatistics(
                total_evaluations=self._total_evaluations,
                approved_allocations=self._approved_count,
                rejected_allocations=self._rejected_count,
                violations_recorded=self._violations_count,
                average_latency_ms=self._total_latency_ms / cnt,
            )


# Shared global singleton instance
global_compliance_engine = ComplianceEngine()
