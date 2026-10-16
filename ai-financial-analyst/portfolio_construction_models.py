"""
portfolio_construction_models.py — Data Models for Enterprise Portfolio Construction Engine

Defines TargetPosition, AllocationDecision, SizingDecision, PortfolioConstraint,
PortfolioOptimizationResult, and ConstructionStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class TargetPosition:
    """Target position weight and share allocation computed by PortfolioConstructionEngine."""
    symbol: str
    target_weight_pct: float
    target_shares: float
    current_shares: float = 0.0
    target_dollar_allocation: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert TargetPosition to clean dictionary."""
        return {
            "symbol": self.symbol,
            "target_weight_pct": round(self.target_weight_pct, 2),
            "target_shares": round(self.target_shares, 4),
            "current_shares": round(self.current_shares, 4),
            "target_dollar_allocation": round(self.target_dollar_allocation, 2),
        }


@dataclass
class AllocationDecision:
    """Capital allocation decision container generated for an approved signal."""
    decision_id: str
    signal_id: str
    symbol: str
    direction: str
    target_shares: float
    target_capital: float
    allocated_weight_pct: float
    sizing_model: str = "RISK_PARITY"
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "decision_id": self.decision_id,
            "signal_id": self.signal_id,
            "symbol": self.symbol,
            "direction": self.direction,
            "target_shares": round(self.target_shares, 4),
            "target_capital": round(self.target_capital, 2),
            "allocated_weight_pct": round(self.allocated_weight_pct, 2),
            "sizing_model": self.sizing_model,
            "timestamp": self.timestamp,
        }


@dataclass
class SizingDecision:
    """Calculated position sizing output for a specific sizing method."""
    symbol: str
    method: str
    calculated_quantity: float
    allocated_capital: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "method": self.method,
            "calculated_quantity": round(self.calculated_quantity, 4),
            "allocated_capital": round(self.allocated_capital, 2),
        }


@dataclass
class PortfolioConstraint:
    """Enterprise portfolio construction boundary constraints."""
    max_single_position_pct: float = 10.0
    max_sector_weight_pct: float = 30.0
    min_cash_buffer_pct: float = 5.0
    target_volatility_pct: float = 15.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "max_single_position_pct": round(self.max_single_position_pct, 2),
            "max_sector_weight_pct": round(self.max_sector_weight_pct, 2),
            "min_cash_buffer_pct": round(self.min_cash_buffer_pct, 2),
            "target_volatility_pct": round(self.target_volatility_pct, 2),
        }


@dataclass
class PortfolioOptimizationResult:
    """Comprehensive portfolio construction optimization result envelope."""
    result_id: str
    target_positions: List[TargetPosition] = field(default_factory=list)
    rebalance_required: bool = False
    total_allocated_capital: float = 0.0
    cash_reserve: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "result_id": self.result_id,
            "target_positions": [p.to_dict() for p in self.target_positions],
            "rebalance_required": self.rebalance_required,
            "total_allocated_capital": round(self.total_allocated_capital, 2),
            "cash_reserve": round(self.cash_reserve, 2),
        }


@dataclass
class ConstructionStatistics:
    """Operational metrics tracking the PortfolioConstructionEngine."""
    allocations_constructed: int = 0
    rebalances_executed: int = 0
    total_capital_deployed: float = 0.0
    average_construction_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "allocations_constructed": self.allocations_constructed,
            "rebalances_executed": self.rebalances_executed,
            "total_capital_deployed": round(self.total_capital_deployed, 2),
            "average_construction_ms": round(self.average_construction_ms, 2),
        }
