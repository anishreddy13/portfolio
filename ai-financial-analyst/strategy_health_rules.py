"""
strategy_health_rules.py — Health Evaluation Rules & Scoring Model

Contains modular rules for scoring all 10 strategy health dimensions, triggering alerts,
calculating health states, and generating non-investment behavioral descriptions.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from strategy_health_models import HealthAlert

logger = logging.getLogger("strategy_health_rules")

# ─────────────────────────────────────────────
# 10 Health Dimensions Scoring Functions (0-100)
# ─────────────────────────────────────────────

def eval_win_rate_stability(current_win_rate: float, expected_win_rate: float = 50.0) -> Tuple[int, Optional[HealthAlert]]:
    """1. Win Rate Stability."""
    diff = current_win_rate - expected_win_rate
    alert = None
    if diff >= 0:
        score = 100
    elif diff >= -10:
        score = 80
    elif diff >= -25:
        score = 55
        alert = HealthAlert(
            alert_type="WIN_RATE_DROPPING",
            severity="WARNING",
            message=f"Win rate has declined by {abs(diff):.1f}% below historical expectations (current: {current_win_rate:.1f}%).",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    else:
        score = 25
        alert = HealthAlert(
            alert_type="WIN_RATE_DROPPING",
            severity="CRITICAL",
            message=f"Significant win rate drop detected (current: {current_win_rate:.1f}%, expected: {expected_win_rate:.1f}%).",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    return score, alert


def eval_drawdown_health(current_drawdown: float, max_allowed_drawdown: float = 15.0) -> Tuple[int, Optional[HealthAlert]]:
    """2. Drawdown Health."""
    alert = None
    if current_drawdown <= max_allowed_drawdown * 0.5:
        score = 100
    elif current_drawdown <= max_allowed_drawdown:
        score = 75
        alert = HealthAlert(
            alert_type="DRAWDOWN_INCREASING",
            severity="WARNING",
            message=f"Drawdown is expanding (current: {current_drawdown:.1f}%, max threshold: {max_allowed_drawdown:.1f}%).",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    else:
        score = 20
        alert = HealthAlert(
            alert_type="DRAWDOWN_INCREASING",
            severity="CRITICAL",
            message=f"Maximum drawdown threshold exceeded! (current: {current_drawdown:.1f}%, max allowed: {max_allowed_drawdown:.1f}%).",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    return score, alert


def eval_profit_consistency(profit_factor: float, expected_pf: float = 1.5) -> Tuple[int, Optional[HealthAlert]]:
    """3. Profit Consistency."""
    alert = None
    if profit_factor >= expected_pf:
        score = 100
    elif profit_factor >= 1.0:
        score = 70
        alert = HealthAlert(
            alert_type="PROFIT_FACTOR_DECLINING",
            severity="WARNING",
            message=f"Profit factor has softened to {profit_factor:.2f} (expected: {expected_pf:.2f}).",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    else:
        score = 30
        alert = HealthAlert(
            alert_type="PROFIT_FACTOR_DECLINING",
            severity="CRITICAL",
            message=f"Profit factor is below breakeven ({profit_factor:.2f} < 1.0). Strategy is net loss making.",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    return score, alert


def eval_trade_frequency(recent_trade_count: int, expected_range: Tuple[int, int] = (1, 30)) -> Tuple[int, Optional[HealthAlert]]:
    """4. Trade Frequency."""
    min_t, max_t = expected_range
    alert = None
    if min_t <= recent_trade_count <= max_t:
        score = 100
    elif recent_trade_count > max_t:
        score = 60
        alert = HealthAlert(
            alert_type="OVER_TRADING",
            severity="WARNING",
            message=f"High trade activity observed ({recent_trade_count} trades vs max expected {max_t}). Potential over-trading.",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    else:
        score = 70
        alert = HealthAlert(
            alert_type="UNDER_TRADING",
            severity="INFO",
            message=f"Low trade execution count ({recent_trade_count} trades vs min expected {min_t}). Strategy is inactive.",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    return score, alert


def eval_risk_exposure(current_risk_pct: float, max_risk_pct: float = 5.0) -> Tuple[int, Optional[HealthAlert]]:
    """5. Risk Exposure."""
    alert = None
    if current_risk_pct <= max_risk_pct:
        score = 100
    elif current_risk_pct <= max_risk_pct * 1.5:
        score = 60
        alert = HealthAlert(
            alert_type="RISK_TOO_HIGH",
            severity="WARNING",
            message=f"Account risk exposure higher than target ({current_risk_pct:.1f}% vs max target {max_risk_pct:.1f}%).",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    else:
        score = 20
        alert = HealthAlert(
            alert_type="RISK_TOO_HIGH",
            severity="CRITICAL",
            message=f"Excessive risk exposure detected ({current_risk_pct:.1f}%). Exceeds safe limit of {max_risk_pct:.1f}%.",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    return score, alert


def eval_execution_quality(avg_slippage_pct: float = 0.05, max_slippage_pct: float = 0.2) -> Tuple[int, Optional[HealthAlert]]:
    """6. Execution Quality."""
    alert = None
    if avg_slippage_pct <= max_slippage_pct * 0.5:
        score = 100
    elif avg_slippage_pct <= max_slippage_pct:
        score = 75
    else:
        score = 40
        alert = HealthAlert(
            alert_type="EXECUTION_DEGRADING",
            severity="WARNING",
            message=f"Higher than expected execution slippage observed ({avg_slippage_pct:.2f}% vs max target {max_slippage_pct:.2f}%).",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    return score, alert


def eval_volatility_adaptation(market_volatility: str = "Medium") -> Tuple[int, Optional[HealthAlert]]:
    """7. Volatility Adaptation."""
    alert = None
    if market_volatility in ("Low", "Medium"):
        score = 100
    elif market_volatility == "High":
        score = 75
    else:
        score = 45
        alert = HealthAlert(
            alert_type="VOLATILITY_MISMATCH",
            severity="WARNING",
            message="Market is experiencing extreme volatility. Strategy parameters may experience higher variance.",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    return score, alert


def eval_market_regime_compatibility(market_regime: str = "Trending") -> Tuple[int, Optional[HealthAlert]]:
    """8. Market Regime Compatibility."""
    if market_regime in ("Trending", "Breakout"):
        score = 100
    elif market_regime in ("Ranging", "Pullback"):
        score = 80
    else:
        score = 65
    return score, None


def eval_position_sizing_discipline(position_variance_pct: float = 0.0) -> Tuple[int, Optional[HealthAlert]]:
    """9. Position Sizing Discipline."""
    if position_variance_pct <= 10.0:
        score = 100
    elif position_variance_pct <= 25.0:
        score = 75
    else:
        score = 50
    return score, None


def eval_capital_preservation(consecutive_losses: int = 0) -> Tuple[int, Optional[HealthAlert]]:
    """10. Capital Preservation."""
    alert = None
    if consecutive_losses < 3:
        score = 100
    elif consecutive_losses < 5:
        score = 70
    else:
        score = 30
        alert = HealthAlert(
            alert_type="DRAWDOWN_INCREASING",
            severity="WARNING",
            message=f"Series of {consecutive_losses} consecutive loss trades recorded.",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    return score, alert


# ─────────────────────────────────────────────
# Master Aggregator & Health State
# ─────────────────────────────────────────────

def calculate_overall_health(dimension_scores: Dict[str, int]) -> int:
    """Calculate overall weighted strategy health score (0-100)."""
    if not dimension_scores:
        return 100
    return int(sum(dimension_scores.values()) / len(dimension_scores))


def determine_health_state(score: int) -> str:
    """Determine health state based on score range."""
    if score >= 85:
        return "Excellent"
    elif score >= 70:
        return "Healthy"
    elif score >= 50:
        return "Warning"
    else:
        return "Critical"


def derive_health_trend(history: List[int]) -> str:
    """Determine health trajectory ('Improving', 'Stable', 'Deteriorating')."""
    if len(history) < 2:
        return "Stable"
    delta = history[-1] - history[0]
    if delta > 5:
        return "Improving"
    elif delta < -5:
        return "Deteriorating"
    return "Stable"


def generate_behavioral_recommendations(
    dimension_scores: Dict[str, int],
    alerts: List[HealthAlert],
    history_scores: List[int],
) -> List[str]:
    """Generate behavioral observation recommendations.

    STRICT CONSTRAINT:
    Must ONLY describe strategy behavior and operational health.
    MUST NOT include financial or investment advice.
    """
    recs: List[str] = []

    if dimension_scores.get("win_rate_stability", 100) < 70:
        recs.append("Win rate has declined relative to historical benchmarks over recent executions.")

    if dimension_scores.get("drawdown_health", 100) < 70:
        recs.append("Drawdown is expanding towards the maximum historical tolerance limit.")

    if dimension_scores.get("trade_frequency", 100) < 70:
        recs.append("Trade frequency has deviated from expected activity bounds.")

    if dimension_scores.get("volatility_adaptation", 100) < 70:
        recs.append("Current market volatility is higher than the strategy's primary design environment.")

    if dimension_scores.get("capital_preservation", 100) < 70:
        recs.append("Consecutive loss trade sequence detected in current session log.")

    if not recs:
        recs.append("Strategy behavior remains aligned with baseline operational parameters.")

    return recs
