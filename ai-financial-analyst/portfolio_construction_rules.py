"""
portfolio_construction_rules.py — Pure Portfolio Construction Mathematical Rules & Algorithms

Contains pure mathematical algorithms for Equal Weight, Risk Parity, Volatility Targeting,
Kelly Criterion position sizing, Fixed Fractional allocation, and Portfolio Optimization.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import uuid

from portfolio_construction_models import (
    PortfolioConstraint,
    PortfolioOptimizationResult,
    TargetPosition,
)

logger = logging.getLogger("portfolio_construction_rules")


def equal_weight(equity: float, symbol_count: int) -> float:
    """Calculate equal weight capital allocation per asset ($)."""
    if equity <= 0 or symbol_count <= 0:
        return 0.0
    return round(equity / symbol_count, 2)


def risk_parity(equity: float, volatility: float, target_risk: float = 0.02) -> float:
    """Calculate Risk Parity capital allocation inversely proportional to volatility."""
    if equity <= 0 or volatility <= 0:
        return 10000.0
    risk_alloc = (equity * target_risk) / volatility
    return round(min(equity * 0.15, max(1000.0, risk_alloc)), 2)


def volatility_target(equity: float, current_vol: float, target_vol: float = 0.15) -> float:
    """Calculate portfolio leverage scaling factor for volatility targeting."""
    if current_vol <= 0:
        return 1.0
    scale = target_vol / current_vol
    return round(min(2.0, max(0.2, scale)), 2)


def kelly_position_size(win_rate: float, profit_factor: float, equity: float) -> float:
    """Calculate optimal position allocation percentage via Kelly Criterion formula."""
    if win_rate <= 0 or profit_factor <= 0 or equity <= 0:
        return 5000.0

    p = win_rate / 100.0 if win_rate > 1.0 else win_rate
    b = max(0.5, profit_factor)
    q = 1.0 - p

    kelly_pct = ((b * p) - q) / b
    # Use Half-Kelly for risk mitigation
    half_kelly = max(0.01, min(0.10, (kelly_pct / 2.0)))
    return round(equity * half_kelly, 2)


def fixed_fractional(equity: float, risk_pct: float = 0.02) -> float:
    """Calculate Fixed Fractional capital allocation ($)."""
    if equity <= 0:
        return 2000.0
    return round(equity * (risk_pct / 100.0 if risk_pct > 1.0 else risk_pct), 2)


def max_position_size(equity: float, price: float, max_weight_pct: float = 10.0) -> float:
    """Calculate maximum allowed share quantity given single position weight constraint."""
    if equity <= 0 or price <= 0:
        return 10.0
    max_cap = equity * (max_weight_pct / 100.0)
    return max(1.0, round(max_cap / price, 4))


def sector_constraints(sector_weight: float, max_sector_pct: float = 30.0) -> bool:
    """Check if sector weight satisfies portfolio constraints."""
    return sector_weight <= max_sector_pct


def portfolio_constraints(positions: List[TargetPosition], constraints: PortfolioConstraint) -> bool:
    """Validate list of TargetPositions against enterprise PortfolioConstraints."""
    if not positions or not constraints:
        return True

    for p in positions:
        if p.target_weight_pct > constraints.max_single_position_pct:
            return False
    return True


def rebalance_required(
    current_weights: Dict[str, float],
    target_weights: Dict[str, float],
    threshold_pct: float = 2.0,
) -> bool:
    """Determine if portfolio rebalancing is required based on weight drift threshold."""
    if not current_weights or not target_weights:
        return False

    for sym, t_w in target_weights.items():
        c_w = current_weights.get(sym, 0.0)
        if abs(t_w - c_w) >= threshold_pct:
            return True
    return False


def optimize_portfolio(
    equity: float,
    signals: List[Any],
    constraints: PortfolioConstraint,
) -> PortfolioOptimizationResult:
    """Construct optimized TargetPosition list across active signals."""
    rid = f"opt-{uuid.uuid4().hex[:8]}"
    if not signals or equity <= 0:
        return PortfolioOptimizationResult(
            result_id=rid,
            target_positions=[],
            rebalance_required=False,
            total_allocated_capital=0.0,
            cash_reserve=equity,
        )

    target_positions: List[TargetPosition] = []
    per_signal_cap = equal_weight(equity * 0.8, len(signals))

    total_alloc = 0.0

    for sig in signals:
        sym = getattr(sig, "symbol", "AAPL")
        price = getattr(sig, "suggested_price", 180.0)
        p_cap = min(equity * (constraints.max_single_position_pct / 100.0), per_signal_cap)
        shares = max(1.0, round(p_cap / price, 4))
        weight_pct = (p_cap / equity) * 100.0

        target_positions.append(
            TargetPosition(
                symbol=sym,
                target_weight_pct=weight_pct,
                target_shares=shares,
                current_shares=0.0,
                target_dollar_allocation=p_cap,
            )
        )
        total_alloc += p_cap

    cash_reserve = max(0.0, equity - total_alloc)

    return PortfolioOptimizationResult(
        result_id=rid,
        target_positions=target_positions,
        rebalance_required=False,
        total_allocated_capital=total_alloc,
        cash_reserve=cash_reserve,
    )
