"""
multi_portfolio_models.py — Data Models for Enterprise Multi-Portfolio Management Engine

Defines ManagedPortfolio, PortfolioGroup, PortfolioAllocation, CrossPortfolioExposure,
PortfolioComparison, PortfolioAggregate, and MultiPortfolioStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ManagedPortfolio:
    """Metadata and summary envelope for a managed portfolio instance."""
    portfolio_id: str
    name: str
    strategy_type: str
    total_equity: float
    cash_balance: float
    positions_count: int
    unrealized_pnl: float
    realized_pnl: float
    weight_in_group_pct: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "portfolio_id": self.portfolio_id,
            "name": self.name,
            "strategy_type": self.strategy_type,
            "total_equity": round(self.total_equity, 2),
            "cash_balance": round(self.cash_balance, 2),
            "positions_count": self.positions_count,
            "unrealized_pnl": round(self.unrealized_pnl, 2),
            "realized_pnl": round(self.realized_pnl, 2),
            "weight_in_group_pct": round(self.weight_in_group_pct, 2),
        }


@dataclass
class PortfolioGroup:
    """Group container holding multiple managed portfolios."""
    group_id: str
    name: str
    description: str
    portfolio_ids: List[str] = field(default_factory=list)
    created_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "group_id": self.group_id,
            "name": self.name,
            "description": self.description,
            "portfolio_ids": self.portfolio_ids,
            "created_at": self.created_at,
        }


@dataclass
class PortfolioAllocation:
    """Relative weight allocation of a portfolio within a group."""
    portfolio_id: str
    portfolio_name: str
    allocated_capital: float
    weight_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "portfolio_id": self.portfolio_id,
            "portfolio_name": self.portfolio_name,
            "allocated_capital": round(self.allocated_capital, 2),
            "weight_pct": round(self.weight_pct, 2),
        }


@dataclass
class CrossPortfolioExposure:
    """Holding exposure that spans across multiple portfolios in a group."""
    symbol: str
    total_shares: float
    total_market_value: float
    group_exposure_pct: float
    portfolios_holding: List[str] = field(default_factory=list)
    is_overlapping: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "total_shares": round(self.total_shares, 4),
            "total_market_value": round(self.total_market_value, 2),
            "group_exposure_pct": round(self.group_exposure_pct, 2),
            "portfolios_holding": self.portfolios_holding,
            "is_overlapping": self.is_overlapping,
        }


@dataclass
class PortfolioComparison:
    """Comparative analytics across multiple portfolios."""
    portfolio_id_a: str
    portfolio_name_a: str
    portfolio_id_b: str
    portfolio_name_b: str
    equity_ratio: float
    holding_overlap_pct: float
    beta_difference: float
    return_correlation: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "portfolio_id_a": self.portfolio_id_a,
            "portfolio_name_a": self.portfolio_name_a,
            "portfolio_id_b": self.portfolio_id_b,
            "portfolio_name_b": self.portfolio_name_b,
            "equity_ratio": round(self.equity_ratio, 4),
            "holding_overlap_pct": round(self.holding_overlap_pct, 2),
            "beta_difference": round(self.beta_difference, 4),
            "return_correlation": round(self.return_correlation, 4),
        }


@dataclass
class PortfolioAggregate:
    """Aggregated financial and risk metrics across a portfolio group."""
    group_id: str
    group_name: str
    total_group_equity: float
    total_group_cash: float
    total_positions_count: int
    gross_market_exposure: float
    aggregate_leverage: float
    aggregate_var_95_pct: float
    top_overlapping_symbols: List[CrossPortfolioExposure] = field(default_factory=list)
    sector_weights: Dict[str, float] = field(default_factory=dict)
    factor_exposures: Dict[str, float] = field(default_factory=dict)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "group_id": self.group_id,
            "group_name": self.group_name,
            "total_group_equity": round(self.total_group_equity, 2),
            "total_group_cash": round(self.total_group_cash, 2),
            "total_positions_count": self.total_positions_count,
            "gross_market_exposure": round(self.gross_market_exposure, 2),
            "aggregate_leverage": round(self.aggregate_leverage, 4),
            "aggregate_var_95_pct": round(self.aggregate_var_95_pct, 2),
            "top_overlapping_symbols": [s.to_dict() for s in self.top_overlapping_symbols],
            "sector_weights": {k: round(v, 2) for k, v in self.sector_weights.items()},
            "factor_exposures": {k: round(v, 4) for k, v in self.factor_exposures.items()},
            "timestamp": self.timestamp,
        }


@dataclass
class MultiPortfolioStatistics:
    """Operational statistics for MultiPortfolioEngine."""
    total_groups_managed: int = 0
    total_portfolios_tracked: int = 0
    total_combined_equity: float = 0.0
    overlapping_holdings_count: int = 0
    average_portfolios_per_group: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_groups_managed": self.total_groups_managed,
            "total_portfolios_tracked": self.total_portfolios_tracked,
            "total_combined_equity": round(self.total_combined_equity, 2),
            "overlapping_holdings_count": self.overlapping_holdings_count,
            "average_portfolios_per_group": round(self.average_portfolios_per_group, 2),
        }
