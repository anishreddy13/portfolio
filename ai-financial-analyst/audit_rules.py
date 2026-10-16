"""
audit_rules.py — Pure Audit & Event Sourcing Mathematical Rules & Cryptographic Logic

Contains pure functions for event creation, hash signature calculation (SHA-256 chain verification),
JSON serialization, event filtering, timeline construction, and append-only integrity checks.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import hashlib
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

from audit_models import AuditEvent, AuditFilter, AuditTimeline

logger = logging.getLogger("audit_rules")


def event_hash(event_data: Dict[str, Any]) -> str:
    """Calculate deterministic SHA-256 hash signature for an audit event payload."""
    canonical_json = json.dumps(event_data, sort_keys=True, default=str)
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()


def create_event(
    subsystem: str,
    event_type: str,
    severity: str = "INFO",
    symbol: str = "",
    portfolio_id: str = "",
    order_id: str = "",
    strategy_name: str = "",
    payload: Dict[str, Any] = None,
    previous_hash: str = "GENESIS",
) -> AuditEvent:
    """Create a cryptographically signed, immutable AuditEvent envelope."""
    event_id = f"evt-{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    p_data = payload or {}

    raw_dict = {
        "event_id": event_id,
        "timestamp": now_iso,
        "subsystem": subsystem,
        "event_type": event_type,
        "severity": severity,
        "symbol": symbol,
        "portfolio_id": portfolio_id,
        "order_id": order_id,
        "strategy_name": strategy_name,
        "payload": p_data,
        "previous_hash": previous_hash,
    }

    h_sig = event_hash(raw_dict)

    return AuditEvent(
        event_id=event_id,
        timestamp=now_iso,
        subsystem=subsystem,
        event_type=event_type,
        severity=severity,
        symbol=symbol,
        portfolio_id=portfolio_id,
        order_id=order_id,
        strategy_name=strategy_name,
        payload=p_data,
        hash_signature=h_sig,
        previous_hash=previous_hash,
    )


def validate_event(event: AuditEvent) -> Tuple[bool, str]:
    """Validate structure and signature of an AuditEvent."""
    if not event.event_id or not event.subsystem or not event.event_type:
        return (False, "Missing required AuditEvent envelope fields.")

    raw_dict = {
        "event_id": event.event_id,
        "timestamp": event.timestamp,
        "subsystem": event.subsystem,
        "event_type": event.event_type,
        "severity": event.severity,
        "symbol": event.symbol,
        "portfolio_id": event.portfolio_id,
        "order_id": event.order_id,
        "strategy_name": event.strategy_name,
        "payload": event.payload,
        "previous_hash": event.previous_hash,
    }

    computed_h = event_hash(raw_dict)
    if computed_h != event.hash_signature:
        return (False, f"Hash signature mismatch for event '{event.event_id}'. Event may be tampered.")

    return (True, "")


def serialize_event(event: AuditEvent) -> str:
    """Serialize AuditEvent to JSON string."""
    return json.dumps(event.to_dict(), default=str)


def deserialize_event(json_str: str) -> AuditEvent:
    """Deserialize JSON string back into AuditEvent object."""
    data = json.loads(json_str)
    return AuditEvent(
        event_id=data["event_id"],
        timestamp=data["timestamp"],
        subsystem=data["subsystem"],
        event_type=data["event_type"],
        severity=data["severity"],
        symbol=data.get("symbol", ""),
        portfolio_id=data.get("portfolio_id", ""),
        order_id=data.get("order_id", ""),
        strategy_name=data.get("strategy_name", ""),
        payload=data.get("payload", {}),
        hash_signature=data.get("hash_signature", ""),
        previous_hash=data.get("previous_hash", "GENESIS"),
    )


def verify_integrity(events: List[AuditEvent]) -> Tuple[bool, int]:
    """Verify cryptographic SHA-256 hash chain across the append-only event stream.

    Returns: (is_valid, verified_count)
    """
    if not events:
        return (True, 0)

    prev_h = "GENESIS"
    for i, evt in enumerate(events):
        valid, msg = validate_event(evt)
        if not valid:
            logger.error("Audit chain integrity breach at index %d: %s", i, msg)
            return (False, i)

        if evt.previous_hash != prev_h and i > 0:
            logger.error("Audit hash chain broken at index %d. Expected prev=%s, got %s", i, prev_h, evt.previous_hash)
            return (False, i)

        prev_h = evt.hash_signature

    return (True, len(events))


def filter_events(events: List[AuditEvent], filter_params: AuditFilter) -> List[AuditEvent]:
    """Filter list of AuditEvent items based on AuditFilter criteria."""
    result = list(events)

    if filter_params.subsystem:
        target = filter_params.subsystem.strip().upper()
        result = [e for e in result if e.subsystem.strip().upper() == target]

    if filter_params.event_type:
        target = filter_params.event_type.strip().upper()
        result = [e for e in result if e.event_type.strip().upper() == target]

    if filter_params.symbol:
        target = filter_params.symbol.strip().upper()
        result = [e for e in result if e.symbol.strip().upper() == target]

    if filter_params.portfolio_id:
        target = filter_params.portfolio_id.strip()
        result = [e for e in result if e.portfolio_id.strip() == target]

    if filter_params.order_id:
        target = filter_params.order_id.strip()
        result = [e for e in result if e.order_id.strip() == target]

    if filter_params.severity:
        target = filter_params.severity.strip().upper()
        result = [e for e in result if e.severity.strip().upper() == target]

    return result


def group_events(events: List[AuditEvent], key: str = "subsystem") -> Dict[str, List[AuditEvent]]:
    """Group events by a specified key field."""
    grouped: Dict[str, List[AuditEvent]] = {}
    for e in events:
        val = str(getattr(e, key, "UNKNOWN")).strip().upper()
        if val not in grouped:
            grouped[val] = []
        grouped[val].append(e)
    return grouped


def timeline(events: List[AuditEvent]) -> AuditTimeline:
    """Construct verified AuditTimeline envelope from event stream."""
    valid, count = verify_integrity(events)
    now_iso = datetime.now(timezone.utc).isoformat()
    return AuditTimeline(
        timeline_id=f"time-{uuid.uuid4().hex[:8]}",
        events=events,
        total_count=len(events),
        hash_chain_valid=valid,
        timestamp=now_iso,
    )


def event_summary(events: List[AuditEvent]) -> Dict[str, Any]:
    """Summarize event types, counts, and severity distribution."""
    by_subsystem = group_events(events, "subsystem")
    by_severity = group_events(events, "severity")

    return {
        "total_events": len(events),
        "subsystems_count": len(by_subsystem),
        "severities": {k: len(v) for k, v in by_severity.items()},
        "subsystems": {k: len(v) for k, v in by_subsystem.items()},
    }
