"""
oms_rules.py — Pure Order Management System Rules & Lifecycle Algorithms

Contains pure mathematical algorithms for validating parent orders, slicing child orders,
constructing Bracket/OCO/OTO order containers, state transitions, and audit generation.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from oms_models import (
    BracketOrder,
    ChildOrder,
    OCOOrder,
    OrderAuditEntry,
    OrderLifecycle,
    OTOOrder,
    ParentOrder,
    TrailingStopOrder,
)

logger = logging.getLogger("oms_rules")


def validate_parent_order(order: ParentOrder) -> Tuple[bool, str]:
    """Validate incoming ParentOrder envelope parameters."""
    if not order or not order.symbol or order.quantity <= 0:
        return (False, "Invalid symbol or quantity.")

    if order.side not in ("BUY", "SELL"):
        return (False, f"Unsupported side: {order.side}")

    return (True, "ParentOrder valid.")


def create_child_orders(parent: ParentOrder, slice_count: int = 2) -> List[ChildOrder]:
    """Slice a ParentOrder into sliced ChildOrders for execution routing."""
    if slice_count <= 1 or parent.quantity <= 1.0:
        return [
            ChildOrder(
                child_id=f"child-{uuid.uuid4().hex[:6]}",
                parent_id=parent.parent_id,
                symbol=parent.symbol,
                side=parent.side,
                order_type=parent.order_type,
                quantity=parent.quantity,
                price=parent.limit_price,
            )
        ]

    slice_qty = round(parent.quantity / slice_count, 4)
    children: List[ChildOrder] = []

    for i in range(slice_count):
        children.append(
            ChildOrder(
                child_id=f"child-{uuid.uuid4().hex[:6]}",
                parent_id=parent.parent_id,
                symbol=parent.symbol,
                side=parent.side,
                order_type=parent.order_type,
                quantity=slice_qty,
                price=parent.limit_price,
            )
        )

    return children


def create_bracket_order(
    symbol: str,
    side: str,
    qty: float,
    entry_p: float,
    tp_p: float,
    sl_p: float,
) -> BracketOrder:
    """Construct a full BracketOrder container (Entry, Take Profit, Stop Loss)."""
    now_iso = datetime.now(timezone.utc).isoformat()
    bid = f"brk-{uuid.uuid4().hex[:8]}"

    entry_order = ParentOrder(
        parent_id=f"pord-{uuid.uuid4().hex[:6]}",
        symbol=symbol,
        side=side,
        order_type="LIMIT" if entry_p > 0 else "MARKET",
        quantity=qty,
        limit_price=entry_p,
        timestamp=now_iso,
    )

    exit_side = "SELL" if side.upper() == "BUY" else "BUY"

    tp_order = ParentOrder(
        parent_id=f"pord-{uuid.uuid4().hex[:6]}",
        symbol=symbol,
        side=exit_side,
        order_type="LIMIT",
        quantity=qty,
        limit_price=tp_p,
        timestamp=now_iso,
    )

    sl_order = ParentOrder(
        parent_id=f"pord-{uuid.uuid4().hex[:6]}",
        symbol=symbol,
        side=exit_side,
        order_type="STOP",
        quantity=qty,
        stop_price=sl_p,
        timestamp=now_iso,
    )

    return BracketOrder(
        bracket_id=bid,
        entry_order=entry_order,
        take_profit_order=tp_order,
        stop_loss_order=sl_order,
    )


def create_oco_order(order_a: ParentOrder, order_b: ParentOrder) -> OCOOrder:
    """Construct a One-Cancels-Other (OCO) order container."""
    return OCOOrder(
        oco_id=f"oco-{uuid.uuid4().hex[:8]}",
        order_a=order_a,
        order_b=order_b,
    )


def create_oto_order(primary: ParentOrder, secondary: ParentOrder) -> OTOOrder:
    """Construct a One-Triggers-Other (OTO) order container."""
    return OTOOrder(
        oto_id=f"oto-{uuid.uuid4().hex[:8]}",
        primary_order=primary,
        secondary_order=secondary,
    )


def update_order_state(order: ParentOrder, new_state: str) -> str:
    """Transition ParentOrder status to new state."""
    order.status = new_state
    return order.status


def can_cancel(order: ParentOrder) -> bool:
    """Check if ParentOrder status allows cancellation."""
    return order is not None and order.status in (
        OrderLifecycle.CREATED.value,
        OrderLifecycle.RISK_CHECKED.value,
        OrderLifecycle.APPROVED.value,
        OrderLifecycle.ROUTED_TO_EXECUTION.value,
        OrderLifecycle.PARTIALLY_FILLED.value,
    )


def can_replace(order: ParentOrder) -> bool:
    """Check if ParentOrder status allows quantity/price replacement."""
    return can_cancel(order)


def trailing_stop_triggered(order: TrailingStopOrder, current_price: float) -> bool:
    """Evaluate trailing stop trigger condition based on peak price and trail amount."""
    if not order or order.status != "ACTIVE":
        return False

    if current_price > order.peak_price:
        order.peak_price = current_price
        order.stop_price = current_price - order.trail_amount_dollars

    return current_price <= order.stop_price


def audit_entry(order_id: str, from_state: str, to_state: str, desc: str) -> OrderAuditEntry:
    """Generate immutable audit record for state transition."""
    now_iso = datetime.now(timezone.utc).isoformat()
    return OrderAuditEntry(
        entry_id=f"audit-{uuid.uuid4().hex[:8]}",
        order_id=order_id,
        from_state=from_state,
        to_state=to_state,
        description=desc,
        timestamp=now_iso,
    )
