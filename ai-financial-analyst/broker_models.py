"""
broker_models.py — Data Models for Multi-Broker Gateway Subsystem

Defines BrokerType, BrokerCapabilities, BrokerOrder, BrokerFill,
BrokerExecutionReport, BrokerHealth, and BrokerStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


class BrokerType(str, Enum):
    PAPER = "PAPER"
    ALPACA = "ALPACA"
    INTERACTIVE_BROKERS = "INTERACTIVE_BROKERS"
    TRADIER = "TRADIER"
    FIX = "FIX"
    BINANCE = "BINANCE"


@dataclass
class BrokerCapabilities:
    """Supported order types and asset classes for a broker adapter."""
    supports_market_orders: bool = True
    supports_limit_orders: bool = True
    supports_stop_orders: bool = True
    supports_fractional: bool = True
    supported_assets: List[str] = field(default_factory=lambda: ["EQUITY", "ETF", "CRYPTO"])

    def to_dict(self) -> Dict[str, Any]:
        """Convert BrokerCapabilities to clean dictionary."""
        return {
            "supports_market_orders": self.supports_market_orders,
            "supports_limit_orders": self.supports_limit_orders,
            "supports_stop_orders": self.supports_stop_orders,
            "supports_fractional": self.supports_fractional,
            "supported_assets": self.supported_assets,
        }


@dataclass
class BrokerOrder:
    """Standardized broker order envelope routed via BrokerGateway."""
    order_id: str
    broker_name: str
    symbol: str
    side: str
    order_type: str
    quantity: float
    limit_price: float = 0.0
    stop_price: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "order_id": self.order_id,
            "broker_name": self.broker_name,
            "symbol": self.symbol,
            "side": self.side,
            "order_type": self.order_type,
            "quantity": round(self.quantity, 4),
            "limit_price": round(self.limit_price, 2),
            "stop_price": round(self.stop_price, 2),
        }


@dataclass
class BrokerFill:
    """Standardized trade fill event emitted by a broker adapter."""
    fill_id: str
    order_id: str
    symbol: str
    quantity: float
    price: float
    broker_name: str
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "fill_id": self.fill_id,
            "order_id": self.order_id,
            "symbol": self.symbol,
            "quantity": round(self.quantity, 4),
            "price": round(self.price, 2),
            "broker_name": self.broker_name,
            "timestamp": self.timestamp,
        }


@dataclass
class BrokerExecutionReport:
    """Normalized execution report returned by a broker adapter."""
    report_id: str
    order_id: str
    broker_name: str
    symbol: str
    side: str
    quantity: float
    filled_quantity: float = 0.0
    avg_fill_price: float = 0.0
    status: str = "SUBMITTED"
    fills: List[BrokerFill] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "order_id": self.order_id,
            "broker_name": self.broker_name,
            "symbol": self.symbol,
            "side": self.side,
            "quantity": round(self.quantity, 4),
            "filled_quantity": round(self.filled_quantity, 4),
            "avg_fill_price": round(self.avg_fill_price, 2),
            "status": self.status,
            "fills": [f.to_dict() for f in self.fills],
            "timestamp": self.timestamp,
        }


@dataclass
class BrokerHealth:
    """Real-time health and connectivity metrics for a broker adapter."""
    broker_name: str
    is_connected: bool = True
    latency_ms: float = 5.0
    success_rate: float = 100.0
    health_score: float = 100.0
    last_ping: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "broker_name": self.broker_name,
            "is_connected": self.is_connected,
            "latency_ms": round(self.latency_ms, 2),
            "success_rate": round(self.success_rate, 2),
            "health_score": round(self.health_score, 1),
            "last_ping": self.last_ping,
        }


@dataclass
class BrokerStatistics:
    """Operational metrics tracking the BrokerGateway."""
    total_brokers_registered: int = 0
    active_brokers: int = 0
    orders_routed: int = 0
    total_volume_processed: float = 0.0
    average_latency_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_brokers_registered": self.total_brokers_registered,
            "active_brokers": self.active_brokers,
            "orders_routed": self.orders_routed,
            "total_volume_processed": round(self.total_volume_processed, 2),
            "average_latency_ms": round(self.average_latency_ms, 2),
        }
