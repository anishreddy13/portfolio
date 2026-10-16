"""
backtest_models.py — Data Models for Production-Grade Backtesting Engine

Defines BacktestConfiguration, BacktestTrade, BacktestPosition, BacktestEquityPoint,
BacktestMetrics, BacktestResult, and BacktestStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class BacktestConfiguration:
    """Backtest execution parameters and strategy settings."""
    strategy_name: str
    symbol: str
    timeframe: str
    start_date: str
    end_date: str
    initial_cash: float = 100000.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert BacktestConfiguration to clean dictionary."""
        return {
            "strategy_name": self.strategy_name,
            "symbol": self.symbol,
            "timeframe": self.timeframe,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "initial_cash": round(self.initial_cash, 2),
        }


@dataclass
class BacktestTrade:
    """Represents an executed trade within a historical backtest run."""
    trade_id: str
    symbol: str
    side: str
    quantity: float
    entry_price: float
    exit_price: float
    entry_time: str
    exit_time: str
    pnl: float
    pnl_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "trade_id": self.trade_id,
            "symbol": self.symbol,
            "side": self.side,
            "quantity": round(self.quantity, 4),
            "entry_price": round(self.entry_price, 2),
            "exit_price": round(self.exit_price, 2),
            "entry_time": self.entry_time,
            "exit_time": self.exit_time,
            "pnl": round(self.pnl, 2),
            "pnl_pct": round(self.pnl_pct, 2),
        }


@dataclass
class BacktestPosition:
    """Active position held during historical simulation."""
    symbol: str
    quantity: float
    avg_entry_price: float
    current_price: float = 0.0
    unrealized_pnl: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "quantity": round(self.quantity, 4),
            "avg_entry_price": round(self.avg_entry_price, 2),
            "current_price": round(self.current_price, 2),
            "unrealized_pnl": round(self.unrealized_pnl, 2),
        }


@dataclass
class BacktestEquityPoint:
    """Single time-series point along the backtest equity curve."""
    timestamp: str
    equity: float
    cash: float
    drawdown_pct: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "equity": round(self.equity, 2),
            "cash": round(self.cash, 2),
            "drawdown_pct": round(self.drawdown_pct, 2),
        }


@dataclass
class BacktestMetrics:
    """Comprehensive performance statistics computed for a backtest run."""
    total_return_pct: float = 0.0
    cagr: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    max_drawdown_pct: float = 0.0
    win_rate_pct: float = 0.0
    profit_factor: float = 0.0
    expectancy: float = 0.0
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_return_pct": round(self.total_return_pct, 2),
            "cagr": round(self.cagr, 2),
            "sharpe_ratio": round(self.sharpe_ratio, 2),
            "sortino_ratio": round(self.sortino_ratio, 2),
            "max_drawdown_pct": round(self.max_drawdown_pct, 2),
            "win_rate_pct": round(self.win_rate_pct, 2),
            "profit_factor": round(self.profit_factor, 2),
            "expectancy": round(self.expectancy, 2),
            "total_trades": self.total_trades,
            "winning_trades": self.winning_trades,
            "losing_trades": self.losing_trades,
        }


@dataclass
class BacktestResult:
    """Complete historical backtest result container."""
    backtest_id: str
    config: BacktestConfiguration
    metrics: BacktestMetrics
    equity_curve: List[BacktestEquityPoint] = field(default_factory=list)
    trades: List[BacktestTrade] = field(default_factory=list)
    created_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "backtest_id": self.backtest_id,
            "config": self.config.to_dict(),
            "metrics": self.metrics.to_dict(),
            "equity_curve": [p.to_dict() for p in self.equity_curve],
            "trades": [t.to_dict() for t in self.trades],
            "created_at": self.created_at,
        }


@dataclass
class BacktestStatistics:
    """Operational metrics tracking the BacktestEngine."""
    total_backtests_run: int = 0
    symbols_tested: int = 0
    average_backtest_duration_ms: float = 0.0
    best_sharpe_ratio: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_backtests_run": self.total_backtests_run,
            "symbols_tested": self.symbols_tested,
            "average_backtest_duration_ms": round(self.average_backtest_duration_ms, 2),
            "best_sharpe_ratio": round(self.best_sharpe_ratio, 2),
        }


@dataclass
class Order:
    order_id: str
    symbol: str
    side: str
    quantity: float
    order_type: str = "MARKET"
    price: float = 0.0
    status: str = "FILLED"
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "order_id": self.order_id,
            "symbol": self.symbol,
            "side": self.side,
            "quantity": self.quantity,
            "order_type": self.order_type,
            "price": self.price,
            "status": self.status,
            "timestamp": self.timestamp,
        }


# Backward compatibility class aliases
EquityCurvePoint = BacktestEquityPoint
Trade = BacktestTrade
Position = BacktestPosition
PerformanceMetrics = BacktestMetrics
