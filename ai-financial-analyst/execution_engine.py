"""
execution_engine.py — Simulated Execution Engine for Backtesting

Simulates account balance, cash, open position management (enforces max 1 position per symbol),
simulated order matching (MARKET, LIMIT, STOP), commission, and slippage.

Operates bar-by-bar in an event-driven loop without lookahead bias.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, List, Optional, Tuple

from backtest_models import EquityCurvePoint, Order, Position, Trade

logger = logging.getLogger("execution_engine")


class ExecutionEngine:
    """Simulated trade execution and portfolio accounting engine.

    Usage::

        engine = ExecutionEngine(initial_capital=100000.0, commission=0.001, slippage=0.0005)
        engine.on_candle(candle, signal_action, sl_target, tp_target)
    """

    def __init__(
        self,
        initial_capital: float = 100000.0,
        commission: float = 0.001,  # 0.1% commission
        slippage: float = 0.0005,   # 0.05% slippage
    ) -> None:
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.commission_rate = commission
        self.slippage_rate = slippage

        self.position: Optional[Position] = None
        self.pending_orders: List[Order] = []
        self.closed_trades: List[Trade] = []
        self.equity_curve: List[EquityCurvePoint] = []
        self.peak_equity = initial_capital

        logger.info(
            "ExecutionEngine initialized. Capital=%.2f, Commission=%.4f, Slippage=%.4f",
            initial_capital, commission, slippage
        )

    @property
    def current_equity(self) -> float:
        """Calculate total current account equity (cash + position value)."""
        if self.position is None:
            return self.cash
        pos_val = self.position.quantity * self.position.current_price
        return self.cash + pos_val

    # ── Bar-by-bar Event Processing ────────────────────────────

    def on_candle(
        self,
        candle: Any,
        signal_action: Optional[str] = None,  # 'BUY', 'SELL', 'CLOSE'
        stop_loss_price: Optional[float] = None,
        take_profit_price: Optional[float] = None,
    ) -> None:
        """Process a single bar candle event.

        Steps:
          1. Update current position mark price & check Stop Loss / Take Profit triggers.
          2. Execute pending LIMIT / STOP orders against candle range.
          3. Process signal action (BUY / SELL / CLOSE).
          4. Record equity curve snapshot.
        """
        timestamp = getattr(candle, "date", str(candle))
        high = float(getattr(candle, "high", 0.0))
        low = float(getattr(candle, "low", 0.0))
        close = float(getattr(candle, "close", 0.0))

        # Step 1: Update Open Position & Check SL / TP
        if self.position is not None:
            self.position.current_price = close
            self._check_position_risk_exits(candle)

        # Step 2: Fill Pending Orders (Limit / Stop)
        self._match_pending_orders(candle)

        # Step 3: Process Signal Action if no risk exit occurred on this bar
        if signal_action:
            self._handle_signal(signal_action, candle, stop_loss_price, take_profit_price)

        # Step 4: Record Equity Curve Point
        eq = self.current_equity
        if eq > self.peak_equity:
            self.peak_equity = eq

        dd = ((self.peak_equity - eq) / self.peak_equity) * 100.0 if self.peak_equity > 0 else 0.0

        self.equity_curve.append(
            EquityCurvePoint(
                timestamp=timestamp,
                equity=round(eq, 2),
                cash=round(self.cash, 2),
                drawdown_percent=round(dd, 2),
            )
        )

    # ── Risk Exit Matching (SL / TP) ───────────────────────────

    def _check_position_risk_exits(self, candle: Any) -> None:
        if self.position is None:
            return

        high = float(getattr(candle, "high", 0.0))
        low = float(getattr(candle, "low", 0.0))
        timestamp = getattr(candle, "date", str(candle))
        pos = self.position

        if pos.side == "LONG":
            # Check Stop Loss (Triggered if Low <= Stop Loss)
            if pos.stop_loss and low <= pos.stop_loss:
                exit_p = pos.stop_loss * (1.0 - self.slippage_rate)
                self._close_position(exit_p, timestamp, exit_reason="STOP_LOSS")
                return

            # Check Take Profit (Triggered if High >= Take Profit)
            if pos.take_profit and high >= pos.take_profit:
                exit_p = pos.take_profit * (1.0 - self.slippage_rate)
                self._close_position(exit_p, timestamp, exit_reason="TAKE_PROFIT")
                return

        elif pos.side == "SHORT":
            # Check Stop Loss for Short (Triggered if High >= Stop Loss)
            if pos.stop_loss and high >= pos.stop_loss:
                exit_p = pos.stop_loss * (1.0 + self.slippage_rate)
                self._close_position(exit_p, timestamp, exit_reason="STOP_LOSS")
                return

            # Check Take Profit for Short (Triggered if Low <= Take Profit)
            if pos.take_profit and low <= pos.take_profit:
                exit_p = pos.take_profit * (1.0 + self.slippage_rate)
                self._close_position(exit_p, timestamp, exit_reason="TAKE_PROFIT")
                return

    # ── Order Matching ─────────────────────────────────────────

    def _match_pending_orders(self, candle: Any) -> None:
        if not self.pending_orders:
            return

        high = float(getattr(candle, "high", 0.0))
        low = float(getattr(candle, "low", 0.0))
        timestamp = getattr(candle, "date", str(candle))

        remaining: List[Order] = []
        for order in self.pending_orders:
            filled = False
            fill_price = 0.0

            if order.order_type == "LIMIT":
                if order.side == "BUY" and low <= order.price:
                    fill_price = order.price * (1.0 + self.slippage_rate)
                    filled = True
                elif order.side == "SELL" and high >= order.price:
                    fill_price = order.price * (1.0 - self.slippage_rate)
                    filled = True

            elif order.order_type == "STOP":
                if order.side == "BUY" and high >= order.price:
                    fill_price = order.price * (1.0 + self.slippage_rate)
                    filled = True
                elif order.side == "SELL" and low <= order.price:
                    fill_price = order.price * (1.0 - self.slippage_rate)
                    filled = True

            if filled:
                self._execute_fill(order.side, fill_price, order.quantity, timestamp, order.stop_loss, order.take_profit)
            else:
                remaining.append(order)

        self.pending_orders = remaining

    # ── Signal Handling ────────────────────────────────────────

    def _handle_signal(
        self,
        signal_action: str,
        candle: Any,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None,
    ) -> None:
        close = float(getattr(candle, "close", 0.0))
        timestamp = getattr(candle, "date", str(candle))

        if signal_action == "CLOSE" and self.position is not None:
            exit_p = close * (1.0 - self.slippage_rate if self.position.side == "LONG" else 1.0 + self.slippage_rate)
            self._close_position(exit_p, timestamp, exit_reason="SIGNAL")
            return

        if signal_action in ("BUY", "LONG"):
            if self.position is not None:
                # Risk Constraint: Max 1 position per symbol — ignore duplicate entry signal
                return
            entry_p = close * (1.0 + self.slippage_rate)
            qty = self._calculate_position_quantity(entry_p)
            if qty > 0:
                self._execute_fill("BUY", entry_p, qty, timestamp, stop_loss, take_profit)

        elif signal_action in ("SELL", "SHORT"):
            if self.position is not None and self.position.side == "LONG":
                # Close LONG on SELL signal
                exit_p = close * (1.0 - self.slippage_rate)
                self._close_position(exit_p, timestamp, exit_reason="SIGNAL")
            elif self.position is None:
                # Open SHORT position
                entry_p = close * (1.0 - self.slippage_rate)
                qty = self._calculate_position_quantity(entry_p)
                if qty > 0:
                    self._execute_fill("SHORT", entry_p, qty, timestamp, stop_loss, take_profit)

    # ── Fill & Close Helpers ────────────────────────────────────

    def _execute_fill(
        self,
        side: str,
        price: float,
        quantity: float,
        timestamp: str,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None,
    ) -> None:
        cost = price * quantity
        comm = cost * self.commission_rate
        total_cost = cost + comm

        if total_cost > self.cash:
            # Scale down quantity to available cash
            quantity = (self.cash * 0.99) / (price * (1.0 + self.commission_rate))
            if quantity <= 0:
                return
            cost = price * quantity
            comm = cost * self.commission_rate
            total_cost = cost + comm

        self.cash -= total_cost
        pos_side = "LONG" if side in ("BUY", "LONG") else "SHORT"

        self.position = Position(
            id=str(uuid.uuid4())[:8],
            symbol="ASSET",
            side=pos_side,
            entry_price=price,
            current_price=price,
            quantity=quantity,
            stop_loss=stop_loss,
            take_profit=take_profit,
            entry_timestamp=timestamp,
            unrealized_pnl=0.0,
        )
        logger.debug("Position OPENED [%s] qty=%.2f @ %.2f", pos_side, quantity, price)

    def _close_position(self, exit_price: float, timestamp: str, exit_reason: str = "SIGNAL") -> None:
        if self.position is None:
            return

        pos = self.position
        proceeds = pos.quantity * exit_price
        comm = proceeds * self.commission_rate
        net_proceeds = proceeds - comm

        if pos.side == "LONG":
            pnl = (exit_price - pos.entry_price) * pos.quantity - (pos.entry_price * pos.quantity * self.commission_rate) - comm
            pnl_pct = ((exit_price - pos.entry_price) / pos.entry_price) * 100.0
        else:
            pnl = (pos.entry_price - exit_price) * pos.quantity - (pos.entry_price * pos.quantity * self.commission_rate) - comm
            pnl_pct = ((pos.entry_price - exit_price) / pos.entry_price) * 100.0

        self.cash += (pos.quantity * pos.entry_price) + pnl

        trade = Trade(
            id=str(uuid.uuid4())[:8],
            symbol=pos.symbol,
            side=pos.side,
            entry_price=pos.entry_price,
            exit_price=exit_price,
            quantity=pos.quantity,
            entry_timestamp=pos.entry_timestamp,
            exit_timestamp=timestamp,
            pnl=pnl,
            pnl_percent=pnl_pct,
            exit_reason=exit_reason,
            commission=comm,
            slippage=pos.entry_price * pos.quantity * self.slippage_rate,
        )
        self.closed_trades.append(trade)
        self.position = None
        logger.debug("Position CLOSED [%s] pnl=%.2f (%.2f%%)", exit_reason, pnl, pnl_pct)

    def _calculate_position_quantity(self, price: float) -> float:
        """Calculate position sizing (defaults to 95% equity allocation)."""
        usable = self.cash * 0.95
        if price <= 0 or usable <= 0:
            return 0.0
        return usable / (price * (1.0 + self.commission_rate))
