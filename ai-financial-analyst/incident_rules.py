"""
incident_rules.py — Pure Incident Response Mathematical Rules & Algorithms

Contains pure functions for incident creation, alert deduplication, severity mapping,
escalation policy rules, incident health scoring, and status summary aggregation.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from incident_models import (
    EscalationLevel,
    Incident,
    IncidentEscalation,
    IncidentEvent,
    IncidentStatus,
)

logger = logging.getLogger("incident_rules")


def incident_severity(alert_severity: str) -> str:
    """Normalize alert severity to incident severity rating."""
    sev = alert_severity.strip().upper()
    if sev in ("CRITICAL", "HIGH", "WARNING", "INFO"):
        return sev
    return "WARNING"


def escalation_policy(severity: str) -> IncidentEscalation:
    """Return escalation policy mapping based on severity."""
    sev = severity.strip().upper()
    if sev == "CRITICAL":
        return IncidentEscalation(
            level=EscalationLevel.LEVEL_3_CHIEF_RISK_OFFICER.value,
            escalate_after_seconds=300,  # 5 minutes
            target_role="Chief Risk Officer & Lead SRE",
        )
    if sev == "HIGH":
        return IncidentEscalation(
            level=EscalationLevel.LEVEL_2_QUANT_SRE.value,
            escalate_after_seconds=900,  # 15 minutes
            target_role="Quant Systems Engineer",
        )
    return IncidentEscalation(
        level=EscalationLevel.LEVEL_1_ONCALL.value,
        escalate_after_seconds=3600,  # 1 hour
        target_role="On-Call Operations Specialist",
    )


def create_incident(alert: Any) -> Incident:
    """Create a new Incident envelope from an ObservabilityEngine Alert object."""
    inc_id = f"inc-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    alert_id = getattr(alert, "alert_id", f"alt-{uuid.uuid4().hex[:6]}")
    sub = getattr(alert, "subsystem", "SYSTEM")
    msg = getattr(alert, "message", "System threshold breached")
    raw_sev = getattr(alert, "severity", "WARNING")
    sev = incident_severity(raw_sev)
    policy = escalation_policy(sev)

    initial_event = IncidentEvent(
        event_id=f"intevt-{uuid.uuid4().hex[:6]}",
        incident_id=inc_id,
        timestamp=now_iso,
        event_type="OPENED",
        description=f"Incident opened from alert '{alert_id}': {msg}",
        actor="AUTOMATED_MONITOR",
    )

    return Incident(
        incident_id=inc_id,
        alert_id=alert_id,
        subsystem=sub,
        title=f"[{sev}] Subsystem {sub} Breach",
        description=msg,
        severity=sev,
        status=IncidentStatus.OPEN.value,
        owner="UNASSIGNED",
        created_at=now_iso,
        escalation_level=policy.level,
        timeline=[initial_event],
    )


def merge_duplicate_incidents(existing: Incident, new_alert: Any) -> Incident:
    """Merge a duplicate alert into an existing active incident timeline."""
    now_iso = datetime.now(timezone.utc).isoformat()
    alt_id = getattr(new_alert, "alert_id", "alt-dup")
    msg = getattr(new_alert, "message", "")

    event = IncidentEvent(
        event_id=f"intevt-{uuid.uuid4().hex[:6]}",
        incident_id=existing.incident_id,
        timestamp=now_iso,
        event_type="DUPLICATE_ALERT_MERGED",
        description=f"Merged duplicate alert '{alt_id}': {msg}",
        actor="DEDUPLICATION_ENGINE",
    )
    existing.timeline.append(event)
    return existing


def should_escalate(incident: Incident, age_seconds: float) -> Tuple[bool, str]:
    """Determine if an unacknowledged/unresolved incident should escalate."""
    if incident.status in (IncidentStatus.RESOLVED.value, IncidentStatus.ESCALATED.value):
        return (False, "")

    policy = escalation_policy(incident.severity)
    if age_seconds > policy.escalate_after_seconds:
        return (True, f"Age ({age_seconds:.0f}s) exceeded policy escalation threshold ({policy.escalate_after_seconds}s). Escalating to {policy.target_role}.")

    return (False, "")


def should_resolve(incident: Incident, metric_recovered: bool) -> bool:
    """Determine if incident can be automatically resolved."""
    return metric_recovered and incident.status != IncidentStatus.RESOLVED.value


def deduplicate_alerts(alerts: List[Any]) -> List[Any]:
    """Filter duplicate alerts for the same subsystem within a short window."""
    seen: Dict[str, Any] = {}
    deduped = []
    for a in alerts:
        key = f"{getattr(a, 'subsystem', '')}:{getattr(a, 'rule_id', '')}"
        if key not in seen:
            seen[key] = a
            deduped.append(a)
    return deduped


def incident_health(incidents: List[Incident]) -> float:
    """Calculate 0-100 incident health index (higher is healthier)."""
    if not incidents:
        return 100.0

    active = [i for i in incidents if i.status != IncidentStatus.RESOLVED.value]
    if not active:
        return 100.0

    penalty = 0.0
    for i in active:
        if i.severity == "CRITICAL":
            penalty += 30.0
        elif i.severity == "HIGH":
            penalty += 15.0
        elif i.severity == "WARNING":
            penalty += 5.0

    return round(max(0.0, 100.0 - penalty), 1)


def incident_summary(incidents: List[Incident]) -> Dict[str, Any]:
    """Summarize incident status counts and ownership distribution."""
    total = len(incidents)
    open_cnt = len([i for i in incidents if i.status == IncidentStatus.OPEN.value])
    ack_cnt = len([i for i in incidents if i.status == IncidentStatus.ACKNOWLEDGED.value])
    esc_cnt = len([i for i in incidents if i.status == IncidentStatus.ESCALATED.value])
    res_cnt = len([i for i in incidents if i.status == IncidentStatus.RESOLVED.value])

    return {
        "total_incidents": total,
        "open": open_cnt,
        "acknowledged": ack_cnt,
        "escalated": esc_cnt,
        "resolved": res_cnt,
        "health_index": incident_health(incidents),
    }
