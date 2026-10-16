"""
portfolio_models.py — Data Models for Portfolio & Position Management Subsystem

Defines Position, UnrealizedPnL, RealizedPnL, PortfolioAllocation,
PortfolioPerformance, PortfolioSummary, and Portfolio dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class Position:
    """Represents an active holding position in the portfolio.

    Attributes:
        symbol: Ticker symbol string (e.g. 'AAPL').
        quantity: Share quantity held.
        avg_cost_price: Average acquisition cost basis per share.
        current_price: Mark-to-market live price from RequestCoordinator/Cache.
        unrealized_pnl: Open profit/loss in currency ($).
        unrealized_pnl_pct: Open profit/loss percentage (%).
        realized_pnl: Accumulated closed profit/loss for this ticker ($).
        market_value: Total mark-to-market position value ($).
        allocation_pct: Percentage weight in portfolio equity (%).
        updated_at: ISO timestamp of last mark update.
    """
    symbol: str
    quantity: float
    avg_cost_price: float
    current_price: float = 0.0
    unrealized_pnl: float = 0.0
    unrealized_pnl_pct: float = 0.0
    realized_pnl: float = 0.0
    market_value: float = 0.0
    allocation_pct: float = 0.0
    updated_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert Position to clean dictionary."""
        return {
            "symbol": self.symbol,
            "quantity": round(self.quantity, 4),
            "avg_cost_price": round(self.avg_cost_price, 2),
            "current_price": round(self.current_price, 2),
            "unrealized_pnl": round(self.unrealized_pnl, 2),
            "unrealized_pnl_pct": round(self.unrealized_pnl_pct, 2),
            "realized_pnl": round(self.realized_pnl, 2),
            "market_value": round(self.market_value, 2),
            "allocation_pct": round(self.allocation_pct, 2),
            "updated_at": self.updated_at,
        }


@dataclass
class UnrealizedPnL:
    """Unrealized mark-to-market profit/loss entry."""
    symbol: str
    pnl_amount: float
    pnl_percentage: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "pnl_amount": round(self.pnl_amount, 2),
            "pnl_percentage": round(self.pnl_percentage, 2),
        }


@dataclass
class RealizedPnL:
    """Closed trade realized profit/loss record."""
    symbol: str
    pnl_amount: float
    closed_at: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "pnl_amount": round(self.pnl_amount, 2),
            "closed_at": self.closed_at,
        }


@dataclass
class PortfolioAllocation:
    """Portfolio asset class/symbol weight allocation breakdown."""
    symbol: str
    market_value: float
    percentage: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "market_value": round(self.market_value, 2),
            "percentage": round(self.percentage, 2),
        }


@dataclass
class PortfolioPerformance:
    """Portfolio macro metrics and risk indicators."""
    total_equity: float = 100000.0
    cash_balance: float = 100000.0
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0
    daily_change: float = 0.0
    daily_change_pct: float = 0.0
    risk_score: float = 15.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_equity": round(self.total_equity, 2),
            "cash_balance": round(self.cash_balance, 2),
            "unrealized_pnl": round(self.unrealized_pnl, 2),
            "realized_pnl": round(self.realized_pnl, 2),
            "daily_change": round(self.daily_change, 2),
            "daily_change_pct": round(self.daily_change_pct, 2),
            "risk_score": round(self.risk_score, 1),
        }


@dataclass
class PortfolioSummary:
    """Aggregated portfolio summary envelope."""
    portfolio_id: str
    name: str
    total_equity: float
    cash_balance: float
    positions: List[Position] = field(default_factory=list)
    performance: PortfolioPerformance = field(default_factory=PortfolioPerformance)
    allocations: List[PortfolioAllocation] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "portfolio_id": self.portfolio_id,
            "name": self.name,
            "total_equity": round(self.total_equity, 2),
            "cash_balance": round(self.cash_balance, 2),
            "positions": [p.to_dict() for p in self.positions],
            "performance": self.performance.to_dict(),
            "allocations": [a.to_dict() for a in self.allocations],
        }


@dataclass
class Portfolio:
    """Complete portfolio entity with active holdings and trade history."""
    portfolio_id: str
    name: str
    cash_balance: float = 100000.0
    positions: Dict[str, Position] = field(default_factory=dict)
    realized_pnl_history: List[RealizedPnL] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "portfolio_id": self.portfolio_id,
            "name": self.name,
            "cash_balance": round(self.cash_balance, 2),
            "positions": {k: v.to_dict() for k, v in self.positions.items()},
            "realized_pnl_history": [r.to_dict() for r in self.realized_pnl_history],
        }
