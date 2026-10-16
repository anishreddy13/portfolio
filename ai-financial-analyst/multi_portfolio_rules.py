"""
multi_portfolio_rules.py — Pure Multi-Portfolio Mathematical Rules & Algorithms

Contains pure mathematical algorithms for equity aggregation, cash aggregation, weighted
exposure calculation, sector aggregation, factor exposure aggregation, portfolio comparison,
cross-portfolio risk, holding overlap detection, group rebalancing, and statistics aggregation.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import math
from typing import Any, Dict, List, Set, Tuple

logger = logging.getLogger("multi_portfolio_rules")


def aggregate_equity(equities: List[float]) -> float:
    """Sum total equity across multiple portfolios."""
    return round(sum(equities), 2)


def aggregate_cash(cashes: List[float]) -> float:
    """Sum total cash balance across multiple portfolios."""
    return round(sum(cashes), 2)


def aggregate_exposure(exposures: List[float], weights: List[float]) -> float:
    """Calculate capital-weighted average exposure across portfolios."""
    if not exposures or not weights or len(exposures) != len(weights):
        return 0.0
    total_w = sum(weights)
    if total_w <= 0:
        return 0.0
    weighted_sum = sum(exposures[i] * weights[i] for i in range(len(exposures)))
    return round(weighted_sum / total_w, 4)


def aggregate_sector_weights(
    portfolio_sector_weights: List[Dict[str, float]],
    portfolio_weights: List[float],
) -> Dict[str, float]:
    """Calculate aggregated group sector allocation weights."""
    if not portfolio_sector_weights or not portfolio_weights:
        return {}

    total_w = sum(portfolio_weights)
    if total_w <= 0:
        return {}

    sector_totals: Dict[str, float] = {}
    for i, sec_dict in enumerate(portfolio_sector_weights):
        w = portfolio_weights[i]
        for sec, weight in sec_dict.items():
            sector_totals[sec] = sector_totals.get(sec, 0.0) + (weight * w)

    return {k: round(v / total_w, 2) for k, v in sector_totals.items()}


def aggregate_factor_exposure(
    portfolio_factor_exposures: List[Dict[str, float]],
    portfolio_weights: List[float],
) -> Dict[str, float]:
    """Calculate aggregated group multi-factor exposures."""
    if not portfolio_factor_exposures or not portfolio_weights:
        return {}

    total_w = sum(portfolio_weights)
    if total_w <= 0:
        return {}

    factor_totals: Dict[str, float] = {}
    for i, f_dict in enumerate(portfolio_factor_exposures):
        w = portfolio_weights[i]
        for factor, exp in f_dict.items():
            factor_totals[factor] = factor_totals.get(factor, 0.0) + (exp * w)

    return {k: round(v / total_w, 4) for k, v in factor_totals.items()}


def compare_portfolios(
    equity_a: float,
    equity_b: float,
    holdings_a: List[str],
    holdings_b: List[str],
    beta_a: float = 1.0,
    beta_b: float = 1.0,
) -> Tuple[float, float, float]:
    """Compare two portfolios returning (equity_ratio, holding_overlap_pct, beta_difference)."""
    eq_ratio = round(equity_a / equity_b, 4) if equity_b > 0 else 1.0
    set_a = set(holdings_a)
    set_b = set(holdings_b)
    union_set = set_a.union(set_b)
    intersect_set = set_a.intersection(set_b)

    overlap_pct = (len(intersect_set) / len(union_set) * 100.0) if union_set else 0.0
    beta_diff = round(abs(beta_a - beta_b), 4)

    return (eq_ratio, round(overlap_pct, 2), beta_diff)


def rebalance_group(
    portfolio_equities: Dict[str, float],
    target_weights: Dict[str, float],
) -> Dict[str, float]:
    """Calculate required capital rebalancing transfers to achieve target weights."""
    total_eq = sum(portfolio_equities.values())
    transfers: Dict[str, float] = {}
    for pid, eq in portfolio_equities.items():
        target_w = target_weights.get(pid, 0.0)
        target_eq = total_eq * (target_w / 100.0)
        transfers[pid] = round(target_eq - eq, 2)
    return transfers


def cross_portfolio_risk(
    vars: List[float],
    weights: List[float],
    avg_correlation: float = 0.45,
) -> float:
    """Calculate portfolio group aggregate VaR accounting for cross-portfolio correlation."""
    if not vars or not weights:
        return 0.0
    total_w = sum(weights)
    if total_w <= 0:
        return 0.0

    # Normalized weights
    norm_w = [w / total_w for w in weights]
    n = len(vars)

    # Portfolio Variance = ∑ (w_i * var_i)^2 + 2 * ∑ (w_i * w_j * var_i * var_j * corr)
    var_sum = 0.0
    for i in range(n):
        for j in range(n):
            if i == j:
                var_sum += (norm_w[i] * vars[i]) ** 2
            else:
                var_sum += norm_w[i] * norm_w[j] * vars[i] * vars[j] * avg_correlation

    return round(math.sqrt(max(0.0, var_sum)), 2)


def detect_overlap(
    portfolios_holdings: Dict[str, List[Tuple[str, float, float]]],
) -> List[Tuple[str, float, float, List[str]]]:
    """Detect positions held across multiple portfolios in a group.

    Args:
        portfolios_holdings: pid -> [(symbol, shares, market_value), ...]

    Returns:
        List of (symbol, total_shares, total_market_value, list_of_pids_holding)
    """
    symbol_map: Dict[str, Dict[str, Any]] = {}
    for pid, holdings in portfolios_holdings.items():
        for sym, shares, val in holdings:
            if sym not in symbol_map:
                symbol_map[sym] = {"shares": 0.0, "value": 0.0, "pids": []}
            symbol_map[sym]["shares"] += shares
            symbol_map[sym]["value"] += val
            symbol_map[sym]["pids"].append(pid)

    overlap_list = []
    for sym, data in symbol_map.items():
        if len(data["pids"]) > 1:
            overlap_list.append((sym, data["shares"], data["value"], data["pids"]))

    return sorted(overlap_list, key=lambda x: x[2], reverse=True)


def aggregate_statistics(groups: List[Any], portfolios: List[Any]) -> Dict[str, Any]:
    """Aggregate operational metrics across all groups and portfolios."""
    total_groups = len(groups)
    total_ports = len(portfolios)
    tot_eq = sum(getattr(p, "total_equity", 0.0) for p in portfolios)
    avg_ports = (total_ports / total_groups) if total_groups > 0 else 0.0

    return {
        "total_groups_managed": total_groups,
        "total_portfolios_tracked": total_ports,
        "total_combined_equity": round(tot_eq, 2),
        "average_portfolios_per_group": round(avg_ports, 2),
    }
