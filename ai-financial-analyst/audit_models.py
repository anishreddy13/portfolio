"""
audit_models.py — Data Models for Enterprise Audit & Event Sourcing Engine

Defines AuditEvent, AuditMetadata, AuditSession, AuditFilter, AuditTimeline,
and AuditStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class AuditSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class AuditMetadata:
    """Metadata attached to an immutable audit event."""
    session_id: str = "default_session"
    user_id: str = "system"
    source_ip: str = "127.0.0.1"
    client_version: str = "v1.0.0"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "source_ip": self.source_ip,
            "client_version": self.client_version,
        }


@dataclass
class AuditEvent:
    """Immutable Event envelope in the append-only event log."""
    event_id: str
    timestamp: str
    subsystem: str
    event_type: str
    severity: str
    symbol: str = ""
    portfolio_id: str = ""
    order_id: str = ""
    strategy_name: str = ""
    payload: Dict[str, Any] = field(default_factory=dict)
    hash_signature: str = ""
    previous_hash: str = "GENESIS"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "subsystem": self.subsystem,
            "event_type": self.event_type,
            "severity": self.severity,
            "symbol": self.symbol,
            "portfolio_id": self.portfolio_id,
            "order_id": self.order_id,
            "strategy_name": self.strategy_name,
            "payload": self.payload,
            "hash_signature": self.hash_signature,
            "previous_hash": self.previous_hash,
        }


@dataclass
class AuditSession:
    """Audit logging session container."""
    session_id: str
    started_at: str
    event_count: int = 0
    is_active: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "started_at": self.started_at,
            "event_count": self.event_count,
            "is_active": self.is_active,
        }


@dataclass
class AuditFilter:
    """Query filter parameters for searching audit logs."""
    subsystem: Optional[str] = None
    event_type: Optional[str] = None
    symbol: Optional[str] = None
    portfolio_id: Optional[str] = None
    order_id: Optional[str] = None
    severity: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "subsystem": self.subsystem,
            "event_type": self.event_type,
            "symbol": self.symbol,
            "portfolio_id": self.portfolio_id,
            "order_id": self.order_id,
            "severity": self.severity,
        }


@dataclass
class AuditTimeline:
    """Timeline envelope representing an ordered sequence of verified audit events."""
    timeline_id: str
    events: List[AuditEvent] = field(default_factory=list)
    total_count: int = 0
    hash_chain_valid: bool = True
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timeline_id": self.timeline_id,
            "events": [e.to_dict() for e in self.events],
            "total_count": self.total_count,
            "hash_chain_valid": self.hash_chain_valid,
            "timestamp": self.timestamp,
        }


@dataclass
class AuditStatistics:
    """Operational metrics for AuditEngine."""
    total_events_recorded: int = 0
    subsystems_active: int = 0
    integrity_verifications_passed: int = 0
    average_event_size_bytes: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_events_recorded": self.total_events_recorded,
            "subsystems_active": self.subsystems_active,
            "integrity_verifications_passed": self.integrity_verifications_passed,
            "average_event_size_bytes": self.average_event_size_bytes,
        }
