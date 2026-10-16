"""
broker_adapter_models.py — Data Models for Broker Adapter Engine

Defines BrokerSession, BrokerAccount, BrokerPosition, BrokerOrder,
BrokerExecution, and BrokerConnectionStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class ConnectionStatus(str, Enum):
    CONNECTED = "CONNECTED"
    DISCONNECTED = "DISCONNECTED"
    RECONNECTING = "RECONNECTING"
    ERROR = "ERROR"


@dataclass
class BrokerSession:
    """Active broker session metadata."""
    session_id: str
    broker_name: str
    status: str = "CONNECTED"
    connected_at: str = ""
    latency_ms: float = 12.5

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "broker_name": self.broker_name,
            "status": self.status,
            "connected_at": self.connected_at,
            "latency_ms": round(self.latency_ms, 2),
        }


@dataclass
class BrokerAccount:
    """Broker account cash, equity, and margin balance snapshot."""
    account_id: str
    broker_name: str
    total_equity: float
    cash_balance: float
    buying_power: float
    margin_used: float = 0.0
    currency: str = "USD"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "account_id": self.account_id,
            "broker_name": self.broker_name,
            "total_equity": round(self.total_equity, 2),
            "cash_balance": round(self.cash_balance, 2),
            "buying_power": round(self.buying_power, 2),
            "margin_used": round(self.margin_used, 2),
            "currency": self.currency,
        }


@dataclass
class BrokerPosition:
    """Broker open position item."""
    symbol: str
    quantity: float
    avg_entry_price: float
    current_price: float
    market_value: float
    unrealized_pnl: float
    pnl_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "quantity": self.quantity,
            "avg_entry_price": round(self.avg_entry_price, 2),
            "current_price": round(self.current_price, 2),
            "market_value": round(self.market_value, 2),
            "unrealized_pnl": round(self.unrealized_pnl, 2),
            "pnl_pct": round(self.pnl_pct, 2),
        }


@dataclass
class BrokerOrder:
    """Normalized broker order object."""
    broker_order_id: str
    client_order_id: str
    symbol: str
    side: str
    quantity: float
    filled_qty: float
    order_type: str
    price: float
    status: str
    submitted_at: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "broker_order_id": self.broker_order_id,
            "client_order_id": self.client_order_id,
            "symbol": self.symbol,
            "side": self.side,
            "quantity": self.quantity,
            "filled_qty": self.filled_qty,
            "order_type": self.order_type,
            "price": round(self.price, 2),
            "status": self.status,
            "submitted_at": self.submitted_at,
        }


@dataclass
class BrokerExecution:
    """Execution fill report item."""
    execution_id: str
    broker_order_id: str
    symbol: str
    side: str
    quantity: float
    price: float
    timestamp: str
    venue: str = "NASD"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "execution_id": self.execution_id,
            "broker_order_id": self.broker_order_id,
            "symbol": self.symbol,
            "side": self.side,
            "quantity": self.quantity,
            "price": round(self.price, 2),
            "timestamp": self.timestamp,
            "venue": self.venue,
        }


@dataclass
class BrokerConnectionStatistics:
    """Operational connection statistics across broker sessions."""
    total_connections: int = 0
    total_orders_submitted: int = 0
    total_reconnects: int = 0
    avg_latency_ms: float = 12.5

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_connections": self.total_connections,
            "total_orders_submitted": self.total_orders_submitted,
            "total_reconnects": self.total_reconnects,
            "avg_latency_ms": round(self.avg_latency_ms, 2),
        }
