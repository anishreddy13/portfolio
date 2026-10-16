"""
request_coordinator_rules.py — Pure Request Coalescing Rules

Defines request key generation, SingleFlight join criteria, timeout evaluations,
and completed request cleanup rules. No HTTP or provider logic inside this module.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional

from market_types import DataType
from request_coordinator_models import PendingRequest

logger = logging.getLogger("request_coordinator_rules")


def request_key(data_type: DataType, symbol: str = "", timeframe: str = "", exchange: str = "") -> str:
    """Generate standardized unique request key string."""
    dt_str = data_type.value if hasattr(data_type, "value") else str(data_type)
    sym_str = symbol.strip().upper() if symbol else "GLOBAL"

    parts = [dt_str, sym_str]
    if timeframe:
        parts.append(timeframe.strip().lower())
    if exchange:
        parts.append(exchange.strip().upper())

    return ":".join(parts)


def should_join_existing_request(pending: Optional[PendingRequest], enable_coalescing: bool = True) -> bool:
    """Determine if a new caller thread should join an existing in-flight SingleFlight request."""
    if not enable_coalescing:
        return False
    if pending is None:
        return False
    return pending.result is None and pending.error is None


def request_timeout(pending: PendingRequest, timeout_sec: float = 10.0) -> bool:
    """Check if in-flight request has exceeded maximum timeout threshold."""
    if not pending or not pending.created_at:
        return False

    try:
        start_dt = datetime.fromisoformat(pending.created_at)
        now_dt = datetime.now(timezone.utc)
        elapsed = (now_dt - start_dt).total_seconds()
        return elapsed > timeout_sec
    except Exception:
        return False


def cleanup_completed_requests(pending_map: Dict[str, PendingRequest]) -> List[str]:
    """Identify keys of completed or errored requests ready for removal from active mapping."""
    keys_to_remove: List[str] = []
    for k, req in pending_map.items():
        if req.result is not None or req.error is not None:
            keys_to_remove.append(k)
    return keys_to_remove
