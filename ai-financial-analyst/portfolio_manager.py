"""
portfolio_manager.py — Portfolio & Position Management Subsystem

Provides central portfolio tracking, position ledger maintenance, and P&L accounting.
Reuses EnterpriseRequestCoordinator to fetch mark-to-market prices without duplicate quote logic.
"""

from __future__ import annotations

import logging
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

from portfolio_models import (
    Portfolio,
    PortfolioAllocation,
    PortfolioPerformance,
    PortfolioSummary,
    Position,
    RealizedPnL,
)
from portfolio_rules import (
    calculate_cash_balance,
    calculate_daily_change,
    calculate_portfolio_allocation,
    calculate_position_value,
    calculate_realized_pnl,
    calculate_risk_score,
    calculate_total_equity,
    calculate_unrealized_pnl,
)
from request_coordinator import RequestCoordinator, global_request_coordinator

# Late-bound import to avoid circular dependency at module level
_audit_engine = None


def _get_audit_engine():
    global _audit_engine
    if _audit_engine is None:
        try:
            from audit_engine import global_audit_engine
            _audit_engine = global_audit_engine
        except ImportError:
            _audit_engine = None
    return _audit_engine


logger = logging.getLogger("portfolio_manager")


class PortfolioManager:
    """Portfolio & Position Management Subsystem.

    Usage::

        pm = PortfolioManager()
        pm.create_portfolio("default", "Main Trading Portfolio")
        pm.add_position("default", "AAPL", 50, 175.0)
        summary = pm.portfolio_summary("default")
        print(summary.total_equity, summary.performance.unrealized_pnl)
    """

    def __init__(self, request_coordinator: Optional[RequestCoordinator] = None) -> None:
        self.coordinator = request_coordinator or global_request_coordinator
        self._lock = threading.RLock()

        # Portfolios map: portfolio_id -> Portfolio
        self._portfolios: Dict[str, Portfolio] = {}

        # Initialize default demo portfolio
        self.create_portfolio("default", "Enterprise CoPilot Portfolio", initial_cash=100000.0)
        self._seed_default_positions()

        logger.info("PortfolioManager subsystem initialized.")

    def _seed_default_positions(self) -> None:
        """Seed default demo holdings for initial presentation."""
        self.add_position("default", "AAPL", 50, 175.0)
        self.add_position("default", "MSFT", 25, 410.0)
        self.add_position("default", "NVDA", 10, 850.0)

    # ─────────────────────────────────────────────
    # Portfolio Lifecycle & Position Management
    # ─────────────────────────────────────────────

    def create_portfolio(self, portfolio_id: str, name: str, initial_cash: float = 100000.0) -> Portfolio:
        """Create a new portfolio entry."""
        pid = portfolio_id.strip()
        with self._lock:
            if pid in self._portfolios:
                return self._portfolios[pid]

            port = Portfolio(
                portfolio_id=pid,
                name=name,
                cash_balance=initial_cash,
                positions={},
                realized_pnl_history=[],
            )
            self._portfolios[pid] = port
            logger.info("Created portfolio '%s' (%s) with initial cash $%.2f", pid, name, initial_cash)
            return port

    def add_position(self, portfolio_id: str, symbol: str, quantity: float, cost_price: float) -> Position:
        """Add or increase a position in the portfolio."""
        pid = portfolio_id.strip()
        sym = symbol.strip().upper()

        with self._lock:
            port = self._portfolios.get(pid)
            if not port:
                port = self.create_portfolio(pid, f"Portfolio {pid}")

            total_cost = quantity * cost_price
            port.cash_balance = calculate_cash_balance(port.cash_balance, total_cost, is_buy=True)

            now_iso = datetime.now(timezone.utc).isoformat()

            if sym in port.positions:
                existing = port.positions[sym]
                new_qty = existing.quantity + quantity
                new_cost = (existing.quantity * existing.avg_cost_price + total_cost) / new_qty
                existing.quantity = new_qty
                existing.avg_cost_price = new_cost
                existing.updated_at = now_iso
                target_pos = existing
            else:
                target_pos = Position(
                    symbol=sym,
                    quantity=quantity,
                    avg_cost_price=cost_price,
                    current_price=cost_price,
                    updated_at=now_iso,
                )
                port.positions[sym] = target_pos

            # Record portfolio state change in AuditEngine
            aud = _get_audit_engine()
            if aud is not None:
                aud.record(
                    subsystem="PORTFOLIO_MANAGER",
                    event_type="POSITION_ADDED",
                    severity="INFO",
                    symbol=sym,
                    portfolio_id=pid,
                    payload={
                        "quantity": quantity,
                        "cost_price": cost_price,
                        "new_position_quantity": target_pos.quantity,
                        "cash_balance": port.cash_balance,
                    },
                )

            self._update_position_mark(target_pos)
            logger.info("Added position: portfolio=%s, symbol=%s, qty=%.2f, cost=%.2f", pid, sym, quantity, cost_price)
            return target_pos

    def close_position(self, portfolio_id: str, symbol: str, quantity: float, exit_price: float) -> Optional[RealizedPnL]:
        """Close or decrease a position and record realized P&L."""
        pid = portfolio_id.strip()
        sym = symbol.strip().upper()

        with self._lock:
            port = self._portfolios.get(pid)
            if not port or sym not in port.positions:
                return None

            pos = port.positions[sym]
            close_qty = min(quantity, pos.quantity)
            pnl_amt = calculate_realized_pnl(close_qty, pos.avg_cost_price, exit_price)

            trade_proceeds = close_qty * exit_price
            port.cash_balance = calculate_cash_balance(port.cash_balance, trade_proceeds, is_buy=False)

            pos.quantity -= close_qty
            pos.realized_pnl += pnl_amt

            now_iso = datetime.now(timezone.utc).isoformat()
            realized_rec = RealizedPnL(symbol=sym, pnl_amount=pnl_amt, closed_at=now_iso)
            port.realized_pnl_history.append(realized_rec)

            if pos.quantity <= 0:
                del port.positions[sym]

            logger.info("Closed position: portfolio=%s, symbol=%s, closed_qty=%.2f, realized_pnl=$%.2f", pid, sym, close_qty, pnl_amt)
            return realized_rec

    # ─────────────────────────────────────────────
    # Mark-to-Market Valuation using RequestCoordinator
    # ─────────────────────────────────────────────

    def _update_position_mark(self, position: Position) -> None:
        """Fetch live mark price via EnterpriseRequestCoordinator and update position metrics."""
        try:
            res = self.coordinator.get_quote(position.symbol)
            quote = res.normalized_response.value if res and res.normalized_response else None
            price_val = getattr(quote, "price", position.avg_cost_price) if quote else position.avg_cost_price

            position.current_price = price_val
            position.market_value = calculate_position_value(position.quantity, price_val)
            pnl_amt, pnl_pct = calculate_unrealized_pnl(position.quantity, position.avg_cost_price, price_val)
            position.unrealized_pnl = pnl_amt
            position.unrealized_pnl_pct = pnl_pct
            position.updated_at = datetime.now(timezone.utc).isoformat()
        except Exception as exc:
            logger.warning("Error fetching mark price for position '%s': %s", position.symbol, exc)
            position.market_value = calculate_position_value(position.quantity, position.avg_cost_price)

    def update_market_prices(self, portfolio_id: str = "default") -> None:
        """Update live mark-to-market valuations across all positions in portfolio."""
        with self._lock:
            port = self._portfolios.get(portfolio_id)
            if not port:
                return

            for pos in port.positions.values():
                self._update_position_mark(pos)

    # ─────────────────────────────────────────────
    # Portfolio Summary & Performance Reporting
    # ─────────────────────────────────────────────

    def portfolio_performance(self, portfolio_id: str = "default") -> PortfolioPerformance:
        """Calculate macro performance metrics for target portfolio."""
        self.update_market_prices(portfolio_id)

        with self._lock:
            port = self._portfolios.get(portfolio_id)
            if not port:
                return PortfolioPerformance()

            pos_list = list(port.positions.values())
            total_eq = calculate_total_equity(port.cash_balance, pos_list)
            unrealized_sum = sum(p.unrealized_pnl for p in pos_list)
            realized_sum = sum(r.pnl_amount for r in port.realized_pnl_history)
            daily_change_dollars, daily_change_pct = calculate_daily_change(pos_list)
            risk_sc = calculate_risk_score(pos_list, total_eq)

            return PortfolioPerformance(
                total_equity=total_eq,
                cash_balance=port.cash_balance,
                unrealized_pnl=unrealized_sum,
                realized_pnl=realized_sum,
                daily_change=daily_change_dollars,
                daily_change_pct=daily_change_pct,
                risk_score=risk_sc,
            )

    def portfolio_summary(self, portfolio_id: str = "default") -> PortfolioSummary:
        """Return full PortfolioSummary envelope."""
        self.update_market_prices(portfolio_id)

        with self._lock:
            port = self._portfolios.get(portfolio_id)
            if not port:
                port = self.create_portfolio(portfolio_id, "Default Portfolio")

            pos_list = list(port.positions.values())
            perf = self.portfolio_performance(portfolio_id)
            allocs = calculate_portfolio_allocation(pos_list, perf.total_equity)

            return PortfolioSummary(
                portfolio_id=port.portfolio_id,
                name=port.name,
                total_equity=perf.total_equity,
                cash_balance=port.cash_balance,
                positions=pos_list,
                performance=perf,
                allocations=allocs,
            )


# Shared global singleton instance
global_portfolio_manager = PortfolioManager()
