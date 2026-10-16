"""
order_rules.py — Pure Paper Trading Order Fill Rules

Contains pure mathematical algorithms for order validation, slippage simulation,
commission computation, market/limit/stop trigger evaluation, and fill calculations.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple

from order_models import Order, OrderFill, OrderSide, OrderStatus, OrderType

logger = logging.getLogger("order_rules")


def validate_order(order: Order, cash_balance: float) -> Tuple[bool, str]:
    """Validate submitted order parameters against cash balance and order rules."""
    if not order or not order.symbol or order.quantity <= 0:
        return (False, "Invalid order symbol or quantity.")

    if order.side not in ("BUY", "SELL"):
        return (False, f"Unsupported order side: {order.side}")

    if order.order_type not in ("MARKET", "LIMIT", "STOP"):
        return (False, f"Unsupported order type: {order.order_type}")

    if order.order_type == "LIMIT" and order.limit_price <= 0:
        return (False, "LIMIT orders require limit_price > 0.")

    if order.order_type == "STOP" and order.stop_price <= 0:
        return (False, "STOP orders require stop_price > 0.")

    # Cash check for BUY orders
    if order.side == "BUY":
        est_price = order.limit_price if order.limit_price > 0 else 100.0
        est_cost = order.quantity * est_price
        if est_cost > cash_balance:
            return (False, f"Insufficient cash balance (${cash_balance:.2f}) for estimated cost (${est_cost:.2f}).")

    return (True, "Order valid.")


def calculate_slippage(price: float, side: str, volume: float = 1000.0) -> float:
    """Simulate execution price slippage in dollars based on order side & market price."""
    # Slippage heuristic: ~0.02% of market price
    base_slippage = price * 0.0002
    return base_slippage if side.upper() == "BUY" else -base_slippage


def calculate_commission(quantity: float, price: float) -> float:
    """Calculate simulated zero-commission or fractional clearing fee ($0.005/share, min $0.00)."""
    return max(0.0, round(quantity * 0.0005, 2))


def calculate_execution_price(market_price: float, side: str, slippage: float) -> float:
    """Calculate effective execution price incorporating slippage."""
    exec_price = market_price + slippage
    return max(0.01, round(exec_price, 2))


def simulate_market_fill(order: Order, current_price: float) -> OrderFill:
    """Simulate instant market fill for MARKET orders."""
    fill_qty = order.quantity - order.filled_quantity
    slippage = calculate_slippage(current_price, order.side)
    exec_price = calculate_execution_price(current_price, order.side, slippage)
    comm = calculate_commission(fill_qty, exec_price)
    now_iso = datetime.now(timezone.utc).isoformat()

    return OrderFill(
        fill_id=f"fill-{uuid.uuid4().hex[:8]}",
        order_id=order.order_id,
        symbol=order.symbol,
        quantity=fill_qty,
        price=exec_price,
        slippage=abs(slippage),
        commission=comm,
        timestamp=now_iso,
    )


def simulate_limit_fill(order: Order, current_price: float) -> Optional[OrderFill]:
    """Evaluate LIMIT order trigger condition and produce OrderFill if triggered.

    Buy Limit: Triggers if current_price <= limit_price.
    Sell Limit: Triggers if current_price >= limit_price.
    """
    if order.order_type != "LIMIT" or order.limit_price <= 0:
        return None

    triggered = False
    if order.side == "BUY" and current_price <= order.limit_price:
        triggered = True
    elif order.side == "SELL" and current_price >= order.limit_price:
        triggered = True

    if triggered:
        return simulate_market_fill(order, current_price)

    return None


def simulate_stop_fill(order: Order, current_price: float) -> Optional[OrderFill]:
    """Evaluate STOP order trigger condition and produce OrderFill if triggered.

    Buy Stop: Triggers if current_price >= stop_price.
    Sell Stop: Triggers if current_price <= stop_price.
    """
    if order.order_type != "STOP" or order.stop_price <= 0:
        return None

    triggered = False
    if order.side == "BUY" and current_price >= order.stop_price:
        triggered = True
    elif order.side == "SELL" and current_price <= order.stop_price:
        triggered = True

    if triggered:
        return simulate_market_fill(order, current_price)

    return None


def order_completed(order: Order) -> bool:
    """Check if order has reached full fill status."""
    return order.filled_quantity >= order.quantity


def update_order_status(order: Order, fill: OrderFill) -> str:
    """Update order filled quantity, average fill price, and return new OrderStatus."""
    if not fill or fill.quantity <= 0:
        return order.status

    order.fills.append(fill)
    new_filled_qty = order.filled_quantity + fill.quantity

    # Calculate volume-weighted average fill price
    total_val = (order.filled_quantity * order.avg_fill_price) + (fill.quantity * fill.price)
    order.filled_quantity = new_filled_qty
    order.avg_fill_price = total_val / new_filled_qty if new_filled_qty > 0 else fill.price
    order.updated_at = datetime.now(timezone.utc).isoformat()

    if order.filled_quantity >= order.quantity:
        order.status = OrderStatus.FILLED.value
    else:
        order.status = OrderStatus.PARTIALLY_FILLED.value

    return order.status
