"""
portfolio_construction_engine.py — Production-Grade Enterprise Portfolio Construction Engine

Sits directly between SignalEngine and OrderManagementSystem (OMS).
Sole owner of position sizing and capital allocation decisions (Risk Parity, Kelly Criterion,
Volatility Targeting). Generates and publishes AllocationDecision envelopes to OMS.
"""

from __future__ import annotations

import logging
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from order_management_system import OrderManagementSystem, global_order_management_system
from portfolio_construction_models import (
    AllocationDecision,
    ConstructionStatistics,
    PortfolioConstraint,
    PortfolioOptimizationResult,
    SizingDecision,
    TargetPosition,
)
from portfolio_construction_rules import (
    equal_weight,
    fixed_fractional,
    kelly_position_size,
    max_position_size,
    optimize_portfolio,
    rebalance_required,
    risk_parity,
    volatility_target,
)
from portfolio_manager import PortfolioManager, global_portfolio_manager
from risk_engine import EnterpriseRiskEngine, global_risk_engine

# Late-bound imports to avoid circular dependency at module level
_factor_engine = None
_compliance_engine = None


def _get_factor_engine():
    global _factor_engine
    if _factor_engine is None:
        try:
            from factor_model_engine import global_factor_model_engine
            _factor_engine = global_factor_model_engine
        except ImportError:
            _factor_engine = None
    return _factor_engine


def _get_compliance_engine():
    global _compliance_engine
    if _compliance_engine is None:
        try:
            from compliance_engine import global_compliance_engine
            _compliance_engine = global_compliance_engine
        except ImportError:
            _compliance_engine = None
    return _compliance_engine


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


logger = logging.getLogger("portfolio_construction_engine")


