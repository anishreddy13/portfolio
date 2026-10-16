"""
market_cache_rules.py — Pure Cache Calculation & Expiration Rules

Defines TTL calculations, cache key generators, expiration checks, and hit/miss updates.
No HTTP, networking, provider logic, or consensus logic inside this module.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Optional

from market_types import DataType
from market_cache_models import CacheConfiguration, CacheEntry

logger = logging.getLogger("market_cache_rules")


def calculate_ttl(data_type: DataType, config: Optional[CacheConfiguration] = None) -> float:
    """Calculate TTL duration in seconds for a specific DataType.

    Defaults:
      - QUOTE: 5 seconds
      - MARKET_STATUS: 30 seconds
      - OPTIONS_CHAIN / OPTIONS_CONTRACT: 30 seconds
      - NEWS: 300 seconds (5 minutes)
      - HISTORICAL_BARS: 3600 seconds (1 hour)
      - FUNDAMENTALS: 86400 seconds (24 hours)
      - CORPORATE_ACTIONS: 86400 seconds (24 hours)
    """
    cfg = config or CacheConfiguration()

    if data_type == DataType.QUOTE:
        return cfg.quote_ttl_sec
    elif data_type == DataType.MARKET_STATUS:
        return cfg.market_status_ttl_sec
    elif data_type in (DataType.OPTIONS_CHAIN, DataType.OPTIONS_CONTRACT):
        return cfg.options_ttl_sec
    elif data_type == DataType.NEWS:
        return cfg.news_ttl_sec
    elif data_type == DataType.HISTORICAL_BARS:
        return cfg.historical_ttl_sec
    elif data_type == DataType.FUNDAMENTALS:
        return cfg.fundamentals_ttl_sec
    elif data_type == DataType.CORPORATE_ACTIONS:
        return cfg.corporate_actions_ttl_sec

    return 60.0  # Generic default fallback


def cache_key(data_type: DataType, symbol: str = "", timeframe: str = "", exchange: str = "") -> str:
    """Generate standardized unique cache key string."""
    dt_str = data_type.value if hasattr(data_type, "value") else str(data_type)
    sym_str = symbol.strip().upper() if symbol else "GLOBAL"

    parts = [dt_str, sym_str]
    if timeframe:
        parts.append(timeframe.strip().lower())
    if exchange:
        parts.append(exchange.strip().upper())

    return ":".join(parts)


def cache_expired(entry: CacheEntry) -> bool:
    """Check if cache entry has exceeded its TTL expiration timestamp."""
    if not entry or not entry.expires_at:
        return True

    try:
        exp_dt = datetime.fromisoformat(entry.expires_at)
        now_dt = datetime.now(timezone.utc)
        return now_dt >= exp_dt
    except Exception:
        return True


def should_refresh(entry: Optional[CacheEntry]) -> bool:
    """Return True if cache entry is missing or expired, requiring a provider service query."""
    if entry is None:
        return True
    return cache_expired(entry)


def cache_hit(entry: CacheEntry) -> CacheEntry:
    """Update cache entry metadata on successful cache hit."""
    entry.hit_count += 1
    return entry


def cache_miss(key: str) -> None:
    """Log cache miss event."""
    logger.debug("Cache miss for key: %s", key)
