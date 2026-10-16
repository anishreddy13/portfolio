"""
order_models.py — Data Models for Paper Trading Engine

Defines OrderStatus, OrderType, OrderSide enums, and OrderFill, Trade, Order,
OrderBook, OrderExecution, and PaperTradingStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    FILLED = "FILLED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


class OrderType(str, Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP = "STOP"


class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


@dataclass
class OrderFill:
    """Represents an executed order fill event.

    Attributes:
        fill_id: Unique fill identifier string.
        order_id: Associated order identifier string.
        symbol: Target ticker symbol.
        quantity: Filled share quantity.
        price: Fill execution price.
        slippage: Execution price slippage in dollars.
        commission: Simulated brokerage commission in dollars.
        timestamp: ISO timestamp of fill execution.
    """
    fill_id: str
    order_id: str
    symbol: str
    quantity: float
    price: float
    slippage: float = 0.0
    commission: float = 0.0
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert OrderFill to clean dictionary."""
        return {
            "fill_id": self.fill_id,
            "order_id": self.order_id,
            "symbol": self.symbol,
            "quantity": round(self.quantity, 4),
            "price": round(self.price, 2),
            "slippage": round(self.slippage, 4),
            "commission": round(self.commission, 2),
            "timestamp": self.timestamp,
        }


@dataclass
class Trade:
    """Closed trade execution summary record."""
    trade_id: str
    symbol: str
    side: str
    quantity: float
    entry_price: float
    exit_price: float
    realized_pnl: float
    executed_at: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "trade_id": self.trade_id,
            "symbol": self.symbol,
            "side": self.side,
            "quantity": round(self.quantity, 4),
            "entry_price": round(self.entry_price, 2),
            "exit_price": round(self.exit_price, 2),
            "realized_pnl": round(self.realized_pnl, 2),
            "executed_at": self.executed_at,
        }


@dataclass
class Order:
    """Represents a submitted paper trading order.

    Attributes:
        order_id: Unique order identifier string.
        symbol: Target ticker symbol.
        side: OrderSide ('BUY', 'SELL').
        order_type: OrderType ('MARKET', 'LIMIT', 'STOP').
        quantity: Total order share quantity.
        filled_quantity: Accumulated filled share quantity.
        limit_price: Target limit price for LIMIT orders.
        stop_price: Target stop trigger price for STOP orders.
        avg_fill_price: Average fill price across executions.
        status: OrderStatus ('PENDING', 'FILLED', 'CANCELLED', 'REJECTED').
        created_at: ISO timestamp of order submission.
        updated_at: ISO timestamp of last order mutation.
        fills: List of associated OrderFill objects.
    """
    order_id: str
    symbol: str
    side: str
    order_type: str
    quantity: float
    filled_quantity: float = 0.0
    limit_price: float = 0.0
    stop_price: float = 0.0
    avg_fill_price: float = 0.0
    status: str = "PENDING"
    created_at: str = ""
    updated_at: str = ""
    fills: List[OrderFill] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert Order to clean dictionary."""
        return {
            "order_id": self.order_id,
            "symbol": self.symbol,
            "side": self.side,
            "order_type": self.order_type,
            "quantity": round(self.quantity, 4),
            "filled_quantity": round(self.filled_quantity, 4),
            "limit_price": round(self.limit_price, 2),
            "stop_price": round(self.stop_price, 2),
            "avg_fill_price": round(self.avg_fill_price, 2),
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "fills": [f.to_dict() for f in self.fills],
        }


@dataclass
class OrderBook:
    """Simulated Level-2 Order Book frame for paper execution."""
    symbol: str
    bids: List[Dict[str, float]] = field(default_factory=list)
    asks: List[Dict[str, float]] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "bids": self.bids,
            "asks": self.asks,
            "timestamp": self.timestamp,
        }


@dataclass
class OrderExecution:
    """Individual trade execution audit log."""
    execution_id: str
    order_id: str
    symbol: str
    side: str
    price: float
    quantity: float
    executed_at: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "execution_id": self.execution_id,
            "order_id": self.order_id,
            "symbol": self.symbol,
            "side": self.side,
            "price": round(self.price, 2),
            "quantity": round(self.quantity, 4),
            "executed_at": self.executed_at,
        }


@dataclass
class PaperTradingStatistics:
    """Operational metrics tracking PaperTradingEngine performance."""
    orders_submitted: int = 0
    orders_executed: int = 0
    orders_cancelled: int = 0
    average_fill_latency_ms: float = 0.0
    total_volume: float = 0.0
    simulated_commission: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "orders_submitted": self.orders_submitted,
            "orders_executed": self.orders_executed,
            "orders_cancelled": self.orders_cancelled,
            "average_fill_latency_ms": round(self.average_fill_latency_ms, 2),
            "total_volume": round(self.total_volume, 2),
            "simulated_commission": round(self.simulated_commission, 2),
        }
