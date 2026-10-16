"""
performance_attribution_models.py — Data Models for Enterprise Performance Attribution Engine

Defines PortfolioReturn, BenchmarkReturn, AssetContribution, SectorContribution,
StrategyContribution, PerformanceMetrics, AttributionBreakdown, and AttributionStatistics.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class PortfolioReturn:
    """Portfolio return metrics across specified time period."""
    period: str
    total_return_pct: float
    realized_return_pct: float
    unrealized_return_pct: float

    def to_dict(self) -> Dict[str, Any]:
        """Convert PortfolioReturn to clean dictionary."""
        return {
            "period": self.period,
            "total_return_pct": round(self.total_return_pct, 2),
            "realized_return_pct": round(self.realized_return_pct, 2),
            "unrealized_return_pct": round(self.unrealized_return_pct, 2),
        }


@dataclass
class BenchmarkReturn:
    """Benchmark index return metrics (e.g. S&P 500, NASDAQ-100)."""
    benchmark_name: str
    benchmark_return_pct: float
    excess_return_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "benchmark_name": self.benchmark_name,
            "benchmark_return_pct": round(self.benchmark_return_pct, 2),
            "excess_return_pct": round(self.excess_return_pct, 2),
        }


@dataclass
class AssetContribution:
    """Individual asset return contribution to portfolio total return."""
    symbol: str
    weight_pct: float
    return_pct: float
    contribution_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "weight_pct": round(self.weight_pct, 2),
            "return_pct": round(self.return_pct, 2),
            "contribution_pct": round(self.contribution_pct, 2),
        }


@dataclass
class SectorContribution:
    """Brinson-Fachler sector attribution breakdown (Allocation vs Selection effect)."""
    sector_name: str
    weight_pct: float
    allocation_effect_pct: float
    selection_effect_pct: float
    total_contribution_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sector_name": self.sector_name,
            "weight_pct": round(self.weight_pct, 2),
            "allocation_effect_pct": round(self.allocation_effect_pct, 2),
            "selection_effect_pct": round(self.selection_effect_pct, 2),
            "total_contribution_pct": round(self.total_contribution_pct, 2),
        }


@dataclass
class StrategyContribution:
    """Attribution contribution breakdown per quantitative strategy plugin."""
    strategy_name: str
    allocated_capital: float
    realized_pnl: float
    return_pct: float
    contribution_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "strategy_name": self.strategy_name,
            "allocated_capital": round(self.allocated_capital, 2),
            "realized_pnl": round(self.realized_pnl, 2),
            "return_pct": round(self.return_pct, 2),
            "contribution_pct": round(self.contribution_pct, 2),
        }


@dataclass
class PerformanceMetrics:
    """Institutional portfolio performance metrics (Alpha, Beta, Tracking Error, Information Ratio)."""
    alpha: float
    beta: float
    tracking_error_pct: float
    information_ratio: float
    sharpe_ratio: float = 1.85
    sortino_ratio: float = 2.14
    treynor_ratio: float = 0.18

    def to_dict(self) -> Dict[str, Any]:
        return {
            "alpha": round(self.alpha, 2),
            "beta": round(self.beta, 2),
            "tracking_error_pct": round(self.tracking_error_pct, 2),
            "information_ratio": round(self.information_ratio, 2),
            "sharpe_ratio": round(self.sharpe_ratio, 2),
            "sortino_ratio": round(self.sortino_ratio, 2),
            "treynor_ratio": round(self.treynor_ratio, 2),
        }


@dataclass
class AttributionBreakdown:
    """Comprehensive performance attribution breakdown envelope."""
    breakdown_id: str
    portfolio_return: PortfolioReturn
    benchmark_return: BenchmarkReturn
    metrics: PerformanceMetrics
    asset_contributions: List[AssetContribution] = field(default_factory=list)
    sector_contributions: List[SectorContribution] = field(default_factory=list)
    strategy_contributions: List[StrategyContribution] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "breakdown_id": self.breakdown_id,
            "portfolio_return": self.portfolio_return.to_dict(),
            "benchmark_return": self.benchmark_return.to_dict(),
            "metrics": self.metrics.to_dict(),
            "asset_contributions": [a.to_dict() for a in self.asset_contributions],
            "sector_contributions": [s.to_dict() for s in self.sector_contributions],
            "strategy_contributions": [st.to_dict() for st in self.strategy_contributions],
            "timestamp": self.timestamp,
        }


@dataclass
class AttributionStatistics:
    """Operational metrics tracking the PerformanceAttributionEngine."""
    total_analyses_run: int = 0
    average_alpha: float = 0.0
    average_beta: float = 0.0
    average_tracking_error: float = 0.0
    average_information_ratio: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_analyses_run": self.total_analyses_run,
            "average_alpha": round(self.average_alpha, 2),
            "average_beta": round(self.average_beta, 2),
            "average_tracking_error": round(self.average_tracking_error, 2),
            "average_information_ratio": round(self.average_information_ratio, 2),
        }
