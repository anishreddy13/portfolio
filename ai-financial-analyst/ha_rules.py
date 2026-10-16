"""
ha_rules.py — Pure High Availability & Disaster Recovery Mathematical Rules & Algorithms

Contains pure functions for health probes, node leader election, failover necessity checks,
recovery prioritization, service dependency restart sequencing, and cluster health scoring.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from ha_models import HealthProbe, NodeRole, NodeStatus, ServiceNode

logger = logging.getLogger("ha_rules")

SERVICE_RESTART_PRIORITY = {
    "PERSISTENCE_MANAGER": 1,
    "AUDIT_ENGINE": 2,
    "BROKER_CONNECTIVITY": 3,
    "MARKET_DATA_SERVICE": 4,
    "STREAMING_MANAGER": 5,
    "CONSENSUS_ENGINE": 6,
    "COMPLIANCE_ENGINE": 7,
    "ORDER_MANAGEMENT": 8,
    "EXECUTION_MANAGER": 9,
    "PORTFOLIO_MANAGER": 10,
}


def health_probe(node_id: str, latency_ms: float) -> HealthProbe:
    """Create a diagnostic HealthProbe envelope."""
    now_iso = datetime.now(timezone.utc).isoformat()
    is_healthy = latency_ms < 250.0

    return HealthProbe(
        probe_id=f"probe-{uuid.uuid4().hex[:6]}",
        node_id=node_id,
        timestamp=now_iso,
        latency_ms=latency_ms,
        is_healthy=is_healthy,
        probe_type="HTTP_PING",
    )


def service_available(node: Any) -> bool:
    """Determine if a ServiceNode is ONLINE and available."""
    if not node:
        return False
    st = getattr(node, "status", "OFFLINE").strip().upper()
    return st == NodeStatus.ONLINE.value


def elect_primary(candidates: List[Any]) -> Optional[Any]:
    """Elect the highest priority healthy candidate node as new Primary leader."""
    online_candidates = [c for c in candidates if service_available(c)]
    if not online_candidates:
        return None

    # Elect candidate with highest priority (lowest numerical order or highest priority integer)
    return max(online_candidates, key=lambda c: getattr(c, "priority", 10))


def failover_required(primary_node: Any, missed_probes: int) -> bool:
    """Determine if primary node failover is mandatory."""
    if not primary_node:
        return True
    st = getattr(primary_node, "status", "").strip().upper()
    if st in (NodeStatus.OFFLINE.value, "FAILED"):
        return True
    if missed_probes >= 3:
        return True
    return False


def recovery_required(subsystem_health_score: float) -> bool:
    """Check if subsystem health score (<60.0) warrants automated disaster recovery."""
    return subsystem_health_score < 60.0


def recovery_priority(subsystem: str) -> int:
    """Return dependency restart priority rank for a subsystem (1 = highest)."""
    sub_clean = subsystem.strip().upper().replace("_ENGINE", "").replace("_SERVICE", "")
    return SERVICE_RESTART_PRIORITY.get(sub_clean, 50)


def restart_order(subsystems: List[str]) -> List[str]:
    """Sort list of failed subsystems by strict dependency restart sequence."""
    return sorted(subsystems, key=lambda s: recovery_priority(s))


def cluster_health(nodes: List[Any]) -> float:
    """Calculate 0-100 cluster availability health score."""
    if not nodes:
        return 100.0

    online_count = len([n for n in nodes if service_available(n)])
    return round((online_count / len(nodes)) * 100.0, 1)


def recovery_summary(plans: List[Any]) -> Dict[str, Any]:
    """Generate disaster recovery plan execution summary."""
    tot = len(plans)
    completed = len([p for p in plans if getattr(p, "status", "") == "COMPLETED"])
    executing = len([p for p in plans if getattr(p, "status", "") == "EXECUTING"])

    return {
        "total_plans": tot,
        "completed_recoveries": completed,
        "executing_recoveries": executing,
    }
