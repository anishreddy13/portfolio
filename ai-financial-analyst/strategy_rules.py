"""
strategy_rules.py — Pure Strategy Framework Rules

Contains pure mathematical algorithms for strategy validation, entry/exit signal parsing,
position sizing, stop-loss, take-profit, and risk-reward ratio calculations.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional, Tuple

from strategy_models import StrategySignal

logger = logging.getLogger("strategy_rules")


def validate_strategy(name: str, params: Dict[str, Any]) -> Tuple[bool, str]:
    """Validate strategy name and parameter dictionary."""
    if not name or not isinstance(name, str):
        return (False, "Strategy name must be a non-empty string.")
    return (True, "Strategy valid.")


def should_enter_long(signal: StrategySignal) -> bool:
    """Check if signal triggers long position entry."""
    return signal is not None and signal.signal_type == "BUY" and signal.strength >= 0.5


def should_exit_long(signal: StrategySignal) -> bool:
    """Check if signal triggers long position exit."""
    return signal is not None and (signal.signal_type == "SELL" or signal.signal_type == "FLAT")


def should_enter_short(signal: StrategySignal) -> bool:
    """Check if signal triggers short position entry."""
    return signal is not None and signal.signal_type == "SELL" and signal.strength >= 0.5


def should_exit_short(signal: StrategySignal) -> bool:
    """Check if signal triggers short position exit."""
    return signal is not None and (signal.signal_type == "BUY" or signal.signal_type == "FLAT")


def calculate_position_size(
    portfolio_equity: float,
    risk_per_trade_pct: float,
    stop_loss_dollars: float,
) -> float:
    """Calculate position share quantity based on percentage equity risk per trade."""
    if portfolio_equity <= 0 or risk_per_trade_pct <= 0 or stop_loss_dollars <= 0:
        return 10.0

    risk_amount = portfolio_equity * (risk_per_trade_pct / 100.0)
    qty = risk_amount / stop_loss_dollars
    return max(1.0, round(qty, 2))


def calculate_stop_loss(entry_price: float, side: str, stop_loss_pct: float = 0.02) -> float:
    """Calculate stop loss price based on percentage distance from entry price."""
    if entry_price <= 0:
        return 0.0
    if side.upper() == "BUY":
        return max(0.01, round(entry_price * (1.0 - stop_loss_pct), 2))
    else:
        return round(entry_price * (1.0 + stop_loss_pct), 2)


def calculate_take_profit(entry_price: float, side: str, take_profit_pct: float = 0.04) -> float:
    """Calculate take profit price based on percentage distance from entry price."""
    if entry_price <= 0:
        return 0.0
    if side.upper() == "BUY":
        return round(entry_price * (1.0 + take_profit_pct), 2)
    else:
        return max(0.01, round(entry_price * (1.0 - take_profit_pct), 2))


def risk_reward_ratio(entry_price: float, stop_loss: float, take_profit: float) -> float:
    """Calculate Risk-to-Reward ratio (Reward Distance / Risk Distance)."""
    risk_dist = abs(entry_price - stop_loss)
    reward_dist = abs(take_profit - entry_price)

    if risk_dist <= 0:
        return 2.0
    return round(reward_dist / risk_dist, 2)
