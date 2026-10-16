"""
strategy_health_models.py — Data Models for Strategy Health Engine

Defines data structures for health alerts, health snapshots, health scores, and overall
strategy health tracking.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class HealthAlert:
    """Represents a specific health warning or critical alert triggered by strategy evaluation.

    Attributes:
        alert_type: Identifier of the alert type (e.g. 'DRAWDOWN_INCREASING', 'WIN_RATE_DROPPING').
        severity: Severity level ('INFO', 'WARNING', 'CRITICAL').
        message: Human-readable behavioral description.
        timestamp: ISO timestamp of alert creation.
    """
    alert_type: str
    severity: str
    message: str
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert HealthAlert to clean dictionary."""
        return {
            "alert_type": self.alert_type,
            "severity": self.severity,
            "message": self.message,
            "timestamp": self.timestamp,
        }


@dataclass
class HealthSnapshot:
    """A point-in-time health snapshot evaluating all 10 health dimensions.

    Attributes:
        score: Aggregated health score from 0 to 100.
        state: Overall health state ('Excellent', 'Healthy', 'Warning', 'Critical').
        dimension_scores: Dict mapping each of the 10 health dimensions to a score (0-100).
        alerts: List of triggered HealthAlert objects.
        recommendations: Behavioral descriptions and non-investment strategy observations.
        timestamp: ISO timestamp of snapshot creation.
    """
    score: int = 100
    state: str = "Healthy"
    dimension_scores: Dict[str, int] = field(default_factory=dict)
    alerts: List[HealthAlert] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert HealthSnapshot to clean dictionary."""
        return {
            "score": self.score,
            "state": self.state,
            "dimension_scores": self.dimension_scores,
            "alerts": [a.to_dict() for a in self.alerts],
            "recommendations": self.recommendations,
            "timestamp": self.timestamp,
        }


@dataclass
class StrategyHealth:
    """Comprehensive strategy health tracking object over time.

    Attributes:
        strategy_id: Identifier of the strategy being monitored.
        current_score: Latest calculated health score (0-100).
        current_state: Latest health state ('Excellent', 'Healthy', 'Warning', 'Critical').
        latest_snapshot: The most recent HealthSnapshot.
        alerts: Currently active alerts.
        trend: Overall health trajectory ('Improving', 'Stable', 'Deteriorating').
        recommendations: Behavioral observations for strategy maintenance.
        history: Chronological list of historical HealthSnapshot objects.
    """
    strategy_id: str = "UNKNOWN"
    current_score: int = 100
    current_state: str = "Healthy"
    latest_snapshot: Optional[HealthSnapshot] = None
    alerts: List[HealthAlert] = field(default_factory=list)
    trend: str = "Stable"
    recommendations: List[str] = field(default_factory=list)
    history: List[HealthSnapshot] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert StrategyHealth to clean dictionary."""
        return {
            "strategy_id": self.strategy_id,
            "current_score": self.current_score,
            "current_state": self.current_state,
            "latest_snapshot": self.latest_snapshot.to_dict() if self.latest_snapshot else None,
            "alerts": [a.to_dict() for a in self.alerts],
            "trend": self.trend,
            "recommendations": self.recommendations,
            "history_length": len(self.history),
        }
