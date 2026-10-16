"""
oms_models.py — Data Models for Enterprise Order Management System (OMS)

Defines OrderLifecycle, ChildOrder, ParentOrder, BracketOrder, OCOOrder,
OTOOrder, TrailingStopOrder, OrderAuditEntry, and OMSStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


class OrderLifecycle(str, Enum):
    CREATED = "CREATED"
    RISK_CHECKED = "RISK_CHECKED"
    APPROVED = "APPROVED"
    ROUTED_TO_EXECUTION = "ROUTED_TO_EXECUTION"
    FILLED = "FILLED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    REPLACED = "REPLACED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


@dataclass
class ChildOrder:
    """Child sliced order linked to a ParentOrder."""
    child_id: str
    parent_id: str
    symbol: str
    side: str
    order_type: str
    quantity: float
    price: float = 0.0
    status: str = "CREATED"

    def to_dict(self) -> Dict[str, Any]:
        """Convert ChildOrder to clean dictionary."""
        return {
            "child_id": self.child_id,
            "parent_id": self.parent_id,
            "symbol": self.symbol,
            "side": self.side,
            "order_type": self.order_type,
            "quantity": round(self.quantity, 4),
            "price": round(self.price, 2),
            "status": self.status,
        }


@dataclass
class ParentOrder:
    """Parent Order envelope owning lifecycle, child orders, and execution state."""
    parent_id: str
    symbol: str
    side: str
    order_type: str
    quantity: float
    filled_quantity: float = 0.0
    avg_fill_price: float = 0.0
    limit_price: float = 0.0
    stop_price: float = 0.0
    status: str = "CREATED"
    child_orders: List[ChildOrder] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parent_id": self.parent_id,
            "symbol": self.symbol,
            "side": self.side,
            "order_type": self.order_type,
            "quantity": round(self.quantity, 4),
            "filled_quantity": round(self.filled_quantity, 4),
            "avg_fill_price": round(self.avg_fill_price, 2),
            "limit_price": round(self.limit_price, 2),
            "stop_price": round(self.stop_price, 2),
            "status": self.status,
            "child_orders": [c.to_dict() for c in self.child_orders],
            "timestamp": self.timestamp,
        }


@dataclass
class BracketOrder:
    """Bracket Order container managing entry, take-profit, and stop-loss orders."""
    bracket_id: str
    entry_order: ParentOrder
    take_profit_order: ParentOrder
    stop_loss_order: ParentOrder

    def to_dict(self) -> Dict[str, Any]:
        return {
            "bracket_id": self.bracket_id,
            "entry_order": self.entry_order.to_dict(),
            "take_profit_order": self.take_profit_order.to_dict(),
            "stop_loss_order": self.stop_loss_order.to_dict(),
        }


@dataclass
class OCOOrder:
    """One-Cancels-Other (OCO) Order container."""
    oco_id: str
    order_a: ParentOrder
    order_b: ParentOrder

    def to_dict(self) -> Dict[str, Any]:
        return {
            "oco_id": self.oco_id,
            "order_a": self.order_a.to_dict(),
            "order_b": self.order_b.to_dict(),
        }


@dataclass
class OTOOrder:
    """One-Triggers-Other (OTO) Order container."""
    oto_id: str
    primary_order: ParentOrder
    secondary_order: ParentOrder

    def to_dict(self) -> Dict[str, Any]:
        return {
            "oto_id": self.oto_id,
            "primary_order": self.primary_order.to_dict(),
            "secondary_order": self.secondary_order.to_dict(),
        }


@dataclass
class TrailingStopOrder:
    """Dynamic trailing stop order."""
    order_id: str
    symbol: str
    quantity: float
    trail_amount_dollars: float = 2.0
    peak_price: float = 0.0
    stop_price: float = 0.0
    status: str = "ACTIVE"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "order_id": self.order_id,
            "symbol": self.symbol,
            "quantity": round(self.quantity, 4),
            "trail_amount_dollars": round(self.trail_amount_dollars, 2),
            "peak_price": round(self.peak_price, 2),
            "stop_price": round(self.stop_price, 2),
            "status": self.status,
        }


@dataclass
class OrderAuditEntry:
    """Immutable audit trail record for order state transitions."""
    entry_id: str
    order_id: str
    from_state: str
    to_state: str
    description: str
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entry_id": self.entry_id,
            "order_id": self.order_id,
            "from_state": self.from_state,
            "to_state": self.to_state,
            "description": self.description,
            "timestamp": self.timestamp,
        }


@dataclass
class OMSStatistics:
    """Operational metrics tracking the OrderManagementSystem."""
    total_orders_managed: int = 0
    active_orders: int = 0
    filled_orders: int = 0
    cancelled_orders: int = 0
    replaced_orders: int = 0
    bracket_orders_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_orders_managed": self.total_orders_managed,
            "active_orders": self.active_orders,
            "filled_orders": self.filled_orders,
            "cancelled_orders": self.cancelled_orders,
            "replaced_orders": self.replaced_orders,
            "bracket_orders_count": self.bracket_orders_count,
        }
