"""
dashboard_scheduler_rules.py — Pure Dashboard Event Scheduling Rules

Pure mathematical algorithms for event prioritization, throttling, batching, and duplicate merging.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging, uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from dashboard_scheduler_models import DashboardBatch, ScheduledDashboardEvent

logger = logging.getLogger("dashboard_scheduler_rules")


def event_priority(event_type: str) -> int:
    """Return priority integer for event category (1=highest, 5=lowest)."""
    ev = event_type.strip().lower()
    if ev in ("watchlist_tick", "quote_tick"):
        return 1
    elif ev in ("market_overview_tick", "market_overview"):
        return 2
    elif ev in ("telemetry_update", "telemetry"):
        return 3
    elif ev in ("provider_health", "health"):
        return 4
    elif ev in ("ai_analysis_refresh", "ai_analysis"):
        return 5
    return 3


def throttle_interval(event_type: str) -> float:
    """Return minimum throttle interval in seconds before allowing next emit."""
    ev = event_type.strip().lower()
    if ev in ("watchlist_tick", "quote_tick"):
        return 0.1  # 100ms batch window
    elif ev in ("telemetry_update", "telemetry"):
        return 1.0  # 1 second
    elif ev in ("market_overview_tick", "market_overview"):
        return 5.0  # 5 seconds
    elif ev in ("ai_analysis_refresh", "ai_analysis"):
        return 30.0  # 30 seconds
    elif ev in ("provider_health", "health"):
        return 0.5  # 500ms debounce
    return 1.0


def should_emit(
    event_type: str,
    last_emit_timestamp: Optional[str],
    current_timestamp: str,
) -> bool:
    """Determine if enough time has elapsed since last emit according to throttle rules."""
    if not last_emit_timestamp:
        return True

    min_interval = throttle_interval(event_type)
    try:
        last_dt = datetime.fromisoformat(last_emit_timestamp)
        curr_dt = datetime.fromisoformat(current_timestamp)
        elapsed = (curr_dt - last_dt).total_seconds()
        return elapsed >= min_interval
    except Exception:
        return True


def should_batch(event_type: str) -> bool:
    """Determine if an event type should be collected into high-frequency batches."""
    ev = event_type.strip().lower()
    return ev in ("watchlist_tick", "quote_tick")


def coalesce_events(events: List[ScheduledDashboardEvent]) -> List[ScheduledDashboardEvent]:
    """Merge duplicate events for the same symbol in a batch, retaining newest tick."""
    if not events:
        return []

    symbol_map: Dict[str, ScheduledDashboardEvent] = {}
    non_symbol_events: List[ScheduledDashboardEvent] = []

    for ev in events:
        sym = ev.payload.get("symbol") if isinstance(ev.payload, dict) else None
        if sym:
            sym_upper = str(sym).upper()
            # Retain newest event for symbol
            symbol_map[sym_upper] = ev
        else:
            non_symbol_events.append(ev)

    coalesced = list(symbol_map.values()) + non_symbol_events
    # Sort by priority
    coalesced.sort(key=lambda x: x.priority)
    return coalesced


def batch_events(
    events: List[ScheduledDashboardEvent],
    max_batch_size: int = 50,
) -> DashboardBatch:
    """Combine a list of scheduled events into a DashboardBatch."""
    coalesced = coalesce_events(events)
    trimmed = coalesced[:max_batch_size]

    batch_id = f"batch-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    return DashboardBatch(
        batch_id=batch_id,
        events=trimmed,
        created_at=now_iso,
    )
