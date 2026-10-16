"""
tca_models.py — Data Models for Enterprise Transaction Cost Analysis (TCA) Engine

Defines ExecutionBenchmark, SlippageAnalysis, MarketImpact, ImplementationShortfall,
BrokerPerformance, VenuePerformance, ExecutionQuality, ExecutionAnalytics, and TCAStatistics.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class ExecutionBenchmark:
    """Standardized price benchmarks for execution analysis."""
    symbol: str
    arrival_price: float
    vwap: float
    twap: float
    close_price: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert ExecutionBenchmark to clean dictionary."""
        return {
            "symbol": self.symbol,
            "arrival_price": round(self.arrival_price, 2),
            "vwap": round(self.vwap, 2),
            "twap": round(self.twap, 2),
            "close_price": round(self.close_price, 2),
        }


@dataclass
class SlippageAnalysis:
    """Execution price slippage measured in basis points (bps) and dollars ($)."""
    arrival_slippage_bps: float
    vwap_slippage_bps: float
    total_slippage_dollars: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "arrival_slippage_bps": round(self.arrival_slippage_bps, 2),
            "vwap_slippage_bps": round(self.vwap_slippage_bps, 2),
            "total_slippage_dollars": round(self.total_slippage_dollars, 2),
        }


@dataclass
class MarketImpact:
    """Permanent and temporary market impact calculations in basis points."""
    market_impact_bps: float
    permanent_impact_bps: float
    temporary_impact_bps: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "market_impact_bps": round(self.market_impact_bps, 2),
            "permanent_impact_bps": round(self.permanent_impact_bps, 2),
            "temporary_impact_bps": round(self.temporary_impact_bps, 2),
        }


@dataclass
class ImplementationShortfall:
    """Per-trade Perold Implementation Shortfall metrics."""
    paper_return_dollars: float
    actual_return_dollars: float
    shortfall_bps: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "paper_return_dollars": round(self.paper_return_dollars, 2),
            "actual_return_dollars": round(self.actual_return_dollars, 2),
            "shortfall_bps": round(self.shortfall_bps, 2),
        }


@dataclass
class BrokerPerformance:
    """Aggregated execution performance metrics per broker adapter."""
    broker_name: str
    total_executions: int
    avg_slippage_bps: float
    fill_rate_pct: float
    broker_score: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "broker_name": self.broker_name,
            "total_executions": self.total_executions,
            "avg_slippage_bps": round(self.avg_slippage_bps, 2),
            "fill_rate_pct": round(self.fill_rate_pct, 2),
            "broker_score": round(self.broker_score, 1),
        }


@dataclass
class VenuePerformance:
    """Aggregated execution quality metrics per execution venue route."""
    venue_name: str
    total_volume: float
    avg_latency_ms: float
    price_improvement_bps: float
    venue_score: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "venue_name": self.venue_name,
            "total_volume": round(self.total_volume, 2),
            "avg_latency_ms": round(self.avg_latency_ms, 2),
            "price_improvement_bps": round(self.price_improvement_bps, 2),
            "venue_score": round(self.venue_score, 1),
        }


@dataclass
class ExecutionQuality:
    """Overall execution quality rating and composite score."""
    execution_id: str
    symbol: str
    side: str
    quantity: float
    avg_fill_price: float
    execution_cost_dollars: float
    quality_score: float
    rating: str = "EXCELLENT"  # EXCELLENT, GOOD, FAIR, POOR

    def to_dict(self) -> Dict[str, Any]:
        return {
            "execution_id": self.execution_id,
            "symbol": self.symbol,
            "side": self.side,
            "quantity": round(self.quantity, 4),
            "avg_fill_price": round(self.avg_fill_price, 2),
            "execution_cost_dollars": round(self.execution_cost_dollars, 2),
            "quality_score": round(self.quality_score, 1),
            "rating": self.rating,
        }


@dataclass
class ExecutionAnalytics:
    """Comprehensive Transaction Cost Analysis (TCA) report container."""
    report_id: str
    symbol: str
    benchmarks: ExecutionBenchmark
    slippage: SlippageAnalysis
    market_impact: MarketImpact
    shortfall: ImplementationShortfall
    quality: ExecutionQuality
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "symbol": self.symbol,
            "benchmarks": self.benchmarks.to_dict(),
            "slippage": self.slippage.to_dict(),
            "market_impact": self.market_impact.to_dict(),
            "shortfall": self.shortfall.to_dict(),
            "quality": self.quality.to_dict(),
            "timestamp": self.timestamp,
        }


@dataclass
class TCAStatistics:
    """Operational metrics tracking the TransactionCostAnalysisEngine."""
    total_executions_analyzed: int = 0
    average_slippage_bps: float = 0.0
    average_market_impact_bps: float = 0.0
    total_shortfall_dollars: float = 0.0
    average_quality_score: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_executions_analyzed": self.total_executions_analyzed,
            "average_slippage_bps": round(self.average_slippage_bps, 2),
            "average_market_impact_bps": round(self.average_market_impact_bps, 2),
            "total_shortfall_dollars": round(self.total_shortfall_dollars, 2),
            "average_quality_score": round(self.average_quality_score, 1),
        }
