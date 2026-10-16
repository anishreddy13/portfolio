"""
market_cache_models.py — Data Models for Enterprise Market Cache Layer

Defines CacheEntry, CacheStatistics, and CacheConfiguration dataclasses with
full JSON serialization support.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass
class CacheEntry:
    """Represents a single cached ConsensusResult payload entry.

    Attributes:
        key: Unique lookup string key (e.g. 'QUOTE:AAPL').
        data_type: DataType category string.
        symbol: Target ticker symbol.
        value: Stored ConsensusResult object.
        created_at: ISO timestamp when entry was inserted.
        expires_at: ISO timestamp when entry expires.
        ttl_seconds: TTL duration in seconds.
        hit_count: Number of times entry has been served from cache.
    """
    key: str
    data_type: str
    symbol: str
    value: Any
    created_at: str = ""
    expires_at: str = ""
    ttl_seconds: float = 5.0
    hit_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert CacheEntry to clean dictionary with JSON-serializable value."""
        val_dict = self.value.to_dict() if hasattr(self.value, "to_dict") else self.value
        return {
            "key": self.key,
            "data_type": self.data_type,
            "symbol": self.symbol,
            "value": val_dict,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
            "ttl_seconds": round(self.ttl_seconds, 2),
            "hit_count": self.hit_count,
        }


@dataclass
class CacheStatistics:
    """Operational performance metrics for the Enterprise Market Cache.

    Attributes:
        cache_hits: Cumulative cache hits.
        cache_misses: Cumulative cache misses.
        hit_ratio: Cache hit percentage ratio (0.0 to 100.0%).
        refresh_count: Number of times cache entry was refreshed from provider service.
        expired_entries: Number of expired cache entries encountered.
        evictions: Number of entries evicted due to max capacity limits.
        total_entries: Current number of active entries in cache storage.
    """
    cache_hits: int = 0
    cache_misses: int = 0
    hit_ratio: float = 0.0
    refresh_count: int = 0
    expired_entries: int = 0
    evictions: int = 0
    total_entries: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert CacheStatistics to clean dictionary."""
        return {
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "hit_ratio": round(self.hit_ratio, 2),
            "refresh_count": self.refresh_count,
            "expired_entries": self.expired_entries,
            "evictions": self.evictions,
            "total_entries": self.total_entries,
        }


@dataclass
class CacheConfiguration:
    """Configurable TTL and capacity bounds for the enterprise cache.

    Attributes:
        max_entries: Maximum number of LRU entries allowed in memory.
        quote_ttl_sec: Quotes TTL (default 5 seconds).
        market_status_ttl_sec: Market Status TTL (default 30 seconds).
        news_ttl_sec: News TTL (default 5 minutes / 300 seconds).
        historical_ttl_sec: Historical Series TTL (default 1 hour / 3600 seconds).
        fundamentals_ttl_sec: Fundamentals TTL (default 24 hours / 86400 seconds).
        corporate_actions_ttl_sec: Corporate Actions TTL (default 24 hours / 86400 seconds).
        options_ttl_sec: Options Chain TTL (default 30 seconds).
    """
    max_entries: int = 1000
    quote_ttl_sec: float = 5.0
    market_status_ttl_sec: float = 30.0
    news_ttl_sec: float = 300.0
    historical_ttl_sec: float = 3600.0
    fundamentals_ttl_sec: float = 86400.0
    corporate_actions_ttl_sec: float = 86400.0
    options_ttl_sec: float = 30.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert CacheConfiguration to clean dictionary."""
        return {
            "max_entries": self.max_entries,
            "quote_ttl_sec": self.quote_ttl_sec,
            "market_status_ttl_sec": self.market_status_ttl_sec,
            "news_ttl_sec": self.news_ttl_sec,
            "historical_ttl_sec": self.historical_ttl_sec,
            "fundamentals_ttl_sec": self.fundamentals_ttl_sec,
            "corporate_actions_ttl_sec": self.corporate_actions_ttl_sec,
            "options_ttl_sec": self.options_ttl_sec,
        }
