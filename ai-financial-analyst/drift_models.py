"""
drift_models.py — Data Models for Strategy Drift Detection Engine

Defines data structures for individual drift metrics, drift alerts, snapshots,
confidence scores, and top-level StrategyDrift tracking.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class DriftMetric:
    """Represents statistical drift measurement for a single strategy metric.

    Attributes:
        name: Metric name (e.g. 'Win Rate', 'Profit Factor', 'Drawdown').
        baseline_value: Baseline historical value from backtesting.
        current_value: Current value observed in live/paper trading.
        drift_percent: Percentage deviation from baseline.
        has_drift: True if deviation exceeds statistical threshold.
        severity: Drift severity ('NONE', 'MINOR', 'MODERATE', 'MAJOR', 'CRITICAL').
        confidence: Statistical confidence score from 0 to 100.
    """
    name: str
    baseline_value: float
    current_value: float
    drift_percent: float = 0.0
    has_drift: bool = False
    severity: str = "NONE"
    confidence: int = 100

    def to_dict(self) -> Dict[str, Any]:
        """Convert DriftMetric to clean dictionary."""
        return {
            "name": self.name,
            "baseline_value": round(self.baseline_value, 2),
            "current_value": round(self.current_value, 2),
            "drift_percent": round(self.drift_percent, 2),
            "has_drift": self.has_drift,
            "severity": self.severity,
            "confidence": self.confidence,
        }


@dataclass
class DriftAlert:
    """Represents a specific drift notification.

    Attributes:
        alert_type: Type of drift ('PERFORMANCE_DRIFT', 'DRAWDOWN_DRIFT', 'EXECUTION_DRIFT', etc.).
        severity: Alert severity ('MINOR', 'MODERATE', 'MAJOR', 'CRITICAL').
        description: Purely descriptive observation of the deviation.
        confidence: Confidence score of this drift alert (0-100).
        timestamp: ISO timestamp of detection.
    """
    alert_type: str
    severity: str
    description: str
    confidence: int = 100
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert DriftAlert to clean dictionary."""
        return {
            "alert_type": self.alert_type,
            "severity": self.severity,
            "description": self.description,
            "confidence": self.confidence,
            "timestamp": self.timestamp,
        }


@dataclass
class DriftSnapshot:
    """Point-in-time snapshot of strategy drift across all evaluated metrics.

    Attributes:
        drift_state: Overall state ('No Drift', 'Minor Drift', 'Moderate Drift', 'Major Drift', 'Critical Drift').
        overall_confidence: Aggregated confidence score (0-100).
        metrics: List of individual DriftMetric evaluation results.
        alerts: List of active DriftAlert objects.
        observations: Non-recommendation behavioral descriptions.
        timestamp: ISO timestamp of snapshot creation.
    """
    drift_state: str = "No Drift"
    overall_confidence: int = 100
    metrics: List[DriftMetric] = field(default_factory=list)
    alerts: List[DriftAlert] = field(default_factory=list)
    observations: List[str] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert DriftSnapshot to clean dictionary."""
        return {
            "drift_state": self.drift_state,
            "overall_confidence": self.overall_confidence,
            "metrics": [m.to_dict() for m in self.metrics],
            "alerts": [a.to_dict() for a in self.alerts],
            "observations": self.observations,
            "timestamp": self.timestamp,
        }


@dataclass
class StrategyDrift:
    """Top-level strategy drift tracking container.

    Attributes:
        strategy_id: Identifier of the strategy monitored.
        current_state: Overall drift state.
        overall_confidence: Current confidence score (0-100).
        latest_snapshot: Most recent DriftSnapshot.
        active_alerts: Currently active drift alerts.
        observations: Behavioral observations.
        history: Chronological list of historical DriftSnapshot objects.
    """
    strategy_id: str = "UNKNOWN"
    current_state: str = "No Drift"
    overall_confidence: int = 100
    latest_snapshot: Optional[DriftSnapshot] = None
    active_alerts: List[DriftAlert] = field(default_factory=list)
    observations: List[str] = field(default_factory=list)
    history: List[DriftSnapshot] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert StrategyDrift to clean dictionary."""
        return {
            "strategy_id": self.strategy_id,
            "current_state": self.current_state,
            "overall_confidence": self.overall_confidence,
            "latest_snapshot": self.latest_snapshot.to_dict() if self.latest_snapshot else None,
            "active_alerts": [a.to_dict() for a in self.active_alerts],
            "observations": self.observations,
            "history_length": len(self.history),
        }
