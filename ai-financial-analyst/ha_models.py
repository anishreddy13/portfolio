"""
ha_models.py — Data Models for Enterprise High Availability & Disaster Recovery Engine

Defines ServiceNode, ClusterMember, HealthProbe, RecoveryPlan, RecoveryEvent,
FailoverDecision, and HAStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class NodeRole(str, Enum):
    PRIMARY = "PRIMARY"
    STANDBY = "STANDBY"
    REPLICA = "REPLICA"


class NodeStatus(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    DEGRADED = "DEGRADED"


@dataclass
class HealthProbe:
    """Diagnostic health probe measurement."""
    probe_id: str
    node_id: str
    timestamp: str
    latency_ms: float
    is_healthy: bool = True
    probe_type: str = "PING"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "probe_id": self.probe_id,
            "node_id": self.node_id,
            "timestamp": self.timestamp,
            "latency_ms": round(self.latency_ms, 2),
            "is_healthy": self.is_healthy,
            "probe_type": self.probe_type,
        }


@dataclass
class ServiceNode:
    """Infrastructure service node envelope."""
    node_id: str
    node_name: str
    role: str = "STANDBY"
    status: str = "ONLINE"
    ip_address: str = "10.0.1.10"
    region: str = "us-east-1"
    last_seen: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "node_name": self.node_name,
            "role": self.role,
            "status": self.status,
            "ip_address": self.ip_address,
            "region": self.region,
            "last_seen": self.last_seen,
        }


@dataclass
class ClusterMember:
    """Cluster membership state and election parameters."""
    member_id: str
    node_id: str
    is_leader: bool = False
    priority: int = 100
    term: int = 1

    def to_dict(self) -> Dict[str, Any]:
        return {
            "member_id": self.member_id,
            "node_id": self.node_id,
            "is_leader": self.is_leader,
            "priority": self.priority,
            "term": self.term,
        }


@dataclass
class RecoveryEvent:
    """Single step audit entry in a recovery plan execution."""
    event_id: str
    plan_id: str
    timestamp: str
    action_type: str
    description: str
    status: str = "COMPLETED"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "plan_id": self.plan_id,
            "timestamp": self.timestamp,
            "action_type": self.action_type,
            "description": self.description,
            "status": self.status,
        }


@dataclass
class RecoveryPlan:
    """Automated disaster recovery plan definition."""
    plan_id: str
    target_subsystem: str
    steps: List[str]
    priority: int = 1
    status: str = "IDLE"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "plan_id": self.plan_id,
            "target_subsystem": self.target_subsystem,
            "steps": self.steps,
            "priority": self.priority,
            "status": self.status,
        }


@dataclass
class FailoverDecision:
    """Audit record of a leader election / node failover event."""
    decision_id: str
    failed_node_id: str
    elected_node_id: str
    reason: str
    timestamp: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "decision_id": self.decision_id,
            "failed_node_id": self.failed_node_id,
            "elected_node_id": self.elected_node_id,
            "reason": self.reason,
            "timestamp": self.timestamp,
        }


@dataclass
class HAStatistics:
    """Operational statistics for HighAvailabilityEngine."""
    total_nodes: int = 0
    active_primary_node: str = "node-us-east-1a"
    standby_nodes_count: int = 0
    cluster_uptime_pct: float = 99.99
    total_failovers: int = 0
    total_recoveries: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_nodes": self.total_nodes,
            "active_primary_node": self.active_primary_node,
            "standby_nodes_count": self.standby_nodes_count,
            "cluster_uptime_pct": round(self.cluster_uptime_pct, 2),
            "total_failovers": self.total_failovers,
            "total_recoveries": self.total_recoveries,
        }
