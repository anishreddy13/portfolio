"""
streaming_rules.py — Pure Streaming Rules & Validation

Contains pure algorithm functions for generating subscription topic keys, validating
streaming message integrity, checking message age thresholds, and calculating exponential
reconnection backoff delays.

No network calls or websocket code inside this module.
"""

from __future__ import annotations

import logging, math
from datetime import datetime, timezone
from typing import Optional

from market_types import DataType
from streaming_models import StreamMessage

logger = logging.getLogger("streaming_rules")


def subscription_key(data_type: DataType, symbol: str = "", exchange: str = "") -> str:
    """Generate standardized unique streaming subscription topic key tag."""
    dt_str = data_type.value if hasattr(data_type, "value") else str(data_type)
    sym_str = symbol.strip().upper() if symbol else "GLOBAL"

    parts = [dt_str, sym_str]
    if exchange:
        parts.append(exchange.strip().upper())

    return ":".join(parts)


def should_subscribe(active_subs_count: int, max_subs: int = 500) -> bool:
    """Determine if a new subscription request can be accepted within capacity limits."""
    return active_subs_count < max_subs


def should_unsubscribe(subscriber_count_for_key: int) -> bool:
    """Determine if an upstream provider websocket channel should be closed when subscribers hit zero."""
    return subscriber_count_for_key <= 0


def message_expired(timestamp_iso: str, max_age_sec: float = 60.0) -> bool:
    """Check if stream event timestamp exceeds maximum age threshold."""
    if not timestamp_iso:
        return True

    try:
        ts_dt = datetime.fromisoformat(timestamp_iso)
        now_dt = datetime.now(timezone.utc)
        elapsed = (now_dt - ts_dt).total_seconds()
        return elapsed > max_age_sec
    except Exception:
        return True


def validate_stream_message(message: StreamMessage) -> bool:
    """Validate completeness and schema integrity of a StreamMessage payload."""
    if not message:
        return False
    if not message.key or not message.symbol or not message.data_type:
        return False
    if message.payload is None:
        return False
    return True


def reconnect_delay(attempt: int, base_delay: float = 1.0, max_delay: float = 30.0) -> float:
    """Calculate exponential backoff delay duration in seconds for stream reconnection."""
    if attempt <= 0:
        return base_delay

    delay = base_delay * math.pow(2, attempt - 1)
    return min(delay, max_delay)
