"""
drift_detector.py — Strategy Drift Detection Engine

Compares historical backtest baseline metrics against live/paper trading statistics
to detect statistically significant behavioral, performance, execution, and risk drift.

Never recommends trades or strategy modifications. Only describes observed deviations.

Public API:
  DriftDetectionEngine.evaluate()
  DriftDetectionEngine.latest()
  DriftDetectionEngine.history()
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from drift_models import DriftAlert, DriftMetric, DriftSnapshot, StrategyDrift
from drift_rules import (
    determine_overall_drift_state,
    evaluate_metric_drift,
    generate_drift_alerts,
    generate_drift_observations,
)

logger = logging.getLogger("drift_detector")


class DriftDetectionEngine:
    """Engine for detecting statistical and behavioral strategy drift.

    Usage::

        engine = DriftDetectionEngine()
        drift = engine.evaluate(backtest_result, paper_portfolio, strategy_health, market_context)
        print(drift.current_state, drift.overall_confidence)
        print(drift.observations)
    """

    def __init__(self, strategy_id: str = "STRATEGY_01") -> None:
        self.strategy_id = strategy_id
        self.snapshots_history: List[DriftSnapshot] = []
        self.current_drift: Optional[StrategyDrift] = None

        logger.info("DriftDetectionEngine initialized for strategy_id=%s", strategy_id)

    # ── Main Evaluation Entrypoint ──────────────────────────────

    def evaluate(
        self,
        backtest_result: Optional[Any] = None,
        live_stats: Optional[Dict[str, Any]] = None,
        strategy_health: Optional[Any] = None,
        market_context: Optional[Any] = None,
    ) -> StrategyDrift:
        """Compare historical backtest baseline with live/paper trading statistics.

        Args:
            backtest_result: Optional BacktestResult or baseline dict.
            live_stats: Optional paper/live stats dictionary or PaperPortfolio.
            strategy_health: Optional StrategyHealth object.
            market_context: Optional MarketContext object.

        Returns:
            StrategyDrift object containing metrics, alerts, confidence score, and observations.
        """
        logger.info("Evaluating strategy drift for %s", self.strategy_id)

        # Extract baseline metrics from backtest_result
        base_metrics = getattr(backtest_result, "metrics", None) if backtest_result else None
        base_dict = base_metrics.to_dict() if base_metrics and hasattr(base_metrics, "to_dict") else (
            backtest_result.get("metrics", {}) if isinstance(backtest_result, dict) else {}
        )

        b_win_rate = float(base_dict.get("win_rate", 55.0))
        b_profit_factor = float(base_dict.get("profit_factor", 1.5))
        b_drawdown = float(base_dict.get("max_drawdown_percent", 10.0))
        b_trade_freq = float(base_dict.get("total_trades", 20.0))
        b_duration = float(base_dict.get("avg_duration_bars", 5.0))
        b_avg_win = float(base_dict.get("average_win", 250.0))
        b_avg_loss = float(base_dict.get("average_loss", 150.0))
        b_expectancy = float(base_dict.get("expectancy", 45.0))
        b_risk = float(base_dict.get("risk_exposure_pct", 2.0))
        b_regime_perf = float(base_dict.get("regime_score", 80.0))

        # Extract current live/paper metrics
        curr_dict = live_stats.to_dict() if live_stats and hasattr(live_stats, "to_dict") else (
            live_stats if isinstance(live_stats, dict) else {}
        )

        c_win_rate = float(curr_dict.get("win_rate", curr_dict.get("session_return_percent", b_win_rate)))
        c_profit_factor = float(curr_dict.get("profit_factor", b_profit_factor))
        c_drawdown = abs(float(curr_dict.get("daily_pnl", curr_dict.get("max_drawdown_percent", b_drawdown))))
        c_trade_freq = float(curr_dict.get("trade_count", len(curr_dict.get("open_positions", []))))
        c_duration = float(curr_dict.get("avg_duration_bars", b_duration))
        c_avg_win = float(curr_dict.get("average_win", b_avg_win))
        c_avg_loss = float(curr_dict.get("average_loss", b_avg_loss))
        c_expectancy = float(curr_dict.get("expectancy", b_expectancy))
        c_risk = float(curr_dict.get("current_risk_pct", b_risk))
        c_regime_perf = float(getattr(strategy_health, "current_score", b_regime_perf))

        sample_size = int(c_trade_freq) if c_trade_freq > 0 else 10

        # Evaluate 10 Drift Metrics
        metrics: List[DriftMetric] = [
            evaluate_metric_drift("Win Rate", b_win_rate, c_win_rate, sample_size, higher_is_better=True),
            evaluate_metric_drift("Profit Factor", b_profit_factor, c_profit_factor, sample_size, higher_is_better=True),
            evaluate_metric_drift("Drawdown", b_drawdown, c_drawdown, sample_size, higher_is_better=False),
            evaluate_metric_drift("Trade Frequency", b_trade_freq, c_trade_freq, sample_size, higher_is_better=True, threshold_minor=30.0),
            evaluate_metric_drift("Average Trade Duration", b_duration, c_duration, sample_size, higher_is_better=True, threshold_minor=30.0),
            evaluate_metric_drift("Average Win", b_avg_win, c_avg_win, sample_size, higher_is_better=True),
            evaluate_metric_drift("Average Loss", b_avg_loss, c_avg_loss, sample_size, higher_is_better=False),
            evaluate_metric_drift("Expectancy", b_expectancy, c_expectancy, sample_size, higher_is_better=True),
            evaluate_metric_drift("Risk Exposure", b_risk, c_risk, sample_size, higher_is_better=False),
            evaluate_metric_drift("Market Regime Performance", b_regime_perf, c_regime_perf, sample_size, higher_is_better=True),
        ]

        # Resolve overall state, confidence, alerts, and descriptive observations
        drift_state, overall_confidence = determine_overall_drift_state(metrics)
        alerts = generate_drift_alerts(metrics)
        observations = generate_drift_observations(metrics)

        snapshot = DriftSnapshot(
            drift_state=drift_state,
            overall_confidence=overall_confidence,
            metrics=metrics,
            alerts=alerts,
            observations=observations,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

        self.snapshots_history.append(snapshot)

        self.current_drift = StrategyDrift(
            strategy_id=self.strategy_id,
            current_state=drift_state,
            overall_confidence=overall_confidence,
            latest_snapshot=snapshot,
            active_alerts=alerts,
            observations=observations,
            history=list(self.snapshots_history),
        )

        logger.info(
            "Drift evaluation complete. State: %s, Confidence: %d%%, Alerts: %d",
            drift_state, overall_confidence, len(alerts)
        )

        return self.current_drift

    # ── Inspection API ─────────────────────────────────────────

    def latest(self) -> Optional[DriftSnapshot]:
        """Return the most recent DriftSnapshot."""
        if not self.snapshots_history:
            return None
        return self.snapshots_history[-1]

    def history(self) -> List[DriftSnapshot]:
        """Return historical list of DriftSnapshot objects."""
        return list(self.snapshots_history)
