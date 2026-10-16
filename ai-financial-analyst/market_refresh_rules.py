"""
market_refresh_rules.py — Pure Stale-While-Revalidate Refresh Rules

Contains pure algorithm functions evaluating when stale cache entries qualify for SWR background refresh,
whether stale data is within grace limits, and calculating task priority weights.

No HTTP, networking, or provider logic inside this module.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from market_types import DataType

logger = logging.getLogger("market_refresh_rules")


def refresh_key(data_type: DataType, symbol: str = "", timeframe: str = "", exchange: str = "") -> str:
    """Generate standardized unique refresh task key tag."""
    dt_str = data_type.value if hasattr(data_type, "value") else str(data_type)
    sym_str = symbol.strip().upper() if symbol else "GLOBAL"

    parts = [dt_str, sym_str]
    if timeframe:
        parts.append(timeframe.strip().lower())
    if exchange:
        parts.append(exchange.strip().upper())

    return ":".join(parts)


def should_refresh_async(created_at_iso: str, ttl_sec: float, stale_grace_sec: float = 300.0) -> bool:
    """Determine if entry has exceeded TTL and requires asynchronous background refresh."""
    if not created_at_iso:
        return True

    try:
        created_dt = datetime.fromisoformat(created_at_iso)
        now_dt = datetime.now(timezone.utc)
        elapsed_sec = (now_dt - created_dt).total_seconds()

        # Requires async refresh if age exceeds TTL
        return elapsed_sec >= ttl_sec
    except Exception:
        return True


def stale_allowed(created_at_iso: str, ttl_sec: float, stale_grace_sec: float = 300.0) -> bool:
    """Determine if expired entry is within stale grace limit and safe to serve immediately."""
    if not created_at_iso:
        return False

    try:
        created_dt = datetime.fromisoformat(created_at_iso)
        now_dt = datetime.now(timezone.utc)
        elapsed_sec = (now_dt - created_dt).total_seconds()

        max_allowed = ttl_sec + stale_grace_sec
        return elapsed_sec <= max_allowed
    except Exception:
        return False


def refresh_priority(data_type: DataType) -> int:
    """Return priority ranking integer for background refresh tasks (higher = processed first)."""
    if data_type == DataType.QUOTE:
        return 100
    elif data_type == DataType.MARKET_STATUS:
        return 90
    elif data_type == DataType.HISTORICAL_BARS:
        return 80
    elif data_type == DataType.NEWS:
        return 70
    elif data_type in (DataType.OPTIONS_CHAIN, DataType.OPTIONS_CONTRACT):
        return 60
    elif data_type == DataType.FUNDAMENTALS:
        return 50
    return 40


def refresh_interval(data_type: DataType) -> float:
    """Return default background refresh polling interval in seconds."""
    if data_type == DataType.QUOTE:
        return 5.0
    elif data_type == DataType.MARKET_STATUS:
        return 30.0
    elif data_type == DataType.NEWS:
        return 300.0
    elif data_type == DataType.HISTORICAL_BARS:
        return 3600.0
    return 86400.0
