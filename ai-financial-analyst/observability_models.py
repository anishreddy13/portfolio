"""
observability_models.py — Data Models for Enterprise Observability & Monitoring Engine

Defines MetricSample, LatencyMetric, HealthMetric, AlertRule, Alert,
SubsystemHealth, and ObservabilityStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class SubsystemStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNHEALTHY = "UNHEALTHY"


class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class MetricSample:
    """Raw metric data point sample."""
    metric_name: str
    value: float
    subsystem: str
    timestamp: str
    tags: Dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "metric_name": self.metric_name,
            "value": round(self.value, 4),
            "subsystem": self.subsystem,
            "timestamp": self.timestamp,
            "tags": self.tags,
        }


@dataclass
class LatencyMetric:
    """Latency distribution percentiles for a subsystem."""
    subsystem: str
    p50_ms: float
    p95_ms: float
    p99_ms: float
    max_ms: float
    sample_count: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "subsystem": self.subsystem,
            "p50_ms": round(self.p50_ms, 2),
            "p95_ms": round(self.p95_ms, 2),
            "p99_ms": round(self.p99_ms, 2),
            "max_ms": round(self.max_ms, 2),
            "sample_count": self.sample_count,
        }


@dataclass
class HealthMetric:
    """Health metrics envelope for a subsystem."""
    subsystem: str
    health_score: float
    status: str
    uptime_pct: float
    error_rate_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "subsystem": self.subsystem,
            "health_score": round(self.health_score, 1),
            "status": self.status,
            "uptime_pct": round(self.uptime_pct, 2),
            "error_rate_pct": round(self.error_rate_pct, 2),
        }


@dataclass
class AlertRule:
    """Rule definition for automated alert triggers."""
    rule_id: str
    metric_name: str
    subsystem: str
    threshold: float
    comparison: str  # GT, LT, EQ
    severity: str
    is_enabled: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "metric_name": self.metric_name,
            "subsystem": self.subsystem,
            "threshold": round(self.threshold, 2),
            "comparison": self.comparison,
            "severity": self.severity,
            "is_enabled": self.is_enabled,
        }


@dataclass
class Alert:
    """Active or historical alert instance."""
    alert_id: str
    rule_id: str
    subsystem: str
    message: str
    severity: str
    timestamp: str
    is_resolved: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "alert_id": self.alert_id,
            "rule_id": self.rule_id,
            "subsystem": self.subsystem,
            "message": self.message,
            "severity": self.severity,
            "timestamp": self.timestamp,
            "is_resolved": self.is_resolved,
        }


@dataclass
class SubsystemHealth:
    """Aggregated health status report for a subsystem."""
    subsystem: str
    status: str
    health_score: float
    latency_p95_ms: float
    error_rate_pct: float
    throughput_msg_sec: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "subsystem": self.subsystem,
            "status": self.status,
            "health_score": round(self.health_score, 1),
            "latency_p95_ms": round(self.latency_p95_ms, 2),
            "error_rate_pct": round(self.error_rate_pct, 2),
            "throughput_msg_sec": round(self.throughput_msg_sec, 1),
        }


@dataclass
class ObservabilityStatistics:
    """Operational statistics for ObservabilityEngine."""
    total_metrics_recorded: int = 0
    total_alerts_triggered: int = 0
    active_alerts_count: int = 0
    overall_system_health_score: float = 100.0
    cpu_usage_pct: float = 12.5
    memory_usage_mb: float = 485.0
    queue_depth: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_metrics_recorded": self.total_metrics_recorded,
            "total_alerts_triggered": self.total_alerts_triggered,
            "active_alerts_count": self.active_alerts_count,
            "overall_system_health_score": round(self.overall_system_health_score, 1),
            "cpu_usage_pct": round(self.cpu_usage_pct, 1),
            "memory_usage_mb": round(self.memory_usage_mb, 1),
            "queue_depth": self.queue_depth,
        }
