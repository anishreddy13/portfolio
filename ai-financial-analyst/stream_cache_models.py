"""
stream_cache_models.py — Data Models for Stream-to-Cache Real-Time Bridge

Defines StreamCacheUpdate and StreamCacheStatistics dataclasses with JSON serialization support.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass
class StreamCacheUpdate:
    """Represents a single stream-to-cache mutation update event.

    Attributes:
        key: Unique cache key tag (e.g. 'QUOTE:AAPL').
        data_type: DataType category string.
        symbol: Target ticker symbol.
        provider: Origin provider tag (e.g. 'POLYGON').
        timestamp: ISO timestamp of stream event.
        success: True if cache update was successfully applied.
    """
    key: str
    data_type: str
    symbol: str
    provider: str
    timestamp: str
    success: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert StreamCacheUpdate to clean dictionary."""
        return {
            "key": self.key,
            "data_type": self.data_type,
            "symbol": self.symbol,
            "provider": self.provider,
            "timestamp": self.timestamp,
            "success": self.success,
        }


@dataclass
class StreamCacheStatistics:
    """Operational metrics tracking the real-time stream-to-cache bridge.

    Attributes:
        messages_received: Total stream messages received from streaming manager.
        cache_updates_applied: Total cache entries successfully updated in real time.
        duplicates_ignored: Number of out-of-order or duplicate stream messages skipped.
        failed_updates: Number of failed cache update attempts.
        active_bridge: Status boolean indicating if bridge listener is running.
    """
    messages_received: int = 0
    cache_updates_applied: int = 0
    duplicates_ignored: int = 0
    failed_updates: int = 0
    active_bridge: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert StreamCacheStatistics to clean dictionary."""
        return {
            "messages_received": self.messages_received,
            "cache_updates_applied": self.cache_updates_applied,
            "duplicates_ignored": self.duplicates_ignored,
            "failed_updates": self.failed_updates,
            "active_bridge": self.active_bridge,
        }
