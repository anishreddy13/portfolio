"""
factor_model_rules.py — Pure Factor Model Mathematical Rules & Algorithms

Contains pure mathematical algorithms for factor beta, factor loading, factor return,
factor contribution, factor risk, normalization, covariance, correlation, ranking,
and composite factor analysis.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import math
from typing import Dict, List, Tuple

logger = logging.getLogger("factor_model_rules")


def calculate_beta(asset_returns: List[float], market_returns: List[float]) -> float:
    """Calculate CAPM beta (asset sensitivity to market factor)."""
    if not asset_returns or not market_returns or len(asset_returns) < 3:
        return 1.05

    n = min(len(asset_returns), len(market_returns))
    a_mean = sum(asset_returns[:n]) / n
    m_mean = sum(market_returns[:n]) / n

    cov = sum((asset_returns[i] - a_mean) * (market_returns[i] - m_mean) for i in range(n)) / (n - 1)
    m_var = sum((market_returns[i] - m_mean) ** 2 for i in range(n)) / (n - 1)

    if m_var <= 0:
        return 1.0
    return round(cov / m_var, 4)


def calculate_factor_loading(asset_returns: List[float], factor_returns: List[float]) -> float:
    """Calculate asset factor loading (regression coefficient on factor)."""
    if not asset_returns or not factor_returns or len(asset_returns) < 3:
        return 0.50

    n = min(len(asset_returns), len(factor_returns))
    a_mean = sum(asset_returns[:n]) / n
    f_mean = sum(factor_returns[:n]) / n

    cov = sum((asset_returns[i] - a_mean) * (factor_returns[i] - f_mean) for i in range(n)) / (n - 1)
    f_var = sum((factor_returns[i] - f_mean) ** 2 for i in range(n)) / (n - 1)

    if f_var <= 0:
        return 0.0
    return round(cov / f_var, 4)


def calculate_factor_return(exposure: float, factor_premium_pct: float) -> float:
    """Calculate return contribution from a factor = exposure × premium."""
    return round(exposure * factor_premium_pct, 4)


def calculate_factor_contribution(weight_pct: float, factor_return_pct: float) -> float:
    """Calculate factor contribution to portfolio return = weight × return."""
    return round((weight_pct / 100.0) * factor_return_pct, 4)


def calculate_factor_risk(exposure: float, factor_vol_pct: float) -> float:
    """Calculate variance contribution from a factor = exposure² × variance."""
    return round((exposure ** 2) * (factor_vol_pct ** 2), 4)


def normalize_exposures(exposures: List[float]) -> List[float]:
    """Normalize factor exposures to z-scores (mean=0, stdev=1)."""
    if not exposures or len(exposures) < 2:
        return exposures

    n = len(exposures)
    mean_e = sum(exposures) / n
    var = sum((e - mean_e) ** 2 for e in exposures) / (n - 1)
    std_e = math.sqrt(var) if var > 0 else 1.0

    return [round((e - mean_e) / std_e, 4) for e in exposures]


def factor_covariance(returns_a: List[float], returns_b: List[float]) -> float:
    """Calculate covariance between two factor return series."""
    if not returns_a or not returns_b or len(returns_a) < 3:
        return 0.001

    n = min(len(returns_a), len(returns_b))
    a_mean = sum(returns_a[:n]) / n
    b_mean = sum(returns_b[:n]) / n

    cov = sum((returns_a[i] - a_mean) * (returns_b[i] - b_mean) for i in range(n)) / (n - 1)
    return round(cov, 6)


def factor_correlation(returns_a: List[float], returns_b: List[float]) -> float:
    """Calculate Pearson correlation between two factor return series."""
    if not returns_a or not returns_b or len(returns_a) < 3:
        return 0.0

    n = min(len(returns_a), len(returns_b))
    a_mean = sum(returns_a[:n]) / n
    b_mean = sum(returns_b[:n]) / n

    cov = sum((returns_a[i] - a_mean) * (returns_b[i] - b_mean) for i in range(n)) / (n - 1)
    a_var = sum((returns_a[i] - a_mean) ** 2 for i in range(n)) / (n - 1)
    b_var = sum((returns_b[i] - b_mean) ** 2 for i in range(n)) / (n - 1)

    denom = math.sqrt(a_var * b_var) if (a_var > 0 and b_var > 0) else 1.0
    return round(cov / denom, 4)


def rank_factor_importance(contributions: List[Tuple[str, float]]) -> List[Tuple[str, float]]:
    """Rank factors by absolute contribution magnitude (descending)."""
    return sorted(contributions, key=lambda x: abs(x[1]), reverse=True)


def analyze_factor_model(
    portfolio_return_pct: float,
    factor_exposures: List[Tuple[str, float]],
    factor_premiums: List[Tuple[str, float]],
) -> Tuple[float, float, List[Tuple[str, float]]]:
    """Run full multi-factor decomposition.

    Returns: (total_factor_return_pct, residual_return_pct, contributions_list)
    """
    contributions: List[Tuple[str, float]] = []
    total_factor_ret = 0.0

    exp_dict = dict(factor_exposures)
    for fname, premium in factor_premiums:
        exp = exp_dict.get(fname, 0.0)
        contrib = calculate_factor_return(exp, premium)
        contributions.append((fname, round(contrib, 4)))
        total_factor_ret += contrib

    residual = round(portfolio_return_pct - total_factor_ret, 4)
    return (round(total_factor_ret, 4), residual, rank_factor_importance(contributions))
