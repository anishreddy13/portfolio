"""
paper_session.py — Paper Trading Session Lifecycle Manager

Manages the lifecycle of a live paper trading session.
REUSES ExecutionEngine from execution_engine.py to guarantee shared execution
architecture with backtesting and zero duplicate trade logic.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from execution_engine import ExecutionEngine
from market_models import OHLCCandle, Quote
from paper_models import PaperPortfolio, PaperPosition, SessionSummary

logger = logging.getLogger("paper_session")


class PaperSession:
    """Manages an active paper trading session around an ExecutionEngine instance.

    Usage::

        session = PaperSession(symbol="AAPL", initial_capital=100000.0)
        session.start()
        session.update_tick(quote, candle, signal_action="BUY")
        portfolio = session.get_portfolio()
        summary = session.stop()
    """

    def __init__(
        self,
        symbol: str,
        initial_capital: float = 100000.0,
        commission: float = 0.001,
        slippage: float = 0.0005,
    ) -> None:
        self.session_id = str(uuid.uuid4())
        self.symbol = symbol.upper()
        self.initial_capital = initial_capital
        self.status = "STOPPED"
        self.start_time = ""
        self.end_time: Optional[str] = None

        # REUSE existing ExecutionEngine from execution_engine.py — no code duplication
        self._exec_engine = ExecutionEngine(
            initial_capital=initial_capital,
            commission=commission,
            slippage=slippage,
        )

        logger.info(
            "PaperSession created. SessionID=%s, Symbol=%s, Capital=%.2f",
            self.session_id, self.symbol, initial_capital
        )

    def start(self) -> None:
        """Start the paper trading session."""
        self.status = "ACTIVE"
        self.start_time = datetime.now(timezone.utc).isoformat()
        self.end_time = None
        logger.info("PaperSession STARTED. SessionID=%s, Time=%s", self.session_id, self.start_time)

    def stop(self) -> SessionSummary:
        """Stop the paper trading session and return performance summary."""
        if self.status == "STOPPED":
            return self.get_summary()

        self.status = "STOPPED"
        self.end_time = datetime.now(timezone.utc).isoformat()

        # Close open position at current price on session termination
        if self._exec_engine.position is not None:
            self._exec_engine._close_position(
                exit_price=self._exec_engine.position.current_price,
                timestamp=self.end_time,
                exit_reason="SESSION_STOPPED"
            )

        logger.info("PaperSession STOPPED. SessionID=%s, EndTime=%s", self.session_id, self.end_time)
        return self.get_summary()

    def update_tick(
        self,
        quote: Optional[Quote],
        candle: Any,
        signal_action: Optional[str] = None,
        stop_loss_price: Optional[float] = None,
        take_profit_price: Optional[float] = None,
    ) -> None:
        """Process a live tick update through the ExecutionEngine.

        Args:
            quote: Live Quote object.
            candle: Latest OHLCCandle or synthetic candle bar.
            signal_action: Strategy signal ('BUY', 'SELL', 'CLOSE', or None).
            stop_loss_price: Optional stop loss target price.
            take_profit_price: Optional take profit target price.
        """
        if self.status != "ACTIVE":
            logger.warning("Attempted tick update on inactive session %s", self.session_id)
            return

        # Delegate execution directly to ExecutionEngine.on_candle()
        self._exec_engine.on_candle(
            candle=candle,
            signal_action=signal_action,
            stop_loss_price=stop_loss_price,
            take_profit_price=take_profit_price,
        )

    def get_portfolio(self) -> PaperPortfolio:
        """Return current PaperPortfolio state."""
        pos = self._exec_engine.position
        open_positions = [pos] if pos is not None else []

        unrealized = (
            (pos.current_price - pos.entry_price) * pos.quantity if pos and pos.side == "LONG"
            else ((pos.entry_price - pos.current_price) * pos.quantity if pos else 0.0)
        )

        realized = sum(t.pnl for t in self._exec_engine.closed_trades)
        equity = self._exec_engine.current_equity
        session_return_pct = ((equity - self.initial_capital) / self.initial_capital) * 100.0

        return PaperPortfolio(
            cash=self._exec_engine.cash,
            equity=equity,
            unrealized_pnl=unrealized,
            realized_pnl=realized,
            daily_pnl=unrealized + realized,
            session_return_percent=session_return_pct,
            open_positions=open_positions,
        )

    def get_summary(self) -> SessionSummary:
        """Return SessionSummary object."""
        realized = sum(t.pnl for t in self._exec_engine.closed_trades)
        ending_capital = self._exec_engine.current_equity
        trades = self._exec_engine.closed_trades

        perf_summary = {
            "total_trades": len(trades),
            "winning_trades": len([t for t in trades if t.pnl > 0]),
            "losing_trades": len([t for t in trades if t.pnl <= 0]),
            "session_return_percent": round(((ending_capital - self.initial_capital) / self.initial_capital) * 100.0, 2),
        }

        return SessionSummary(
            session_id=self.session_id,
            symbol=self.symbol,
            status=self.status,
            start_time=self.start_time,
            end_time=self.end_time,
            initial_capital=self.initial_capital,
            ending_capital=ending_capital,
            trade_count=len(trades),
            realized_pnl=realized,
            performance_summary=perf_summary,
        )
