"""
broker_connectivity_models.py — Data Models for Enterprise Broker Connectivity Engine

Defines BrokerConnection, BrokerSession, BrokerCapability, BrokerStatus,
BrokerHeartbeat, and BrokerConnectivityStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class BrokerState(str, Enum):
    CONNECTED = "CONNECTED"
    DISCONNECTED = "DISCONNECTED"
    RECONNECTING = "RECONNECTING"
    DEGRADED = "DEGRADED"
    FAILED = "FAILED"


@dataclass
class BrokerCapability:
    """Discovered trading and order capabilities of a broker adapter."""
    broker_name: str
    supports_fractional: bool = True
    supports_shorting: bool = True
    supports_stop_limit: bool = True
    max_order_rate_per_sec: int = 50
    supported_asset_classes: List[str] = field(default_factory=lambda: ["EQUITY", "OPTION", "CRYPTO"])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "broker_name": self.broker_name,
            "supports_fractional": self.supports_fractional,
            "supports_shorting": self.supports_shorting,
            "supports_stop_limit": self.supports_stop_limit,
            "max_order_rate_per_sec": self.max_order_rate_per_sec,
            "supported_asset_classes": self.supported_asset_classes,
        }


@dataclass
class BrokerHeartbeat:
    """Heartbeat measurement envelope."""
    heartbeat_id: str
    broker_name: str
    timestamp: str
    latency_ms: float
    status: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "heartbeat_id": self.heartbeat_id,
            "broker_name": self.broker_name,
            "timestamp": self.timestamp,
            "latency_ms": round(self.latency_ms, 2),
            "status": self.status,
        }


@dataclass
class BrokerSession:
    """Active broker authentication session envelope."""
    session_id: str
    broker_name: str
    token: str
    expires_at: str
    is_authenticated: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "broker_name": self.broker_name,
            "expires_at": self.expires_at,
            "is_authenticated": self.is_authenticated,
        }


@dataclass
class BrokerConnection:
    """Broker connection state and health envelope."""
    broker_id: str
    broker_name: str
    status: str = "CONNECTED"
    is_primary: bool = False
    is_failover: bool = False
    primary_url: str = "wss://api.broker.com/v2/stream"
    backup_url: str = "wss://backup.broker.com/v2/stream"
    last_heartbeat: str = ""
    latency_ms: float = 15.2
    reconnect_count: int = 0
    capability: Optional[BrokerCapability] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "broker_id": self.broker_id,
            "broker_name": self.broker_name,
            "status": self.status,
            "is_primary": self.is_primary,
            "is_failover": self.is_failover,
            "primary_url": self.primary_url,
            "backup_url": self.backup_url,
            "last_heartbeat": self.last_heartbeat,
            "latency_ms": round(self.latency_ms, 2),
            "reconnect_count": self.reconnect_count,
            "capability": self.capability.to_dict() if self.capability else None,
        }


@dataclass
class BrokerConnectivityStatistics:
    """Operational statistics for BrokerConnectivityEngine."""
    total_brokers_configured: int = 0
    active_connections_count: int = 0
    primary_broker_name: str = "PAPER_BROKER"
    failover_broker_name: str = "ALPACA_PRIMARY"
    average_heartbeat_latency_ms: float = 0.0
    total_reconnects: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_brokers_configured": self.total_brokers_configured,
            "active_connections_count": self.active_connections_count,
            "primary_broker_name": self.primary_broker_name,
            "failover_broker_name": self.failover_broker_name,
            "average_heartbeat_latency_ms": round(self.average_heartbeat_latency_ms, 2),
            "total_reconnects": self.total_reconnects,
        }
