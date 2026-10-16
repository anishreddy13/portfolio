"""
risk_rules.py — Pure Enterprise Risk Rules & Mathematical Formulas

Contains pure mathematical algorithms for calculating exposure, position limits, leverage,
margin usage, Value at Risk (VaR), Expected Shortfall (CVaR), and evaluating risk decisions.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import math
import statistics
from typing import Dict, List, Tuple

from risk_models import RiskDecision

logger = logging.getLogger("risk_rules")


def calculate_position_size(equity: float, price: float, risk_pct: float) -> float:
    """Calculate maximum allowed position share quantity given equity & risk %."""
    if equity <= 0 or price <= 0 or risk_pct <= 0:
        return 0.0
    max_alloc_dollars = equity * (risk_pct / 100.0)
    return round(max_alloc_dollars / price, 2)


def calculate_portfolio_exposure(positions_value: float, equity: float) -> float:
    """Calculate total portfolio market exposure percentage."""
    if equity <= 0:
        return 0.0
    return (positions_value / equity) * 100.0


def calculate_sector_exposure(sector_value: float, equity: float) -> float:
    """Calculate sector concentration exposure percentage."""
    if equity <= 0:
        return 0.0
    return (sector_value / equity) * 100.0


def calculate_symbol_exposure(symbol_value: float, equity: float) -> float:
    """Calculate single symbol concentration exposure percentage."""
    if equity <= 0:
        return 0.0
    return (symbol_value / equity) * 100.0


def calculate_max_drawdown(equity_history: List[float]) -> float:
    """Calculate maximum drawdown percentage across an equity curve."""
    if not equity_history:
        return 0.0

    peak = equity_history[0]
    max_dd = 0.0

    for eq in equity_history:
        if eq > peak:
            peak = eq
        dd = ((peak - eq) / peak * 100.0) if peak > 0 else 0.0
        if dd > max_dd:
            max_dd = dd

    return max_dd


def calculate_daily_loss(starting_equity: float, current_equity: float) -> float:
    """Calculate daily loss percentage."""
    if starting_equity <= 0:
        return 0.0
    loss = (starting_equity - current_equity) / starting_equity * 100.0
    return max(0.0, loss)


def calculate_leverage(total_exposure: float, equity: float) -> float:
    """Calculate current portfolio leverage ratio."""
    if equity <= 0:
        return 0.0
    return total_exposure / equity


def calculate_margin_usage(used_margin: float, total_margin: float) -> float:
    """Calculate margin usage percentage."""
    if total_margin <= 0:
        return 0.0
    return (used_margin / total_margin) * 100.0


def calculate_var(returns_series: List[float], confidence_level: float = 0.95) -> float:
    """Calculate Value at Risk (VaR) percentage at given confidence level."""
    if not returns_series:
        return 1.8

    sorted_returns = sorted(returns_series)
    index = int((1.0 - confidence_level) * len(sorted_returns))
    var_val = abs(sorted_returns[index]) if index < len(sorted_returns) else 1.8
    return var_val * 100.0 if var_val < 1.0 else var_val


def calculate_expected_shortfall(returns_series: List[float], confidence_level: float = 0.95) -> float:
    """Calculate Expected Shortfall (Conditional VaR) percentage."""
    if not returns_series:
        return 2.4

    sorted_returns = sorted(returns_series)
    cutoff = int((1.0 - confidence_level) * len(sorted_returns))
    tail_returns = sorted_returns[: max(1, cutoff)]
    es_val = abs(statistics.mean(tail_returns)) if tail_returns else 2.4
    return es_val * 100.0 if es_val < 1.0 else es_val


def risk_passes(decision: RiskDecision) -> bool:
    """Check if RiskDecision passed all risk evaluation boundaries."""
    return decision is not None and decision.is_approved
