"""
stress_testing_rules.py — Pure Stress Testing Mathematical Rules & Algorithms

Contains pure mathematical algorithms for price shock, volatility shock, correlation shock,
interest rate shock, historical replay, stressed PnL, stressed VaR, Expected Shortfall,
scenario ranking, and stress report generation.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import math
from typing import Any, Dict, List, Tuple

logger = logging.getLogger("stress_testing_rules")


def apply_price_shock(portfolio_value: float, price_shock_pct: float) -> float:
    """Calculate stressed portfolio value under a direct asset price shock."""
    if portfolio_value <= 0:
        return 0.0
    return round(portfolio_value * (1.0 + (price_shock_pct / 100.0)), 2)


def apply_volatility_shock(base_vol_pct: float, vol_boost_pct: float) -> float:
    """Calculate stressed volatility after applying a percentage volatility boost."""
    return round(base_vol_pct * (1.0 + (vol_boost_pct / 100.0)), 4)


def apply_correlation_shock(base_corr: float, corr_shock_pct: float) -> float:
    """Calculate stressed correlation shifting towards 1.0 during market breakdown."""
    stressed = base_corr + ((1.0 - base_corr) * (corr_shock_pct / 100.0))
    return round(max(-1.0, min(1.0, stressed)), 4)


def apply_interest_rate_shock(
    portfolio_value: float,
    rate_shock_bps: float,
    duration_years: float = 2.5,
) -> float:
    """Calculate interest rate shock impact using duration approximation (ΔV ≈ -D × Δy × V)."""
    rate_change_decimal = rate_shock_bps / 10000.0
    delta_value = -1.0 * duration_years * rate_change_decimal * portfolio_value
    return round(delta_value, 2)


def historical_replay(
    portfolio_value: float,
    market_drawdown_pct: float,
    portfolio_beta: float = 1.05,
) -> float:
    """Replay historical crisis drawdown scaled by portfolio market beta."""
    stressed_drawdown = market_drawdown_pct * portfolio_beta
    pnl = portfolio_value * (stressed_drawdown / 100.0)
    return round(pnl, 2)


def calculate_stressed_pnl(
    portfolio_value: float,
    price_shock_pct: float,
    vol_boost_pct: float = 0.0,
    rate_shock_bps: float = 0.0,
) -> float:
    """Calculate composite stressed PnL across price, volatility, and interest rate shocks."""
    price_loss = portfolio_value * (price_shock_pct / 100.0)
    # Volatility expansion drag (option gamma / hedging cost proxy ~ 0.05 * vol_boost)
    vol_loss = -1.0 * portfolio_value * (vol_boost_pct / 100.0) * 0.05
    rate_loss = apply_interest_rate_shock(portfolio_value, rate_shock_bps)

    total_pnl = price_loss + vol_loss + rate_loss
    return round(total_pnl, 2)


def calculate_stressed_var(
    portfolio_value: float,
    base_vol_pct: float = 15.0,
    vol_boost_pct: float = 50.0,
    confidence_level: float = 0.95,
) -> float:
    """Calculate stressed Parametric Value-at-Risk (95% or 99%)."""
    z_score = 1.645 if confidence_level == 0.95 else 2.326
    stressed_vol = apply_volatility_shock(base_vol_pct, vol_boost_pct) / 100.0
    daily_vol = stressed_vol / math.sqrt(252)

    var_pct = z_score * daily_vol * 100.0
    return round(var_pct, 2)


def calculate_expected_shortfall(
    stressed_var_pct: float,
    multiplier: float = 1.35,
) -> float:
    """Calculate Expected Shortfall (CVaR) beyond the VaR threshold."""
    return round(stressed_var_pct * multiplier, 2)


def rank_scenarios(results: List[Any]) -> List[Any]:
    """Rank scenario results by portfolio loss severity (most severe first)."""
    return sorted(results, key=lambda x: getattr(x, "portfolio_loss_pct", 0.0))


def generate_stress_report(
    portfolio_id: str,
    results: List[Any],
    portfolio_value: float = 100000.0,
) -> Dict[str, Any]:
    """Generate structured summary dictionary for stress test results."""
    ranked = rank_scenarios(results)
    worst = ranked[0] if ranked else None

    worst_name = getattr(worst, "scenario_name", "N/A") if worst else "N/A"
    worst_pnl = getattr(worst, "worst_case_pnl", 0.0) if worst else 0.0
    worst_loss_pct = getattr(worst, "portfolio_loss_pct", 0.0) if worst else 0.0

    avg_var = sum(getattr(r, "stressed_var_95", 0.0) for r in results) / len(results) if results else 0.0
    avg_es = sum(getattr(r, "stressed_expected_shortfall_95", 0.0) for r in results) / len(results) if results else 0.0

    recs = []
    if abs(worst_loss_pct) > 20.0:
        recs.append(f"CRITICAL: Tail risk breach under scenario '{worst_name}' ({worst_loss_pct:.1f}% loss). Implement downside options collar.")
    if avg_var > 5.0:
        recs.append("HIGH RISK: Stressed 95% VaR exceeds 5.0% threshold. Reduce gross leverage by 15-20%.")
    if not recs:
        recs.append("ACCEPTABLE: Portfolio stress resilience within enterprise risk limits.")

    return {
        "portfolio_id": portfolio_id,
        "worst_scenario_name": worst_name,
        "worst_pnl": round(worst_pnl, 2),
        "worst_loss_pct": round(worst_loss_pct, 2),
        "aggregate_stressed_var": round(avg_var, 2),
        "aggregate_expected_shortfall": round(avg_es, 2),
        "recommendations": recs,
    }
