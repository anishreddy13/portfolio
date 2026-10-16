"""
portfolio_rules.py — Pure Portfolio Calculation Rules

Contains pure mathematical formulas for calculating position values, open/closed P&L,
total equity, cash balance updates, asset allocations, exposures, and portfolio risk scores.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Tuple

from portfolio_models import PortfolioAllocation, Position

logger = logging.getLogger("portfolio_rules")


def calculate_position_value(quantity: float, current_price: float) -> float:
    """Calculate current market value for a position."""
    if quantity <= 0 or current_price <= 0:
        return 0.0
    return quantity * current_price


def calculate_unrealized_pnl(
    quantity: float,
    avg_cost_price: float,
    current_price: float,
) -> Tuple[float, float]:
    """Calculate open unrealized profit/loss amount and percentage.

    Returns:
        (pnl_amount, pnl_percentage)
    """
    if quantity <= 0 or avg_cost_price <= 0:
        return (0.0, 0.0)

    cost_basis = quantity * avg_cost_price
    market_val = quantity * current_price
    pnl_amount = market_val - cost_basis
    pnl_percentage = (pnl_amount / cost_basis) * 100.0 if cost_basis > 0 else 0.0

    return (pnl_amount, pnl_percentage)


def calculate_realized_pnl(
    quantity: float,
    entry_price: float,
    exit_price: float,
) -> float:
    """Calculate closed realized profit/loss amount for sold shares."""
    if quantity <= 0:
        return 0.0
    return quantity * (exit_price - entry_price)


def calculate_total_equity(cash: float, positions: List[Position]) -> float:
    """Calculate total net portfolio equity (Cash + Total Positions Market Value)."""
    positions_val = sum(p.market_value for p in positions)
    return cash + positions_val


def calculate_cash_balance(current_cash: float, trade_cost: float, is_buy: bool) -> float:
    """Calculate updated cash balance following a buy or sell execution."""
    if is_buy:
        return max(0.0, current_cash - trade_cost)
    else:
        return current_cash + trade_cost


def calculate_daily_change(positions: List[Position]) -> Tuple[float, float]:
    """Calculate aggregate dollar daily change and percentage daily change across positions.

    Returns:
        (daily_change_dollars, daily_change_pct)
    """
    if not positions:
        return (0.0, 0.0)

    total_change = sum(p.unrealized_pnl for p in positions)
    total_cost = sum(p.quantity * p.avg_cost_price for p in positions)
    pct_change = (total_change / total_cost * 100.0) if total_cost > 0 else 0.0

    return (total_change, pct_change)


def calculate_portfolio_allocation(
    positions: List[Position],
    total_equity: float,
) -> List[PortfolioAllocation]:
    """Calculate percentage weight allocation per position relative to total equity."""
    allocations: List[PortfolioAllocation] = []
    if total_equity <= 0:
        return allocations

    for p in positions:
        pct = (p.market_value / total_equity) * 100.0 if total_equity > 0 else 0.0
        p.allocation_pct = pct
        allocations.append(
            PortfolioAllocation(
                symbol=p.symbol,
                market_value=p.market_value,
                percentage=pct,
            )
        )

    # Sort descending by allocation weight
    allocations.sort(key=lambda a: a.percentage, reverse=True)
    return allocations


def calculate_exposure(positions: List[Position], total_equity: float) -> float:
    """Calculate overall market exposure percentage (Market Value / Total Equity)."""
    if total_equity <= 0:
        return 0.0
    total_market_val = sum(p.market_value for p in positions)
    return (total_market_val / total_equity) * 100.0


def calculate_risk_score(positions: List[Position], total_equity: float) -> float:
    """Compute heuristic portfolio risk score (0.0 to 100.0) based on concentration & volatility exposure."""
    if not positions or total_equity <= 0:
        return 5.0

    exposure_pct = calculate_exposure(positions, total_equity)
    max_alloc_pct = max((p.market_value / total_equity * 100.0 for p in positions), default=0.0)

    # Risk score combines market exposure and single-stock concentration penalty
    base_risk = (exposure_pct / 100.0) * 40.0
    concentration_risk = (max_alloc_pct / 100.0) * 50.0

    total_risk = base_risk + concentration_risk
    return max(1.0, min(99.0, total_risk))
