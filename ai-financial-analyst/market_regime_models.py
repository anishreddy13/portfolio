"""
market_regime_models.py — Data Models for Enterprise Market Regime Engine

Defines MarketRegime, RegimeSnapshot, RegimeTransition, RegimeProbability,
RegimeStatistics, and RegimeAnalysis dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class MarketRegime(str, Enum):
    BULL_TREND = "BULL_TREND"
    BEAR_TREND = "BEAR_TREND"
    HIGH_VOLATILITY = "HIGH_VOLATILITY"
    LOW_VOLATILITY = "LOW_VOLATILITY"
    MEAN_REVERTING = "MEAN_REVERTING"
    MOMENTUM = "MOMENTUM"
    RISK_OFF = "RISK_OFF"
    NEUTRAL = "NEUTRAL"


@dataclass
class RegimeSnapshot:
    """Point-in-time market regime classification envelope."""
    snapshot_id: str
    regime: str
    confidence_pct: float
    trend_score: float
    volatility_score: float
    momentum_score: float
    mean_reversion_score: float
    duration_minutes: int = 0
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert RegimeSnapshot to clean dictionary."""
        return {
            "snapshot_id": self.snapshot_id,
            "regime": self.regime,
            "confidence_pct": round(self.confidence_pct, 1),
            "trend_score": round(self.trend_score, 2),
            "volatility_score": round(self.volatility_score, 2),
            "momentum_score": round(self.momentum_score, 2),
            "mean_reversion_score": round(self.mean_reversion_score, 2),
            "duration_minutes": self.duration_minutes,
            "timestamp": self.timestamp,
        }


@dataclass
class RegimeTransition:
    """Record of a regime state transition event."""
    transition_id: str
    from_regime: str
    to_regime: str
    probability_pct: float
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "transition_id": self.transition_id,
            "from_regime": self.from_regime,
            "to_regime": self.to_regime,
            "probability_pct": round(self.probability_pct, 1),
            "timestamp": self.timestamp,
        }


@dataclass
class RegimeProbability:
    """Probability distribution across all possible regimes."""
    regime: str
    probability_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "regime": self.regime,
            "probability_pct": round(self.probability_pct, 1),
        }


@dataclass
class RegimeAnalysis:
    """Comprehensive regime analysis report."""
    analysis_id: str
    current_snapshot: RegimeSnapshot
    transition_matrix: List[RegimeProbability] = field(default_factory=list)
    recent_transitions: List[RegimeTransition] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "analysis_id": self.analysis_id,
            "current_snapshot": self.current_snapshot.to_dict(),
            "transition_matrix": [p.to_dict() for p in self.transition_matrix],
            "recent_transitions": [t.to_dict() for t in self.recent_transitions],
            "timestamp": self.timestamp,
        }


@dataclass
class RegimeStatistics:
    """Operational metrics tracking the MarketRegimeEngine."""
    total_analyses_run: int = 0
    regime_changes_detected: int = 0
    average_confidence_pct: float = 0.0
    average_duration_minutes: int = 0
    current_regime: str = "BULL_TREND"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_analyses_run": self.total_analyses_run,
            "regime_changes_detected": self.regime_changes_detected,
            "average_confidence_pct": round(self.average_confidence_pct, 1),
            "average_duration_minutes": self.average_duration_minutes,
            "current_regime": self.current_regime,
        }