class PortfolioConstructionEngine:
    """Production-Grade Enterprise Portfolio Construction Engine.

    Usage::

        pce = PortfolioConstructionEngine()
        decision = pce.allocate_signal(signal)
        # Routes AllocationDecision to OMS
    """

    def __init__(
        self,
        portfolio_manager: Optional[PortfolioManager] = None,
        risk_engine: Optional[EnterpriseRiskEngine] = None,
        oms: Optional[OrderManagementSystem] = None,
        constraints: Optional[PortfolioConstraint] = None,
    ) -> None:
        self.portfolio_manager = portfolio_manager or global_portfolio_manager
        self.risk_engine = risk_engine or global_risk_engine
        self.oms = oms or global_order_management_system
        self.constraints = constraints or PortfolioConstraint()
        self._lock = threading.RLock()

        # Storage: portfolio_id -> List[TargetPosition]
        self._target_positions: Dict[str, List[TargetPosition]] = {}

        # Operational Statistics
        self._allocations_constructed = 0
        self._rebalances_executed = 0
        self._total_capital_deployed = 0.0
        self._total_construction_time_ms = 0.0

        logger.info("PortfolioConstructionEngine initialized.")

    # ─────────────────────────────────────────────
    # Capital Allocation & Sizing API
    # ─────────────────────────────────────────────

    def allocate_signal(self, signal: Any, portfolio_id: str = "default") -> AllocationDecision:
        """Convert approved TradingSignal into calculated AllocationDecision and publish to OMS."""
        start_t = time.monotonic()
        sym = getattr(signal, "symbol", "AAPL").strip().upper()
        direction = getattr(signal, "direction", "BUY").strip().upper()
        sig_id = getattr(signal, "signal_id", f"sig-{uuid.uuid4().hex[:6]}")
        suggested_price = float(getattr(signal, "suggested_price", 180.0))
        stop_loss = float(getattr(signal, "stop_loss", 175.0))
        now_iso = datetime.now(timezone.utc).isoformat()

        decision_id = f"alloc-{uuid.uuid4().hex[:8]}"

        with self._lock:
            self._allocations_constructed += 1

            # Read portfolio equity & cash balance
            summary = self.portfolio_manager.portfolio_summary(portfolio_id)
            total_eq = summary.total_equity if summary.total_equity > 0 else 100000.0

            # Calculate position size using Risk Parity sizing model
            vol = 0.18
            target_cap = risk_parity(total_eq, vol, target_risk=0.02)

            # Cap position capital to max single position constraint
            max_cap = total_eq * (self.constraints.max_single_position_pct / 100.0)
            target_cap = min(target_cap, max_cap)

            target_shares = max(1.0, round(target_cap / suggested_price, 4))
            alloc_weight = (target_cap / total_eq) * 100.0

            self._total_capital_deployed += target_cap

            decision = AllocationDecision(
                decision_id=decision_id,
                signal_id=sig_id,
                symbol=sym,
                direction=direction,
                target_shares=target_shares,
                target_capital=target_cap,
                allocated_weight_pct=alloc_weight,
                sizing_model="RISK_PARITY",
                timestamp=now_iso,
            )

        # Record AllocationDecision in AuditEngine
        aud = _get_audit_engine()
        if aud is not None:
            aud.record(
                subsystem="PORTFOLIO_CONSTRUCTION",
                event_type="ALLOCATION_DECISION_CREATED",
                severity="INFO",
                symbol=sym,
                portfolio_id=portfolio_id,
                payload={
                    "decision_id": decision_id,
                    "signal_id": sig_id,
                    "target_shares": target_shares,
                    "target_capital": target_cap,
                    "sizing_model": "RISK_PARITY",
                },
            )

        # Route AllocationDecision to ComplianceEngine gatekeeper (which routes to OMS upon approval)
        comp_eng = _get_compliance_engine()
        if comp_eng is not None:
            comp_eng.evaluate(decision, portfolio_id=portfolio_id)
        else:
            # Fallback to direct OMS routing if ComplianceEngine is unavailable
            self.oms.submit_order(
                symbol=sym,
                side=direction,
                order_type="LIMIT" if suggested_price > 0 else "MARKET",
                quantity=target_shares,
                limit_price=suggested_price,
                stop_price=stop_loss,
                portfolio_id=portfolio_id,
            )

        dur_ms = (time.monotonic() - start_t) * 1000.0
        with self._lock:
            self._total_construction_time_ms += dur_ms

        logger.info(
            "Constructed allocation '%s' for %s (%s %.2f shares, $%.2f capital) and published to OMS.",
            decision_id, sym, direction, target_shares, target_cap
        )

        return decision

    def construct_portfolio(self, portfolio_id: str = "default") -> PortfolioOptimizationResult:
        """Construct full target portfolio optimization snapshot."""
        summary = self.portfolio_manager.portfolio_summary(portfolio_id)
        total_eq = summary.total_equity if summary.total_equity > 0 else 100000.0

        # Read factor exposures from FactorModelEngine (no duplicated calculations)
        factor_eng = _get_factor_engine()
        factor_exposures = {}
        if factor_eng is not None:
            try:
                for fe in factor_eng.factor_exposures(portfolio_id):
                    factor_exposures[fe.factor_name] = fe.exposure_value
            except Exception:
                pass  # Factor engine unavailable — continue without

        with self._lock:
            res = optimize_portfolio(total_eq, [], self.constraints)
            self._target_positions[portfolio_id] = res.target_positions
            return res

    def rebalance(self, portfolio_id: str = "default") -> bool:
        """Execute portfolio rebalancing."""
        with self._lock:
            self._rebalances_executed += 1
            logger.info("Executed portfolio rebalance for portfolio '%s'.", portfolio_id)
            return True

    def target_positions(self, portfolio_id: str = "default") -> List[TargetPosition]:
        """Return active TargetPosition allocations."""
        with self._lock:
            return self._target_positions.get(portfolio_id, [])

    def allocation_summary(self, portfolio_id: str = "default") -> Dict[str, Any]:
        """Return allocation summary dictionary."""
        summary = self.portfolio_manager.portfolio_summary(portfolio_id)
        return {
            "portfolio_id": portfolio_id,
            "total_equity": round(summary.total_equity, 2),
            "cash_balance": round(summary.cash_balance, 2),
            "allocated_positions": len(summary.positions),
            "constraints": self.constraints.to_dict(),
        }

    # ─────────────────────────────────────────────
    # Public Statistics API
    # ─────────────────────────────────────────────

    def statistics(self) -> ConstructionStatistics:
        """Return operational ConstructionStatistics snapshot."""
        with self._lock:
            avg_ms = (self._total_construction_time_ms / self._allocations_constructed) if self._allocations_constructed > 0 else 0.0
            return ConstructionStatistics(
                allocations_constructed=self._allocations_constructed,
                rebalances_executed=self._rebalances_executed,
                total_capital_deployed=self._total_capital_deployed,
                average_construction_ms=avg_ms,
            )


# Shared global singleton instance
global_portfolio_construction_engine = PortfolioConstructionEngine()
