"""
dashboard_scheduler_models.py — Data Models for Dashboard Event Scheduling & Delivery

Defines ScheduledDashboardEvent, DashboardBatch, DashboardSchedulerStatistics,
and DashboardSchedulerConfiguration dataclasses with JSON serialization support.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class ScheduledDashboardEvent:
    """Represents a single scheduled dashboard event item.

    Attributes:
        event_type: Event category string (e.g. 'watchlist_tick', 'telemetry_update').
        payload: Event payload dictionary.
        priority: Priority integer (1=highest, 5=lowest).
        timestamp_iso: ISO timestamp of event creation.
    """
    event_type: str
    payload: Dict[str, Any]
    priority: int = 1
    timestamp_iso: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert ScheduledDashboardEvent to clean dictionary."""
        return {
            "event_type": self.event_type,
            "payload": self.payload,
            "priority": self.priority,
            "timestamp_iso": self.timestamp_iso,
        }


@dataclass
class DashboardBatch:
    """Represents a coalesced & batched frame of outbound dashboard events.

    Attributes:
        batch_id: Unique batch identifier string.
        events: List of ScheduledDashboardEvent items in the batch.
        created_at: ISO timestamp of batch creation.
    """
    batch_id: str
    events: List[ScheduledDashboardEvent] = field(default_factory=list)
    created_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert DashboardBatch to clean dictionary."""
        return {
            "batch_id": self.batch_id,
            "events": [e.to_dict() for e in self.events],
            "created_at": self.created_at,
        }


@dataclass
class DashboardSchedulerStatistics:
    """Operational metrics tracking the Dashboard Event Scheduler.

    Attributes:
        events_received: Total raw events ingested from DashboardEventHub.
        events_emitted: Total optimized events emitted to SSE stream clients.
        events_batched: Total events combined into batches.
        duplicates_removed: Total duplicate/redundant events merged.
        average_batch_size: Average number of events per emitted batch.
        average_emit_latency_ms: Average emit scheduling latency in ms.
    """
    events_received: int = 0
    events_emitted: int = 0
    events_batched: int = 0
    duplicates_removed: int = 0
    average_batch_size: float = 0.0
    average_emit_latency_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert DashboardSchedulerStatistics to clean dictionary."""
        return {
            "events_received": self.events_received,
            "events_emitted": self.events_emitted,
            "events_batched": self.events_batched,
            "duplicates_removed": self.duplicates_removed,
            "average_batch_size": round(self.average_batch_size, 2),
            "average_emit_latency_ms": round(self.average_emit_latency_ms, 2),
        }


@dataclass
class DashboardSchedulerConfiguration:
    """Configuration rules for event throttling and batching intervals.

    Attributes:
        quote_batch_ms: Quote tick batch window in ms (default 100ms).
        telemetry_interval_ms: Telemetry throttle interval in ms (default 1000ms).
        health_debounce_ms: Provider health debounce interval in ms (default 500ms).
        ai_analysis_interval_ms: AI analysis refresh interval in ms (default 30000ms).
        market_overview_interval_ms: Market overview throttle interval in ms (default 5000ms).
    """
    quote_batch_ms: int = 100
    telemetry_interval_ms: int = 1000
    health_debounce_ms: int = 500
    ai_analysis_interval_ms: int = 30000
    market_overview_interval_ms: int = 5000

    def to_dict(self) -> Dict[str, Any]:
        """Convert DashboardSchedulerConfiguration to clean dictionary."""
        return {
            "quote_batch_ms": self.quote_batch_ms,
            "telemetry_interval_ms": self.telemetry_interval_ms,
            "health_debounce_ms": self.health_debounce_ms,
            "ai_analysis_interval_ms": self.ai_analysis_interval_ms,
            "market_overview_interval_ms": self.market_overview_interval_ms,
        }
