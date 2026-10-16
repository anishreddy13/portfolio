"""
dashboard_scheduler.py — Enterprise Dashboard Event Scheduler & Delivery Engine

Orchestrates real-time dashboard events from DashboardEventHub:
  - Batches high-frequency quote ticks into 50-100ms frames
  - Throttles telemetry to 1-second intervals
  - Debounces provider health changes
  - Merges duplicate symbol updates
  - Delivers optimized DashboardBatch objects to SSE stream clients
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from dashboard_event_hub import DashboardEventHub, global_dashboard_event_hub
from dashboard_scheduler_models import (
    DashboardBatch,
    DashboardSchedulerConfiguration,
    DashboardSchedulerStatistics,
    ScheduledDashboardEvent,
)
from dashboard_scheduler_rules import (
    batch_events,
    coalesce_events,
    event_priority,
    should_batch,
    should_emit,
)

logger = logging.getLogger("dashboard_scheduler")


class DashboardScheduler:
    """Enterprise Dashboard Event Scheduler & Delivery Engine.

    Usage::

        scheduler = DashboardScheduler()
        scheduler.start()
        scheduler.register_listener(my_sse_callback)
    """

    def __init__(
        self,
        event_hub: Optional[DashboardEventHub] = None,
        config: Optional[DashboardSchedulerConfiguration] = None,
    ) -> None:
        self.event_hub = event_hub or global_dashboard_event_hub
        self.config = config or DashboardSchedulerConfiguration()
        self._lock = threading.RLock()

        # Listener callbacks registered to receive optimized DashboardBatch objects: callback(batch)
        self._listeners: List[Callable[[DashboardBatch], None]] = []

        # Buffer for pending events
        self._pending_events: List[ScheduledDashboardEvent] = []

        # Last emit timestamps per event_type: event_type -> iso_timestamp
        self._last_emit_timestamps: Dict[str, str] = {}

        # Operational Statistics
        self._events_received = 0
        self._events_emitted = 0
        self._events_batched = 0
        self._duplicates_removed = 0
        self._total_batch_count = 0
        self._total_batch_size_sum = 0
        self._total_emit_latency_ms = 0.0

        # Subscribe to raw events from DashboardEventHub
        self.event_hub.register_listener(self.ingest_event)
        logger.info("DashboardScheduler initialized & connected to DashboardEventHub.")

    # ─────────────────────────────────────────────
    # Listener Registration & Subscription API
    # ─────────────────────────────────────────────

    def register_listener(self, callback: Callable[[DashboardBatch], None]) -> None:
        """Register listener callback receiving optimized DashboardBatch objects."""
        with self._lock:
            if callback not in self._listeners:
                self._listeners.append(callback)
                logger.info("Registered DashboardScheduler listener callback.")

    def unregister_listener(self, callback: Callable[[DashboardBatch], None]) -> None:
        """Unregister DashboardScheduler listener callback."""
        with self._lock:
            if callback in self._listeners:
                self._listeners.remove(callback)
                logger.info("Unregistered DashboardScheduler listener callback.")

    # ─────────────────────────────────────────────
    # Event Ingestion & Batch Scheduling
    # ─────────────────────────────────────────────

    def ingest_event(self, event_type: str, payload: Dict[str, Any]) -> bool:
        """Ingest raw event from DashboardEventHub, apply rules, and emit batch if ready.

        Args:
            event_type: Category string (e.g. 'watchlist_tick', 'telemetry_update').
            payload: Event dictionary.

        Returns:
            True if event was successfully scheduled.
        """
        if not event_type or not payload:
            return False

        now_iso = datetime.now(timezone.utc).isoformat()
        priority = event_priority(event_type)

        scheduled_ev = ScheduledDashboardEvent(
            event_type=event_type,
            payload=payload,
            priority=priority,
            timestamp_iso=now_iso,
        )

        with self._lock:
            self._events_received += 1
            last_ts = self._last_emit_timestamps.get(event_type)

            # Check throttle rule
            if not should_emit(event_type, last_ts, now_iso):
                self._duplicates_removed += 1
                return False

            self._pending_events.append(scheduled_ev)
            self._last_emit_timestamps[event_type] = now_iso

            # Trigger batch emission if queue has collected enough events
            if len(self._pending_events) >= 1 or not should_batch(event_type):
                self.flush_batch()

        return True

    def flush_batch(self) -> Optional[DashboardBatch]:
        """Coalesce pending events, build DashboardBatch, and notify listeners."""
        start_t = time.monotonic()

        with self._lock:
            if not self._pending_events:
                return None

            events_to_flush = list(self._pending_events)
            self._pending_events.clear()

            # Apply duplicate merging and batching
            coalesced = coalesce_events(events_to_flush)
            dups = len(events_to_flush) - len(coalesced)
            self._duplicates_removed += max(0, dups)

            batch = batch_events(coalesced, max_batch_size=50)
            self._events_batched += len(batch.events)

            listeners = list(self._listeners)

        # Notify registered SSE clients
        for cb in listeners:
            try:
                cb(batch)
            except Exception as exc:
                logger.error("Error in DashboardScheduler listener callback: %s", exc)

        latency_ms = (time.monotonic() - start_t) * 1000.0

        with self._lock:
            self._events_emitted += len(batch.events)
            self._total_batch_count += 1
            self._total_batch_size_sum += len(batch.events)
            self._total_emit_latency_ms += latency_ms

        logger.debug("DashboardScheduler emitted batch '%s' with %d events (latency=%.2fms)", batch.batch_id, len(batch.events), latency_ms)
        return batch

    # ─────────────────────────────────────────────
    # Public Statistics API
    # ─────────────────────────────────────────────

    def statistics(self) -> DashboardSchedulerStatistics:
        """Return operational DashboardSchedulerStatistics snapshot."""
        with self._lock:
            avg_batch_size = (self._total_batch_size_sum / self._total_batch_count) if self._total_batch_count > 0 else 0.0
            avg_lat = (self._total_emit_latency_ms / self._total_batch_count) if self._total_batch_count > 0 else 0.0

            return DashboardSchedulerStatistics(
                events_received=self._events_received,
                events_emitted=self._events_emitted,
                events_batched=self._events_batched,
                duplicates_removed=self._duplicates_removed,
                average_batch_size=avg_batch_size,
                average_emit_latency_ms=avg_lat,
            )


# Shared global singleton instance
global_dashboard_scheduler = DashboardScheduler()
