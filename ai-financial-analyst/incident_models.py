"""
incident_models.py — Data Models for Enterprise Alerting & Incident Response Engine

Defines Incident, IncidentRule, IncidentEvent, IncidentTimeline,
IncidentEscalation, and IncidentStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class IncidentStatus(str, Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"


class EscalationLevel(str, Enum):
    LEVEL_1_ONCALL = "LEVEL_1_ONCALL"
    LEVEL_2_QUANT_SRE = "LEVEL_2_QUANT_SRE"
    LEVEL_3_CHIEF_RISK_OFFICER = "LEVEL_3_CHIEF_RISK_OFFICER"


@dataclass
class IncidentEvent:
    """Audit entry in an incident's lifecycle timeline."""
    event_id: str
    incident_id: str
    timestamp: str
    event_type: str  # OPENED, ACKNOWLEDGED, ESCALATED, RESOLVED, COMMENTED
    description: str
    actor: str = "SYSTEM"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "incident_id": self.incident_id,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "description": self.description,
            "actor": self.actor,
        }


@dataclass
class IncidentEscalation:
    """Escalation policy mapping for automated alerting."""
    level: str
    escalate_after_seconds: int
    target_role: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "level": self.level,
            "escalate_after_seconds": self.escalate_after_seconds,
            "target_role": self.target_role,
        }


@dataclass
class IncidentRule:
    """Automated incident handling policy rule."""
    rule_id: str
    subsystem: str
    auto_escalate_severity: str = "CRITICAL"
    auto_resolve_timeout_sec: int = 3600

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "subsystem": self.subsystem,
            "auto_escalate_severity": self.auto_escalate_severity,
            "auto_resolve_timeout_sec": self.auto_resolve_timeout_sec,
        }


@dataclass
class Incident:
    """Full incident tracking record."""
    incident_id: str
    alert_id: str
    subsystem: str
    title: str
    description: str
    severity: str
    status: str = "OPEN"
    owner: str = "UNASSIGNED"
    created_at: str = ""
    acknowledged_at: Optional[str] = None
    resolved_at: Optional[str] = None
    escalation_level: str = "LEVEL_1_ONCALL"
    timeline: List[IncidentEvent] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "incident_id": self.incident_id,
            "alert_id": self.alert_id,
            "subsystem": self.subsystem,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "status": self.status,
            "owner": self.owner,
            "created_at": self.created_at,
            "acknowledged_at": self.acknowledged_at,
            "resolved_at": self.resolved_at,
            "escalation_level": self.escalation_level,
            "timeline": [e.to_dict() for e in self.timeline],
        }


@dataclass
class IncidentTimeline:
    """Timeline envelope wrapping chronological events of an incident."""
    timeline_id: str
    incident_id: str
    events: List[IncidentEvent] = field(default_factory=list)
    created_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timeline_id": self.timeline_id,
            "incident_id": self.incident_id,
            "events": [e.to_dict() for e in self.events],
            "created_at": self.created_at,
        }


@dataclass
class IncidentStatistics:
    """Operational metrics for IncidentEngine."""
    total_incidents_opened: int = 0
    active_incidents_count: int = 0
    acknowledged_count: int = 0
    resolved_count: int = 0
    mtta_seconds: float = 45.0  # Mean Time To Acknowledge
    mttr_seconds: float = 320.0  # Mean Time To Resolve

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_incidents_opened": self.total_incidents_opened,
            "active_incidents_count": self.active_incidents_count,
            "acknowledged_count": self.acknowledged_count,
            "resolved_count": self.resolved_count,
            "mtta_seconds": round(self.mtta_seconds, 1),
            "mttr_seconds": round(self.mttr_seconds, 1),
        }
