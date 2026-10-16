"""
strategy_optimization_models.py — Data Models for Enterprise Strategy Optimization Engine

Defines StrategyParameter, OptimizationCandidate, OptimizationRecommendation, WalkForwardResult,
ParameterSensitivity, OptimizationReport, and OptimizationStatistics.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class StrategyParameter:
    """Quantitative strategy parameter envelope with bounds and optimal value."""
    param_name: str
    current_value: float
    min_value: float
    max_value: float
    optimal_value: float

    def to_dict(self) -> Dict[str, Any]:
        """Convert StrategyParameter to clean dictionary."""
        return {
            "param_name": self.param_name,
            "current_value": round(self.current_value, 2),
            "min_value": round(self.min_value, 2),
            "max_value": round(self.max_value, 2),
            "optimal_value": round(self.optimal_value, 2),
        }


@dataclass
class OptimizationCandidate:
    """Evaluated parameter candidate from grid search or optimization search."""
    candidate_id: str
    parameter_map: Dict[str, float]
    sharpe_ratio: float
    total_return_pct: float
    max_drawdown_pct: float
    win_rate_pct: float
    composite_score: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "candidate_id": self.candidate_id,
            "parameter_map": {k: round(v, 2) for k, v in self.parameter_map.items()},
            "sharpe_ratio": round(self.sharpe_ratio, 2),
            "total_return_pct": round(self.total_return_pct, 2),
            "max_drawdown_pct": round(self.max_drawdown_pct, 2),
            "win_rate_pct": round(self.win_rate_pct, 2),
            "composite_score": round(self.composite_score, 1),
        }


@dataclass
class OptimizationRecommendation:
    """Actionable parameter improvement recommendation for quantitative strategy."""
    rec_id: str
    strategy_name: str
    param_name: str
    current_value: float
    recommended_value: float
    expected_sharpe_gain: float
    rationale: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rec_id": self.rec_id,
            "strategy_name": self.strategy_name,
            "param_name": self.param_name,
            "current_value": round(self.current_value, 2),
            "recommended_value": round(self.recommended_value, 2),
            "expected_sharpe_gain": round(self.expected_sharpe_gain, 2),
            "rationale": self.rationale,
        }


@dataclass
class WalkForwardResult:
    """In-sample vs out-of-sample walk-forward validation efficiency result."""
    window_id: str
    in_sample_sharpe: float
    out_of_sample_sharpe: float
    efficiency_ratio: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "window_id": self.window_id,
            "in_sample_sharpe": round(self.in_sample_sharpe, 2),
            "out_of_sample_sharpe": round(self.out_of_sample_sharpe, 2),
            "efficiency_ratio": round(self.efficiency_ratio, 2),
        }


@dataclass
class ParameterSensitivity:
    """Sensitivity analysis metric measuring parameter fragility."""
    param_name: str
    sensitivity_score: float
    is_fragile: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "param_name": self.param_name,
            "sensitivity_score": round(self.sensitivity_score, 2),
            "is_fragile": self.is_fragile,
        }


@dataclass
class OptimizationReport:
    """Comprehensive strategy optimization research report."""
    report_id: str
    strategy_name: str
    best_parameters: List[StrategyParameter] = field(default_factory=list)
    candidates: List[OptimizationCandidate] = field(default_factory=list)
    walk_forward: Optional[WalkForwardResult] = None
    robustness_score: float = 88.5
    overfitting_score: float = 12.0
    recommendations: List[OptimizationRecommendation] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "strategy_name": self.strategy_name,
            "best_parameters": [p.to_dict() for p in self.best_parameters],
            "candidates": [c.to_dict() for c in self.candidates],
            "walk_forward": self.walk_forward.to_dict() if self.walk_forward else None,
            "robustness_score": round(self.robustness_score, 1),
            "overfitting_score": round(self.overfitting_score, 1),
            "recommendations": [r.to_dict() for r in self.recommendations],
            "timestamp": self.timestamp,
        }


@dataclass
class OptimizationStatistics:
    """Operational metrics tracking the StrategyOptimizationEngine."""
    total_optimizations_run: int = 0
    grid_search_evaluations: int = 0
    walk_forward_windows_run: int = 0
    average_robustness_score: float = 0.0
    average_overfitting_score: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_optimizations_run": self.total_optimizations_run,
            "grid_search_evaluations": self.grid_search_evaluations,
            "walk_forward_windows_run": self.walk_forward_windows_run,
            "average_robustness_score": round(self.average_robustness_score, 1),
            "average_overfitting_score": round(self.average_overfitting_score, 1),
        }
