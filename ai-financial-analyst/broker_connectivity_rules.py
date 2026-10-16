"""
broker_connectivity_rules.py — Pure Broker Connectivity Mathematical Rules & Algorithms

Contains pure functions for broker connection validation, heartbeat processing,
health score computation, automatic failover selection, capability matching, and session expiration.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from broker_connectivity_models import (
    BrokerCapability,
    BrokerConnection,
    BrokerHeartbeat,
    BrokerState,
)

logger = logging.getLogger("broker_connectivity_rules")


def validate_connection(connection: Any) -> Tuple[bool, str]:
    """Validate broker connection envelope and health parameters."""
    if not connection:
        return (False, "Null broker connection object.")

    status = getattr(connection, "status", "DISCONNECTED").strip().upper()
    if status == BrokerState.FAILED.value:
        return (False, f"Broker connection '{getattr(connection, 'broker_name', 'UNKNOWN')}' is in FAILED state.")

    return (True, "")


def heartbeat(broker_name: str, latency_ms: float) -> BrokerHeartbeat:
    """Create a BrokerHeartbeat measurement envelope."""
    now_iso = datetime.now(timezone.utc).isoformat()
    status = "HEALTHY" if latency_ms < 100.0 else ("DEGRADED" if latency_ms < 300.0 else "UNHEALTHY")

    return BrokerHeartbeat(
        heartbeat_id=f"hb-{uuid.uuid4().hex[:6]}",
        broker_name=broker_name,
        timestamp=now_iso,
        latency_ms=latency_ms,
        status=status,
    )


def connection_health(latency_ms: float, reconnect_count: int) -> float:
    """Calculate 0-100 connection health score based on latency and reconnect count."""
    score = 100.0

    # Latency penalty
    if latency_ms > 50.0:
        score -= min(40.0, (latency_ms - 50.0) * 0.4)

    # Reconnect penalty
    score -= min(50.0, reconnect_count * 10.0)

    return round(max(0.0, score), 1)


def reconnect_required(status: str, missed_heartbeats: int) -> bool:
    """Determine if automated connection re-establishment is required."""
    st = status.strip().upper()
    if st in (BrokerState.DISCONNECTED.value, BrokerState.FAILED.value):
        return True
    if missed_heartbeats >= 3:
        return True
    return False


def failover_broker(connections: List[Any]) -> Optional[Any]:
    """Select healthiest alternative failover broker connection if primary fails."""
    candidates = [
        c for c in connections
        if getattr(c, "status", "") == BrokerState.CONNECTED.value and not getattr(c, "is_primary", False)
    ]

    if not candidates:
        return None

    # Return connection with lowest latency
    return min(candidates, key=lambda c: getattr(c, "latency_ms", 999.0))


def capability_match(capability: Any, required_feature: str) -> bool:
    """Validate if a broker's capability supports a required order feature."""
    if not capability:
        return True  # Assume paper broker supports feature by default

    req = required_feature.strip().lower()
    if req == "fractional":
        return getattr(capability, "supports_fractional", True)
    if req == "shorting":
        return getattr(capability, "supports_shorting", True)
    if req == "stop_limit":
        return getattr(capability, "supports_stop_limit", True)

    return True


def session_expired(expires_at_iso: str) -> bool:
    """Check if broker auth session token has expired."""
    if not expires_at_iso:
        return False
    try:
        exp_dt = datetime.fromisoformat(expires_at_iso.replace("Z", "+00:00"))
        now_dt = datetime.now(timezone.utc)
        return now_dt >= exp_dt
    except Exception:
        return False


def connection_summary(connections: List[Any]) -> Dict[str, Any]:
    """Generate aggregate connection health summary dictionary."""
    tot = len(connections)
    connected = len([c for c in connections if getattr(c, "status", "") == BrokerState.CONNECTED.value])
    primary = next((c for c in connections if getattr(c, "is_primary", False)), None)
    failover = next((c for c in connections if getattr(c, "is_failover", False)), None)

    avg_lat = sum(getattr(c, "latency_ms", 0.0) for c in connections) / tot if tot > 0 else 0.0

    return {
        "total_configured": tot,
        "active_connected": connected,
        "primary_broker": getattr(primary, "broker_name", "N/A") if primary else "N/A",
        "failover_broker": getattr(failover, "broker_name", "N/A") if failover else "N/A",
        "average_latency_ms": round(avg_lat, 2),
    }
