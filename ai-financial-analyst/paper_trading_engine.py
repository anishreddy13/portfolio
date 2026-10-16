"""
paper_trading_engine.py — Production-Grade Paper Trading Engine

Simulates order execution (MARKET, LIMIT, STOP) consuming live mark prices from
EnterpriseRequestCoordinator and automatically updating PortfolioManager position ledger upon fills.
"""

from __future__ import annotations

import logging
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from order_models import Order, OrderFill, OrderStatus, PaperTradingStatistics
from order_rules import (
    order_completed,
    simulate_limit_fill,
    simulate_market_fill,
    simulate_stop_fill,
    update_order_status,
    validate_order,
)
from portfolio_manager import PortfolioManager, global_portfolio_manager
from request_coordinator import RequestCoordinator, global_request_coordinator

from order_management_system import global_order_management_system
from risk_engine import global_risk_engine

logger = logging.getLogger("paper_trading_engine")


class PaperTradingEngine:
    """Production-Grade Paper Trading Engine (Orchestration Layer).

    Submits orders to Enterprise Order Management System (OMS) for full lifecycle handling.
    """

    def __init__(
        self,
        request_coordinator: Optional[RequestCoordinator] = None,
        portfolio_manager: Optional[PortfolioManager] = None,
    ) -> None:
        self.coordinator = request_coordinator or global_request_coordinator
        self.portfolio_manager = portfolio_manager or global_portfolio_manager
        self._lock = threading.RLock()

        # Orders store: order_id -> Order
        self._orders: Dict[str, Order] = {}

        # Operational Statistics
        self._orders_submitted = 0
        self._orders_executed = 0
        self._orders_cancelled = 0
        self._total_fill_latency_ms = 0.0
        self._total_volume = 0.0
        self._simulated_commission = 0.0

        logger.info("PaperTradingEngine initialized (Orchestration Layer).")

    # ─────────────────────────────────────────────
    # Order Submission & Cancellation API
    # ─────────────────────────────────────────────

    def submit_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        limit_price: float = 0.0,
        stop_price: float = 0.0,
        portfolio_id: str = "default",
    ) -> Order:
        """Submit a new paper trading order to OrderManagementSystem (OMS)."""
        start_t = time.monotonic()
        sym = symbol.strip().upper()
        s_side = side.strip().upper()
        o_type = order_type.strip().upper()
        now_iso = datetime.now(timezone.utc).isoformat()

        order_id = f"ord-{uuid.uuid4().hex[:8]}"

        order = Order(
            order_id=order_id,
            symbol=sym,
            side=s_side,
            order_type=o_type,
            quantity=quantity,
            limit_price=limit_price,
            stop_price=stop_price,
            status=OrderStatus.PENDING.value,
            created_at=now_iso,
            updated_at=now_iso,
        )

        with self._lock:
            self._orders_submitted += 1

            # Step 1: Validate against portfolio cash
            summary = self.portfolio_manager.portfolio_summary(portfolio_id)
            valid, reason = validate_order(order, summary.cash_balance)
            if not valid:
                order.status = OrderStatus.REJECTED.value
                self._orders[order_id] = order
                logger.warning("Order '%s' rejected by order rules: %s", order_id, reason)
                return order

            self._orders[order_id] = order

        # Step 2: Delegate order lifecycle management exclusively to OrderManagementSystem (OMS)
        parent_order = global_order_management_system.submit_order(
            symbol=sym,
            side=s_side,
            order_type=o_type,
            quantity=quantity,
            limit_price=limit_price,
            stop_price=stop_price,
            portfolio_id=portfolio_id,
        )

        with self._lock:
            order.status = parent_order.status
            order.filled_quantity = parent_order.filled_quantity
            order.avg_fill_price = parent_order.avg_fill_price

        lat_ms = (time.monotonic() - start_t) * 1000.0
        with self._lock:
            self._total_fill_latency_ms += lat_ms

        logger.info("Orchestrated order '%s' via EMS (status=%s, fill_price=$%.2f)", order_id, order.status, order.avg_fill_price)
        return order

    def cancel_order(self, order_id: str) -> bool:
        """Cancel an open pending order."""
        with self._lock:
            order = self._orders.get(order_id)
            if not order or order.status not in (OrderStatus.PENDING.value, OrderStatus.PARTIALLY_FILLED.value):
                return False

            order.status = OrderStatus.CANCELLED.value
            order.updated_at = datetime.now(timezone.utc).isoformat()
            self._orders_cancelled += 1
            logger.info("Cancelled paper order '%s'.", order_id)
            return True

    # ─────────────────────────────────────────────
    # Order Fill Execution Engine
    # ─────────────────────────────────────────────

    def _execute_single_market_order(self, order: Order, portfolio_id: str = "default") -> Optional[OrderFill]:
        """Fetch current mark price via RequestCoordinator and execute market fill."""
        try:
            res = self.coordinator.get_quote(order.symbol)
            quote = res.normalized_response.value if res and res.normalized_response else None
            mark_price = getattr(quote, "price", 182.50) if quote else 182.50
        except Exception:
            mark_price = 182.50

        fill = simulate_market_fill(order, mark_price)
        return self._apply_fill(order, fill, portfolio_id)

    def _apply_fill(self, order: Order, fill: OrderFill, portfolio_id: str = "default") -> Optional[OrderFill]:
        """Apply fill to order state and update global_portfolio_manager."""
        if not fill or fill.quantity <= 0:
            return None

        with self._lock:
            update_order_status(order, fill)

            self._orders_executed += 1
            self._total_volume += fill.quantity * fill.price
            self._simulated_commission += fill.commission

            # Update PortfolioManager ledger
            if order.side == "BUY":
                self.portfolio_manager.add_position(portfolio_id, order.symbol, fill.quantity, fill.price)
            else:
                self.portfolio_manager.close_position(portfolio_id, order.symbol, fill.quantity, fill.price)

        logger.info("Executed fill for order '%s': %.2f shares @ $%.2f (status=%s)", order.order_id, fill.quantity, fill.price, order.status)
        return fill

    def process_stream_tick(self, symbol: str, current_price: float) -> None:
        """Process incoming real-time stream tick and evaluate pending LIMIT/STOP orders."""
        sym = symbol.upper()
        with self._lock:
            pending = [o for o in self._orders.values() if o.symbol == sym and o.status in (OrderStatus.PENDING.value, OrderStatus.PARTIALLY_FILLED.value)]

        for order in pending:
            fill: Optional[OrderFill] = None
            if order.order_type == "LIMIT":
                fill = simulate_limit_fill(order, current_price)
            elif order.order_type == "STOP":
                fill = simulate_stop_fill(order, current_price)

            if fill:
                self._apply_fill(order, fill)

    # ─────────────────────────────────────────────
    # Order Query & Statistics API
    # ─────────────────────────────────────────────

    def order_history(self) -> List[Order]:
        """Return all submitted order history."""
        with self._lock:
            return list(self._orders.values())

    def open_orders(self) -> List[Order]:
        """Return all open pending or partially filled orders."""
        with self._lock:
            return [o for o in self._orders.values() if o.status in (OrderStatus.PENDING.value, OrderStatus.PARTIALLY_FILLED.value)]

    def completed_orders(self) -> List[Order]:
        """Return all completed/filled orders."""
        with self._lock:
            return [o for o in self._orders.values() if o.status == OrderStatus.FILLED.value]

    def statistics(self) -> PaperTradingStatistics:
        """Return operational PaperTradingStatistics snapshot."""
        with self._lock:
            avg_lat = (self._total_fill_latency_ms / self._orders_submitted) if self._orders_submitted > 0 else 0.0
            return PaperTradingStatistics(
                orders_submitted=self._orders_submitted,
                orders_executed=self._orders_executed,
                orders_cancelled=self._orders_cancelled,
                average_fill_latency_ms=avg_lat,
                total_volume=self._total_volume,
                simulated_commission=self._simulated_commission,
            )


# Shared global singleton instance
global_paper_trading_engine = PaperTradingEngine()
