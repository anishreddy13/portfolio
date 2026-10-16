"""
execution_models.py — Data Models for Enterprise Execution Management System (EMS)

Defines ExecutionStatus, ExecutionRoute, ExecutionFill, ExecutionRequest,
ExecutionReport, and ExecutionStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


class ExecutionStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    PENDING_ROUTE = "PENDING_ROUTE"
    FILLED = "FILLED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


@dataclass
class ExecutionRoute:
    """Venue route for EMS order execution."""
    route_id: str
    venue_name: str
    is_active: bool = True
    priority: int = 1
    latency_ms: float = 4.2

    def to_dict(self) -> Dict[str, Any]:
        """Convert ExecutionRoute to clean dictionary."""
        return {
            "route_id": self.route_id,
            "venue_name": self.venue_name,
            "is_active": self.is_active,
            "priority": self.priority,
            "latency_ms": round(self.latency_ms, 2),
        }


@dataclass
class ExecutionFill:
    """Individual venue trade fill event record."""
    fill_id: str
    execution_id: str
    symbol: str
    quantity: float
    price: float
    venue: str = "DARK_POOL_ALPHA"
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "fill_id": self.fill_id,
            "execution_id": self.execution_id,
            "symbol": self.symbol,
            "quantity": round(self.quantity, 4),
            "price": round(self.price, 2),
            "venue": self.venue,
            "timestamp": self.timestamp,
        }


@dataclass
class ExecutionRequest:
    """Incoming execution request envelope submitted to ExecutionManager."""
    request_id: str
    order_id: str
    symbol: str
    side: str
    order_type: str
    quantity: float
    limit_price: float = 0.0
    stop_price: float = 0.0
    portfolio_id: str = "default"
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "request_id": self.request_id,
            "order_id": self.order_id,
            "symbol": self.symbol,
            "side": self.side,
            "order_type": self.order_type,
            "quantity": round(self.quantity, 4),
            "limit_price": round(self.limit_price, 2),
            "stop_price": round(self.stop_price, 2),
            "portfolio_id": self.portfolio_id,
            "timestamp": self.timestamp,
        }


@dataclass
class ExecutionReport:
    """State audit report for an active or completed EMS execution."""
    report_id: str
    request_id: str
    symbol: str
    side: str
    quantity: float
    filled_quantity: float = 0.0
    avg_fill_price: float = 0.0
    status: str = "SUBMITTED"
    fills: List[ExecutionFill] = field(default_factory=list)
    updated_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "request_id": self.request_id,
            "symbol": self.symbol,
            "side": self.side,
            "quantity": round(self.quantity, 4),
            "filled_quantity": round(self.filled_quantity, 4),
            "avg_fill_price": round(self.avg_fill_price, 2),
            "status": self.status,
            "fills": [f.to_dict() for f in self.fills],
            "updated_at": self.updated_at,
        }


@dataclass
class ExecutionStatistics:
    """Operational metrics tracking the ExecutionManager."""
    total_requests: int = 0
    filled_requests: int = 0
    partial_fills: int = 0
    cancelled_requests: int = 0
    average_latency_ms: float = 0.0
    total_volume: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_requests": self.total_requests,
            "filled_requests": self.filled_requests,
            "partial_fills": self.partial_fills,
            "cancelled_requests": self.cancelled_requests,
            "average_latency_ms": round(self.average_latency_ms, 2),
            "total_volume": round(self.total_volume, 2),
        }
