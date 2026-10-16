"""
tca_rules.py — Pure Transaction Cost Analysis (TCA) Mathematical Rules & Formulas

Contains pure mathematical algorithms for calculating Slippage (bps), VWAP, TWAP,
Arrival Price, Market Impact, Implementation Shortfall, Broker/Venue Scores, and Execution Quality.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
from typing import List, Tuple

logger = logging.getLogger("tca_rules")


def calculate_slippage(fill_price: float, benchmark_price: float, side: str) -> float:
    """Calculate execution slippage in basis points (bps)."""
    if benchmark_price <= 0:
        return 0.0

    diff = (fill_price - benchmark_price) if side.upper() == "BUY" else (benchmark_price - fill_price)
    slippage_bps = (diff / benchmark_price) * 10000.0
    return round(slippage_bps, 2)


def calculate_vwap(prices: List[float], volumes: List[float]) -> float:
    """Calculate Volume-Weighted Average Price (VWAP)."""
    if not prices or not volumes or len(prices) != len(volumes):
        return prices[0] if prices else 180.0

    total_vol = sum(volumes)
    if total_vol <= 0:
        return sum(prices) / len(prices)

    vwap = sum(p * v for p, v in zip(prices, volumes)) / total_vol
    return round(vwap, 2)


def calculate_twap(prices: List[float]) -> float:
    """Calculate Time-Weighted Average Price (TWAP)."""
    if not prices:
        return 180.0
    return round(sum(prices) / len(prices), 2)


def calculate_arrival_price(order_arrival_price: float) -> float:
    """Standardize benchmark arrival price."""
    return round(max(0.01, order_arrival_price), 2)


def calculate_market_impact(
    arrival_price: float,
    fill_price: float,
    post_trade_price: float,
    side: str,
) -> Tuple[float, float, float]:
    """Calculate Total Market Impact, Permanent Impact, and Temporary Impact in bps.

    Returns:
        (total_impact_bps, permanent_impact_bps, temporary_impact_bps)
    """
    if arrival_price <= 0:
        return (0.0, 0.0, 0.0)

    # Total Impact = (Fill Price - Arrival Price) / Arrival Price
    total_diff = (fill_price - arrival_price) if side.upper() == "BUY" else (arrival_price - fill_price)
    total_impact = (total_diff / arrival_price) * 10000.0

    # Permanent Impact = (Post-Trade Price - Arrival Price) / Arrival Price
    perm_diff = (post_trade_price - arrival_price) if side.upper() == "BUY" else (arrival_price - post_trade_price)
    perm_impact = (perm_diff / arrival_price) * 10000.0

    temp_impact = max(0.0, total_impact - perm_impact)
    return (round(total_impact, 2), round(perm_impact, 2), round(temp_impact, 2))


def calculate_implementation_shortfall(
    decision_price: float,
    fill_price: float,
    quantity: float,
    side: str,
) -> float:
    """Calculate Perold Implementation Shortfall in basis points (bps)."""
    if decision_price <= 0 or quantity <= 0:
        return 0.0

    diff = (fill_price - decision_price) if side.upper() == "BUY" else (decision_price - fill_price)
    shortfall_bps = (diff / decision_price) * 10000.0
    return round(shortfall_bps, 2)


def execution_quality(slippage_bps: float, market_impact_bps: float) -> Tuple[float, str]:
    """Calculate composite execution quality score (0.0 to 100.0) and rating string."""
    penalty = abs(slippage_bps) + abs(market_impact_bps)
    quality_score = max(0.0, min(100.0, 100.0 - penalty))

    if quality_score >= 85.0:
        rating = "EXCELLENT"
    elif quality_score >= 70.0:
        rating = "GOOD"
    elif quality_score >= 50.0:
        rating = "FAIR"
    else:
        rating = "POOR"

    return (round(quality_score, 1), rating)


def broker_score(avg_slippage_bps: float, fill_rate_pct: float) -> float:
    """Calculate composite broker performance score (0.0 to 100.0)."""
    slip_score = max(0.0, 100.0 - (abs(avg_slippage_bps) * 2.0))
    score = (slip_score * 0.4) + (fill_rate_pct * 0.6)
    return round(min(100.0, max(0.0, score)), 1)


def venue_score(avg_latency_ms: float, price_improvement_bps: float) -> float:
    """Calculate composite execution venue score (0.0 to 100.0)."""
    lat_score = max(0.0, 100.0 - (avg_latency_ms * 2.0))
    pi_score = min(50.0, price_improvement_bps * 5.0)
    score = (lat_score * 0.6) + (pi_score * 0.4) + 20.0
    return round(min(100.0, max(0.0, score)), 1)


def execution_cost(quantity: float, fill_price: float, arrival_price: float, side: str) -> float:
    """Calculate absolute dollar execution cost ($)."""
    diff = (fill_price - arrival_price) if side.upper() == "BUY" else (arrival_price - fill_price)
    cost = quantity * diff
    return round(cost, 2)
