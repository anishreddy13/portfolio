"""
strategy_health.py — Strategy Health Engine

Continuously measures whether a running/paper-traded strategy is behaving as expected.
Evaluates 10 health dimensions, calculates overall health score (0-100), tracks alerts,
and generates non-investment behavioral descriptions.

Public API:
  StrategyHealthEngine.evaluate()
  StrategyHealthEngine.latest_snapshot()
  StrategyHealthEngine.health_history()
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from strategy_health_models import HealthAlert, HealthSnapshot, StrategyHealth
from strategy_health_rules import (
    calculate_overall_health,
    derive_health_trend,
    determine_health_state,
    eval_capital_preservation,
    eval_drawdown_health,
    eval_execution_quality,
    eval_market_regime_compatibility,
    eval_position_sizing_discipline,
    eval_profit_consistency,
    eval_risk_exposure,
    eval_trade_frequency,
    eval_volatility_adaptation,
    eval_win_rate_stability,
    generate_behavioral_recommendations,
)

logger = logging.getLogger("strategy_health")


class StrategyHealthEngine:
    """Engine for continuously measuring and tracking strategy behavioral health.

    Usage::

        engine = StrategyHealthEngine()
        health = engine.evaluate(portfolio, trades, metrics, market_context)
        print(health.current_score, health.current_state)
        print(health.recommendations)
    """

    def __init__(self, strategy_id: str = "STRATEGY_01") -> None:
        self.strategy_id = strategy_id
        self.snapshots_history: List[HealthSnapshot] = []
        self.current_health: Optional[StrategyHealth] = None

        logger.info("StrategyHealthEngine initialized for strategy_id=%s", strategy_id)

    # ── Main Evaluation Entrypoint ──────────────────────────────

    def evaluate(
        self,
        portfolio: Optional[Any] = None,
        trades: Optional[List[Any]] = None,
        metrics: Optional[Any] = None,
        market_context: Optional[Any] = None,
        expectations: Optional[Dict[str, Any]] = None,
    ) -> StrategyHealth:
        """Evaluate strategy health across all 10 health dimensions.

        Args:
            portfolio: Optional PaperPortfolio or dict.
            trades: Optional list of Trade objects.
            metrics: Optional PerformanceMetrics object.
            market_context: Optional MarketContext object.
            expectations: Optional benchmark expectations dictionary.

        Returns:
            StrategyHealth object containing current score, state, alerts, and history.
        """
        exp = expectations or {}
        trades_list = trades or []

        # Extract metrics data
        win_rate = getattr(metrics, "win_rate", 50.0) if metrics else 50.0
        drawdown = getattr(metrics, "max_drawdown_percent", 0.0) if metrics else (
            getattr(portfolio, "daily_pnl", 0.0) if portfolio else 0.0
        )

        profit_factor = getattr(metrics, "profit_factor", 1.5) if metrics else 1.5
        trade_count = len(trades_list)

        # Extract market context values
        volatility = getattr(market_context, "volatility", "Medium") if market_context else "Medium"
        regime = getattr(market_context, "regime", "Trending") if market_context else "Trending"

        # Calculate consecutive losses
        consecutive_losses = 0
        for t in reversed(trades_list):
            pnl = getattr(t, "pnl", 0.0)
            if pnl <= 0:
                consecutive_losses += 1
            else:
                break

        # ── Score 10 Health Dimensions ──
        dim_scores: Dict[str, int] = {}
        alerts: List[HealthAlert] = []

        # 1. Win Rate Stability
        s1, a1 = eval_win_rate_stability(win_rate, exp.get("expected_win_rate", 50.0))
        dim_scores["win_rate_stability"] = s1
        if a1: alerts.append(a1)

        # 2. Drawdown Health
        s2, a2 = eval_drawdown_health(abs(drawdown), exp.get("max_allowed_drawdown", 15.0))
        dim_scores["drawdown_health"] = s2
        if a2: alerts.append(a2)

        # 3. Profit Consistency
        s3, a3 = eval_profit_consistency(profit_factor, exp.get("expected_profit_factor", 1.5))
        dim_scores["profit_consistency"] = s3
        if a3: alerts.append(a3)

        # 4. Trade Frequency
        s4, a4 = eval_trade_frequency(trade_count, exp.get("trade_frequency_range", (1, 50)))
        dim_scores["trade_frequency"] = s4
        if a4: alerts.append(a4)

        # 5. Risk Exposure
        s5, a5 = eval_risk_exposure(exp.get("current_risk_pct", 2.0), exp.get("max_risk_pct", 5.0))
        dim_scores["risk_exposure"] = s5
        if a5: alerts.append(a5)

        # 6. Execution Quality
        s6, a6 = eval_execution_quality(exp.get("avg_slippage_pct", 0.05))
        dim_scores["execution_quality"] = s6
        if a6: alerts.append(a6)

        # 7. Volatility Adaptation
        s7, a7 = eval_volatility_adaptation(volatility)
        dim_scores["volatility_adaptation"] = s7
        if a7: alerts.append(a7)

        # 8. Market Regime Compatibility
        s8, a8 = eval_market_regime_compatibility(regime)
        dim_scores["market_regime_compatibility"] = s8
        if a8: alerts.append(a8)

        # 9. Position Sizing Discipline
        s9, a9 = eval_position_sizing_discipline(exp.get("position_variance_pct", 0.0))
        dim_scores["position_sizing_discipline"] = s9
        if a9: alerts.append(a9)

        # 10. Capital Preservation
        s10, a10 = eval_capital_preservation(consecutive_losses)
        dim_scores["capital_preservation"] = s10
        if a10: alerts.append(a10)

        # Calculate master score & state
        overall_score = calculate_overall_health(dim_scores)
        state = determine_health_state(overall_score)

        # History tracking for trend calculation
        history_scores = [snap.score for snap in self.snapshots_history] + [overall_score]
        trend = derive_health_trend(history_scores)

        # Generate behavioral observations (NO investment advice)
        recommendations = generate_behavioral_recommendations(dim_scores, alerts, history_scores)

        # Create Snapshot
        snapshot = HealthSnapshot(
            score=overall_score,
            state=state,
            dimension_scores=dim_scores,
            alerts=alerts,
            recommendations=recommendations,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

        self.snapshots_history.append(snapshot)

        self.current_health = StrategyHealth(
            strategy_id=self.strategy_id,
            current_score=overall_score,
            current_state=state,
            latest_snapshot=snapshot,
            alerts=alerts,
            trend=trend,
            recommendations=recommendations,
            history=list(self.snapshots_history),
        )

        logger.info(
            "StrategyHealth evaluation complete. Score: %d (%s), Alerts: %d",
            overall_score, state, len(alerts)
        )

        return self.current_health

    # ── Inspection API ─────────────────────────────────────────

    def latest_snapshot(self) -> Optional[HealthSnapshot]:
        """Return the most recent HealthSnapshot."""
        if not self.snapshots_history:
            return None
        return self.snapshots_history[-1]

    def health_history(self) -> List[HealthSnapshot]:
        """Return historical list of HealthSnapshot objects."""
        return list(self.snapshots_history)
