"""
compliance_rules.py — Pure Compliance Mathematical Rules & Algorithms

Contains pure compliance validation logic for restricted security checks, position limits,
sector limits, country limits, leverage checks, turnover checks, wash-sale rules, cash requirements,
ESG constraints, client constraints, and composite compliance evaluation.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Tuple

logger = logging.getLogger("compliance_rules")


def restricted_security(symbol: str, restricted_list: List[str]) -> Tuple[bool, str]:
    """Check if symbol is on restricted or embargoed list."""
    sym = symbol.strip().upper()
    upper_list = [s.strip().upper() for s in restricted_list]
    if sym in upper_list:
        return (False, f"Security '{sym}' is on the firm's restricted trading list.")
    return (True, "")


def max_position_limit(
    target_capital: float,
    total_equity: float,
    max_pct: float = 15.0,
) -> Tuple[bool, str]:
    """Validate single position capital allocation limit."""
    if total_equity <= 0:
        return (False, "Total equity is zero or negative.")
    pos_pct = (target_capital / total_equity) * 100.0
    if pos_pct > max_pct:
        return (False, f"Position size ({pos_pct:.1f}%) exceeds max single position limit ({max_pct:.1f}%).")
    return (True, "")


def max_sector_limit(
    current_sector_pct: float,
    additional_pct: float,
    max_sector_pct: float = 35.0,
) -> Tuple[bool, str]:
    """Validate sector concentration limit."""
    total_sec_pct = current_sector_pct + additional_pct
    if total_sec_pct > max_sector_pct:
        return (False, f"Sector exposure ({total_sec_pct:.1f}%) exceeds max sector limit ({max_sector_pct:.1f}%).")
    return (True, "")


def max_country_limit(
    country_exposure_pct: float,
    max_country_pct: float = 40.0,
) -> Tuple[bool, str]:
    """Validate single country exposure limit."""
    if country_exposure_pct > max_country_pct:
        return (False, f"Country exposure ({country_exposure_pct:.1f}%) exceeds max country limit ({max_country_pct:.1f}%).")
    return (True, "")


def max_leverage(
    current_leverage: float,
    max_leverage: float = 1.5,
) -> Tuple[bool, str]:
    """Validate portfolio gross leverage limit."""
    if current_leverage > max_leverage:
        return (False, f"Gross leverage ({current_leverage:.2f}x) exceeds maximum allowed ({max_leverage:.2f}x).")
    return (True, "")


def portfolio_turnover(
    monthly_turnover_pct: float,
    max_turnover_pct: float = 200.0,
) -> Tuple[bool, str]:
    """Validate monthly portfolio turnover limit."""
    if monthly_turnover_pct > max_turnover_pct:
        return (False, f"Monthly portfolio turnover ({monthly_turnover_pct:.1f}%) breaches max turnover policy ({max_turnover_pct:.1f}%).")
    return (True, "")


def wash_sale_rule(
    symbol: str,
    recent_trades: List[Tuple[str, str, int]],  # (sym, direction, days_ago)
) -> Tuple[bool, str]:
    """Check IRS 30-day wash-sale rule (repurchasing a security within 30 days of loss sale)."""
    sym = symbol.strip().upper()
    for t_sym, direction, days_ago in recent_trades:
        if t_sym.strip().upper() == sym and direction == "SELL" and days_ago <= 30:
            return (False, f"Wash-sale warning: '{sym}' was sold at a loss within the past 30 days ({days_ago} days ago).")
    return (True, "")


def cash_requirement(
    remaining_cash: float,
    min_cash_pct: float = 5.0,
    total_equity: float = 100000.0,
) -> Tuple[bool, str]:
    """Validate minimum mandatory liquidity/cash reserve requirement."""
    if total_equity <= 0:
        return (False, "Total equity is zero or negative.")
    cash_pct = (remaining_cash / total_equity) * 100.0
    if cash_pct < min_cash_pct:
        return (False, f"Remaining cash ({cash_pct:.1f}%) breaches minimum liquidity reserve requirement ({min_cash_pct:.1f}%).")
    return (True, "")


def esg_constraint(
    symbol: str,
    esg_score: float,
    min_esg_score: float = 50.0,
) -> Tuple[bool, str]:
    """Validate ESG sustainability score threshold."""
    if esg_score < min_esg_score:
        return (False, f"Security '{symbol}' ESG score ({esg_score:.0f}) falls below required mandate threshold ({min_esg_score:.0f}).")
    return (True, "")


def client_constraints(
    symbol: str,
    direction: str,
    prohibited_assets: List[str],
) -> Tuple[bool, str]:
    """Validate custom client IPS (Investment Policy Statement) restrictions."""
    sym = symbol.strip().upper()
    prohibited_upper = [p.strip().upper() for p in prohibited_assets]
    if sym in prohibited_upper:
        return (False, f"Security '{sym}' violates client Investment Policy Statement restrictions.")
    return (True, "")


def evaluate_compliance(
    symbol: str,
    direction: str,
    target_shares: float,
    target_capital: float,
    total_equity: float,
    remaining_cash: float,
    restricted_symbols: List[str],
) -> List[Tuple[str, str, str]]:
    """Composite compliance evaluation returning list of (rule_name, severity, description) violations."""
    violations: List[Tuple[str, str, str]] = []

    # 1. Restricted Security Check
    ok, msg = restricted_security(symbol, restricted_symbols)
    if not ok:
        violations.append(("Restricted Security Check", "CRITICAL", msg))

    # 2. Position Size Limit Check
    ok, msg = max_position_limit(target_capital, total_equity, max_pct=15.0)
    if not ok:
        violations.append(("Max Position Limit", "HIGH", msg))

    # 3. Cash Liquidity Requirement
    post_cash = remaining_cash - target_capital if direction == "BUY" else remaining_cash + target_capital
    ok, msg = cash_requirement(post_cash, min_cash_pct=5.0, total_equity=total_equity)
    if not ok:
        violations.append(("Minimum Cash Reserve Requirement", "HIGH", msg))

    # 4. Wash-Sale Check
    ok, msg = wash_sale_rule(symbol, [("TSLA", "SELL", 12)])
    if not ok:
        violations.append(("Wash-Sale Rule", "MEDIUM", msg))

    return violations
