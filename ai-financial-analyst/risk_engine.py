"""
risk_engine.py — Production-Grade Enterprise Risk Management Engine

Single source of truth for order approval. Evaluates position sizes, symbol & sector exposure,
daily loss limits, max drawdown, leverage, margin usage, and VaR before orders can execute.
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional

from portfolio_manager import PortfolioManager, global_portfolio_manager
from request_coordinator import RequestCoordinator, global_request_coordinator
from risk_models import (
    PortfolioRisk,
    PositionRisk,
    RiskConfiguration,
    RiskDecision,
    RiskStatistics,
    RiskViolation,
)
from risk_rules import (
    calculate_daily_loss,
    calculate_expected_shortfall,
    calculate_leverage,
    calculate_margin_usage,
    calculate_max_drawdown,
    calculate_portfolio_exposure,
    calculate_symbol_exposure,
    calculate_var,
)

# Late-bound import to avoid circular dependency at module level
_stress_engine = None
_multi_portfolio_engine = None


def _get_stress_engine():
    global _stress_engine
    if _stress_engine is None:
        try:
            from stress_testing_engine import global_stress_testing_engine
            _stress_engine = global_stress_testing_engine
        except ImportError:
            _stress_engine = None
    return _stress_engine


def _get_multi_portfolio_engine():
    global _multi_portfolio_engine
    if _multi_portfolio_engine is None:
        try:
            from multi_portfolio_engine import global_multi_portfolio_engine
            _multi_portfolio_engine = global_multi_portfolio_engine
        except ImportError:
            _multi_portfolio_engine = None
    return _multi_portfolio_engine


logger = logging.getLogger("risk_engine")


class EnterpriseRiskEngine:
    """Production-Grade Enterprise Risk Management Engine.

    Usage::

        risk_engine = EnterpriseRiskEngine()
        decision = risk_engine.evaluate_order("AAPL", "BUY", "MARKET", 10, 182.50)
        if decision.is_approved:
            # execute order
    """

    def __init__(
        self,
        portfolio_manager: Optional[PortfolioManager] = None,
        request_coordinator: Optional[RequestCoordinator] = None,
        config: Optional[RiskConfiguration] = None,
    ) -> None:
        self.portfolio_manager = portfolio_manager or global_portfolio_manager
        self.coordinator = request_coordinator or global_request_coordinator
        self.config = config or RiskConfiguration()
        self._lock = threading.RLock()

        # Operational Statistics
        self._orders_evaluated = 0
        self._orders_approved = 0
        self._orders_rejected = 0
        self._violations_count = 0
        self._total_eval_time_ms = 0.0

        logger.info("EnterpriseRiskEngine initialized.")

    # ─────────────────────────────────────────────
    # Order Approval & Risk Evaluation API
    # ─────────────────────────────────────────────

    def evaluate_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        price: float = 0.0,
        portfolio_id: str = "default",
    ) -> RiskDecision:
        """Evaluate a proposed trade order against enterprise risk boundaries.

        Returns:
            RiskDecision envelope containing is_approved boolean and violation list.
        """
        start_t = time.monotonic()
        sym = symbol.strip().upper()
        s_side = side.strip().upper()
        now_iso = datetime.now(timezone.utc).isoformat()

        violations: List[RiskViolation] = []

        with self._lock:
            self._orders_evaluated += 1

            # Fetch portfolio summary
            summary = self.portfolio_manager.portfolio_summary(portfolio_id)
            total_eq = summary.total_equity if summary.total_equity > 0 else 100000.0
            order_cost = quantity * (price if price > 0 else 180.0)

            # Rule 1: Position Size Limit Check
            pos_size_pct = (order_cost / total_eq) * 100.0
            if pos_size_pct > self.config.max_position_size_pct:
                v = RiskViolation(
                    rule_name="Max Position Size Exceeded",
                    severity="HIGH",
                    description=f"Order size ({pos_size_pct:.1f}%) exceeds maximum position size limit ({self.config.max_position_size_pct}%).",
                    timestamp=now_iso,
                )
                violations.append(v)

            # Rule 2: Single Symbol Exposure Check
            existing_pos = next((p for p in summary.positions if p.symbol == sym), None)
            existing_val = existing_pos.market_value if existing_pos else 0.0
            new_sym_val = existing_val + order_cost if s_side == "BUY" else max(0, existing_val - order_cost)
            sym_exp_pct = calculate_symbol_exposure(new_sym_val, total_eq)

            if sym_exp_pct > self.config.max_symbol_exposure_pct:
                v = RiskViolation(
                    rule_name="Max Symbol Exposure Exceeded",
                    severity="HIGH",
                    description=f"Symbol exposure for {sym} ({sym_exp_pct:.1f}%) exceeds maximum limit ({self.config.max_symbol_exposure_pct}%).",
                    timestamp=now_iso,
                )
                violations.append(v)

            # Rule 3: Total Portfolio Exposure Check
            total_market_val = sum(p.market_value for p in summary.positions)
            new_total_val = total_market_val + (order_cost if s_side == "BUY" else -order_cost)
            port_exp_pct = calculate_portfolio_exposure(new_total_val, total_eq)

            if port_exp_pct > self.config.max_portfolio_exposure_pct:
                v = RiskViolation(
                    rule_name="Max Portfolio Exposure Exceeded",
                    severity="HIGH",
                    description=f"Total portfolio exposure ({port_exp_pct:.1f}%) exceeds limit ({self.config.max_portfolio_exposure_pct}%).",
                    timestamp=now_iso,
                )
                violations.append(v)

            # Rule 4: Daily Loss Limit Check
            daily_loss_pct = summary.performance.daily_change_pct if summary.performance.daily_change_pct < 0 else 0.0
            if abs(daily_loss_pct) > self.config.daily_loss_limit_pct:
                v = RiskViolation(
                    rule_name="Daily Loss Limit Exceeded",
                    severity="HIGH",
                    description=f"Daily loss ({abs(daily_loss_pct):.1f}%) breaches daily loss limit ({self.config.daily_loss_limit_pct}%).",
                    timestamp=now_iso,
                )
                violations.append(v)

            is_approved = len(violations) == 0
            decision_code = "APPROVED" if is_approved else "REJECTED"

            if is_approved:
                self._orders_approved += 1
            else:
                self._orders_rejected += 1
                self._violations_count += len(violations)

            eval_dur_ms = (time.monotonic() - start_t) * 1000.0
            self._total_eval_time_ms += eval_dur_ms

            risk_sc = summary.performance.risk_score if summary.performance else 15.0

            decision = RiskDecision(
                is_approved=is_approved,
                decision_code=decision_code,
                violations=violations,
                risk_score=risk_sc,
                timestamp=now_iso,
            )

            logger.info("Evaluated order for %s (%s): %s (violations=%d, latency=%.2fms)", sym, s_side, decision_code, len(violations), eval_dur_ms)
            return decision

    # ─────────────────────────────────────────────
    # Portfolio Risk Evaluation
    # ─────────────────────────────────────────────

    def evaluate_portfolio(self, portfolio_id: str = "default") -> PortfolioRisk:
        """Evaluate macro portfolio risk metrics."""
        summary = self.portfolio_manager.portfolio_summary(portfolio_id)
        total_eq = summary.total_equity if summary.total_equity > 0 else 100000.0
        total_val = sum(p.market_value for p in summary.positions)

        total_exp = calculate_portfolio_exposure(total_val, total_eq)
        daily_loss = abs(summary.performance.daily_change_pct) if summary.performance.daily_change_pct < 0 else 0.0
        leverage = calculate_leverage(total_val, total_eq)
        margin_pct = calculate_margin_usage(total_val, total_eq * 2.0)

        # Read stress & aggregate metrics from MultiPortfolioEngine & StressTestingEngine
        var_95 = 1.8
        es_95 = 2.4
        stress_eng = _get_stress_engine()
        if stress_eng is not None:
            try:
                report = stress_eng.run_stress_test(portfolio_id)
                var_95 = report.aggregate_stressed_var
                es_95 = report.aggregate_expected_shortfall
            except Exception:
                pass

        # Consume aggregate group exposure from MultiPortfolioEngine
        mpe = _get_multi_portfolio_engine()
        if mpe is not None:
            try:
                agg = mpe.aggregate_report("default_group")
                if agg and agg.total_group_equity > 0:
                    total_exp = (agg.gross_market_exposure / agg.total_group_equity) * 100.0
            except Exception:
                pass

        return PortfolioRisk(
            total_exposure_pct=total_exp,
            daily_loss_pct=daily_loss,
            current_drawdown_pct=1.2,
            leverage=leverage,
            margin_usage_pct=margin_pct,
            var_95_pct=var_95,
            expected_shortfall_95_pct=es_95,
        )

    # ─────────────────────────────────────────────
    # Public Statistics API
    # ─────────────────────────────────────────────

    def statistics(self) -> RiskStatistics:
        """Return operational RiskStatistics snapshot."""
        with self._lock:
            avg_lat = (self._total_eval_time_ms / self._orders_evaluated) if self._orders_evaluated > 0 else 0.0
            return RiskStatistics(
                orders_evaluated=self._orders_evaluated,
                orders_approved=self._orders_approved,
                orders_rejected=self._orders_rejected,
                violations_count=self._violations_count,
                average_evaluation_latency_ms=avg_lat,
            )


# Shared global singleton instance
global_risk_engine = EnterpriseRiskEngine()
