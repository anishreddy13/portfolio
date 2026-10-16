"""
paper_models.py — Data Models for Paper Trading Engine

Defines data structures for paper trading portfolios, paper positions, trades, orders,
and session summaries.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

# Re-export core execution models to ensure shared architecture with backtesting
from backtest_models import Order as PaperOrder
from backtest_models import Position as PaperPosition
from backtest_models import Trade as PaperTrade


@dataclass
class PaperPortfolio:
    """Current live state of the paper trading portfolio.

    Attributes:
        cash: Current available cash balance.
        equity: Total portfolio equity (cash + open positions mark value).
        unrealized_pnl: Open positions unrealized PnL.
        realized_pnl: Accumulated realized profit/loss.
        daily_pnl: Session/Daily PnL delta.
        session_return_percent: Percentage return since session start.
        open_positions: List of active PaperPosition objects.
    """
    cash: float = 100000.0
    equity: float = 100000.0
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0
    daily_pnl: float = 0.0
    session_return_percent: float = 0.0
    open_positions: List[PaperPosition] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert PaperPortfolio to clean dictionary."""
        return {
            "cash": round(self.cash, 2),
            "equity": round(self.equity, 2),
            "unrealized_pnl": round(self.unrealized_pnl, 2),
            "realized_pnl": round(self.realized_pnl, 2),
            "daily_pnl": round(self.daily_pnl, 2),
            "session_return_percent": round(self.session_return_percent, 2),
            "open_positions": [
                {
                    "id": p.id,
                    "symbol": p.symbol,
                    "side": p.side,
                    "entry_price": round(p.entry_price, 4),
                    "current_price": round(p.current_price, 4),
                    "quantity": p.quantity,
                    "unrealized_pnl": round(p.unrealized_pnl, 2),
                }
                for p in self.open_positions
            ],
        }


@dataclass
class SessionSummary:
    """Summary of a paper trading session lifecycle.

    Attributes:
        session_id: Unique session UUID.
        symbol: Target trading symbol.
        status: Session status ('ACTIVE', 'STOPPED', 'COMPLETED').
        start_time: ISO start timestamp.
        end_time: ISO completion timestamp.
        initial_capital: Starting capital.
        ending_capital: Final equity balance.
        trade_count: Total trades executed.
        realized_pnl: Net realized profit/loss.
        performance_summary: Detailed metrics summary.
    """
    session_id: str
    symbol: str
    status: str = "ACTIVE"
    start_time: str = ""
    end_time: Optional[str] = None
    initial_capital: float = 100000.0
    ending_capital: float = 100000.0
    trade_count: int = 0
    realized_pnl: float = 0.0
    performance_summary: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert SessionSummary to clean dictionary."""
        return {
            "session_id": self.session_id,
            "symbol": self.symbol,
            "status": self.status,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "initial_capital": round(self.initial_capital, 2),
            "ending_capital": round(self.ending_capital, 2),
            "trade_count": self.trade_count,
            "realized_pnl": round(self.realized_pnl, 2),
            "performance_summary": self.performance_summary,
        }
