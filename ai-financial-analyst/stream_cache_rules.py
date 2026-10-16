"""
stream_cache_rules.py — Pure Stream-to-Cache Bridge Rules

Pure functions determining whether a StreamMessage should update EnterpriseMarketCache,
verifying sequence/timestamps to reject out-of-order duplicates, and generating update keys.

No network, provider, or websocket logic inside this module.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from streaming_models import StreamMessage
from stream_cache_models import StreamCacheUpdate

logger = logging.getLogger("stream_cache_rules")


def cache_update_key(data_type_str: str, symbol: str = "") -> str:
    """Generate standardized cache key matching EnterpriseMarketCache tag format."""
    dt_str = data_type_str.strip().upper()
    sym_str = symbol.strip().upper() if symbol else "GLOBAL"
    return f"{dt_str}:{sym_str}"


def should_update_cache(message: StreamMessage) -> bool:
    """Determine if an incoming StreamMessage is valid for cache mutation."""
    if not message or not message.key or not message.payload:
        return False
    return True


def ignore_duplicate_stream(last_timestamp: Optional[str], new_timestamp: str) -> bool:
    """Check if new stream event timestamp is older than or equal to current cached timestamp."""
    if not last_timestamp or not new_timestamp:
        return False

    try:
        last_dt = datetime.fromisoformat(last_timestamp)
        new_dt = datetime.fromisoformat(new_timestamp)

        # Ignore if new event is older or identical timestamp
        return new_dt <= last_dt
    except Exception:
        return False


def merge_stream_update(existing_value: Any, new_payload: Any) -> Any:
    """Merge incoming stream update payload into existing cache object or return new payload."""
    if existing_value is None:
        return new_payload
    return new_payload


def validate_stream_cache_update(update: StreamCacheUpdate) -> bool:
    """Validate StreamCacheUpdate metadata object."""
    if not update:
        return False
    if not update.key or not update.symbol:
        return False
    return True
