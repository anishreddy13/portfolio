"""
audit_engine.py — Production-Grade Enterprise Audit & Event Sourcing Engine

Immutable, append-only system of record. Captures every critical business event across
SignalEngine, PortfolioConstructionEngine, ComplianceEngine, OrderManagementSystem,
ExecutionManager, and PortfolioManager. Features cryptographic SHA-256 hash chain verification.
"""

from __future__ import annotations

import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from audit_models import (
    AuditEvent,
    AuditFilter,
    AuditStatistics,
    AuditTimeline,
)
from audit_rules import (
    create_event,
    filter_events,
    group_events,
    timeline,
    verify_integrity,
)

# Late-bound import to avoid circular dependency at module level
_observability_engine = None


def _get_obs_engine():
    global _observability_engine
    if _observability_engine is None:
        try:
            from observability_engine import global_observability_engine
            _observability_engine = global_observability_engine
        except ImportError:
            _observability_engine = None
    return _observability_engine


logger = logging.getLogger("audit_engine")


class AuditEngine:
    """Production-Grade Enterprise Audit & Event Sourcing Engine.

    Usage::

        engine = AuditEngine()
        event = engine.record(
            subsystem="SIGNAL_ENGINE",
            event_type="SIGNAL_GENERATED",
            severity="INFO",
            symbol="AAPL",
            payload={"direction": "BUY", "strength": 0.88}
        )
        print(event.event_id, event.hash_signature)
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()

        # Append-Only Event Log: list of AuditEvent
        self._event_log: List[AuditEvent] = []
        self._last_hash: str = "GENESIS"

        # Operational Statistics
        self._total_events = 0
        self._verifications_passed = 0
        self._total_payload_bytes = 0

        # Seed initial system boot audit event
        self._seed_genesis_event()

        logger.info("AuditEngine subsystem initialized with cryptographic hash chain.")

    # ─────────────────────────────────────────────
    # Append-Only Event Recording API
    # ─────────────────────────────────────────────

    def record(
        self,
        subsystem: str,
        event_type: str,
        severity: str = "INFO",
        symbol: str = "",
        portfolio_id: str = "",
        order_id: str = "",
        strategy_name: str = "",
        payload: Optional[Dict[str, Any]] = None,
    ) -> AuditEvent:
        """Record an immutable business event into the append-only audit log."""
        p_dict = payload or {}

        import time
        start_t = time.monotonic()
        with self._lock:
            evt = create_event(
                subsystem=subsystem,
                event_type=event_type,
                severity=severity,
                symbol=symbol,
                portfolio_id=portfolio_id,
                order_id=order_id,
                strategy_name=strategy_name,
                payload=p_dict,
                previous_hash=self._last_hash,
            )

            self._event_log.append(evt)
            self._last_hash = evt.hash_signature

            self._total_events += 1
            self._total_payload_bytes += len(str(evt.payload))

        lat_ms = (time.monotonic() - start_t) * 1000.0
        obs = _get_obs_engine()
        if obs is not None and subsystem != "OBSERVABILITY_ENGINE":
            obs.record("AUDIT_ENGINE", "audit_write_latency_ms", lat_ms)

        logger.info(
            "Recorded AuditEvent '%s' [%s:%s] for %s (hash=%s...)",
            evt.event_id, subsystem, event_type, symbol or "N/A", evt.hash_signature[:8]
        )
        return evt

    # ─────────────────────────────────────────────
    # Query & Timeline API
    # ─────────────────────────────────────────────

    def query(
        self,
        subsystem: Optional[str] = None,
        event_type: Optional[str] = None,
        symbol: Optional[str] = None,
        portfolio_id: Optional[str] = None,
        order_id: Optional[str] = None,
        severity: Optional[str] = None,
    ) -> List[AuditEvent]:
        """Query event log matching filter parameters."""
        f = AuditFilter(
            subsystem=subsystem,
            event_type=event_type,
            symbol=symbol,
            portfolio_id=portfolio_id,
            order_id=order_id,
            severity=severity,
        )

        with self._lock:
            return filter_events(self._event_log, f)

    def timeline(
        self,
        symbol: Optional[str] = None,
        portfolio_id: Optional[str] = None,
    ) -> AuditTimeline:
        """Generate verified AuditTimeline envelope."""
        with self._lock:
            filtered = self.query(symbol=symbol, portfolio_id=portfolio_id)
            return timeline(filtered)

    def verify(self) -> Tuple[bool, int]:
        """Verify cryptographic SHA-256 hash chain integrity of the entire event log."""
        with self._lock:
            valid, count = verify_integrity(self._event_log)
            if valid:
                self._verifications_passed += 1
            return (valid, count)

    def clear_cache(self) -> None:
        """Clear query cache (noop for append-only in-memory log)."""
        logger.info("AuditEngine cache cleared.")

    # ─────────────────────────────────────────────
    # Statistics API
    # ─────────────────────────────────────────────

    def statistics(self) -> AuditStatistics:
        """Return operational AuditStatistics snapshot."""
        with self._lock:
            subsystems = len(group_events(self._event_log, "subsystem"))
            avg_size = (self._total_payload_bytes // self._total_events) if self._total_events > 0 else 0
            return AuditStatistics(
                total_events_recorded=self._total_events,
                subsystems_active=subsystems,
                integrity_verifications_passed=self._verifications_passed,
                average_event_size_bytes=avg_size,
            )

    # ─────────────────────────────────────────────
    # Internal Seed
    # ─────────────────────────────────────────────

    def _seed_genesis_event(self) -> None:
        """Seed initial GENESIS event in the audit log."""
        evt = create_event(
            subsystem="SYSTEM",
            event_type="GENESIS_BOOT",
            severity="INFO",
            payload={"message": "Enterprise Audit & Event Sourcing Engine initialized."},
            previous_hash="GENESIS",
        )
        self._event_log.append(evt)
        self._last_hash = evt.hash_signature
        self._total_events = 1


# Shared global singleton instance
global_audit_engine = AuditEngine()
