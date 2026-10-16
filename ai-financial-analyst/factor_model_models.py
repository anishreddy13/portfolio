"""
factor_model_models.py — Data Models for Enterprise Factor Model Engine

Defines FactorExposure, FactorReturn, FactorContribution, FactorLoading,
FactorRisk, FactorAnalysis, and FactorStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class FactorType(str, Enum):
    MARKET_BETA = "MARKET_BETA"
    MOMENTUM = "MOMENTUM"
    VALUE = "VALUE"
    GROWTH = "GROWTH"
    QUALITY = "QUALITY"
    LOW_VOLATILITY = "LOW_VOLATILITY"
    SIZE = "SIZE"
    SECTOR = "SECTOR"


@dataclass
class FactorExposure:
    """Portfolio exposure to a specific factor."""
    factor_name: str
    factor_type: str
    exposure_value: float
    normalized_exposure: float
    is_significant: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "factor_name": self.factor_name,
            "factor_type": self.factor_type,
            "exposure_value": round(self.exposure_value, 4),
            "normalized_exposure": round(self.normalized_exposure, 4),
            "is_significant": self.is_significant,
        }


@dataclass
class FactorReturn:
    """Estimated return attributable to a factor."""
    factor_name: str
    period: str
    return_pct: float
    cumulative_return_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "factor_name": self.factor_name,
            "period": self.period,
            "return_pct": round(self.return_pct, 4),
            "cumulative_return_pct": round(self.cumulative_return_pct, 4),
        }


@dataclass
class FactorContribution:
    """Factor contribution to portfolio return."""
    factor_name: str
    contribution_pct: float
    weight_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "factor_name": self.factor_name,
            "contribution_pct": round(self.contribution_pct, 4),
            "weight_pct": round(self.weight_pct, 4),
        }


@dataclass
class FactorLoading:
    """Factor loading (sensitivity) for a specific asset."""
    symbol: str
    factor_name: str
    loading_value: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "factor_name": self.factor_name,
            "loading_value": round(self.loading_value, 4),
        }


@dataclass
class FactorRisk:
    """Risk attributed to a specific factor."""
    factor_name: str
    variance_contribution_pct: float
    marginal_risk_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "factor_name": self.factor_name,
            "variance_contribution_pct": round(self.variance_contribution_pct, 4),
            "marginal_risk_pct": round(self.marginal_risk_pct, 4),
        }


@dataclass
class FactorAnalysis:
    """Comprehensive factor analysis report."""
    analysis_id: str
    portfolio_id: str
    exposures: List[FactorExposure] = field(default_factory=list)
    returns: List[FactorReturn] = field(default_factory=list)
    contributions: List[FactorContribution] = field(default_factory=list)
    loadings: List[FactorLoading] = field(default_factory=list)
    risks: List[FactorRisk] = field(default_factory=list)
    correlation_matrix: Dict[str, Dict[str, float]] = field(default_factory=dict)
    total_factor_return_pct: float = 0.0
    residual_return_pct: float = 0.0
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "analysis_id": self.analysis_id,
            "portfolio_id": self.portfolio_id,
            "exposures": [e.to_dict() for e in self.exposures],
            "returns": [r.to_dict() for r in self.returns],
            "contributions": [c.to_dict() for c in self.contributions],
            "loadings": [l.to_dict() for l in self.loadings],
            "risks": [r.to_dict() for r in self.risks],
            "correlation_matrix": self.correlation_matrix,
            "total_factor_return_pct": round(self.total_factor_return_pct, 4),
            "residual_return_pct": round(self.residual_return_pct, 4),
            "timestamp": self.timestamp,
        }


@dataclass
class FactorStatistics:
    """Operational metrics for the FactorModelEngine."""
    total_analyses_run: int = 0
    total_strategies_analyzed: int = 0
    average_market_beta: float = 0.0
    average_factor_count: int = 0
    dominant_factor: str = "MARKET_BETA"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_analyses_run": self.total_analyses_run,
            "total_strategies_analyzed": self.total_strategies_analyzed,
            "average_market_beta": round(self.average_market_beta, 4),
            "average_factor_count": self.average_factor_count,
            "dominant_factor": self.dominant_factor,
        }
