"""
stream_connection_models.py — Data Models for Streaming Client Connections

Defines ConnectionState, ConnectionStatistics, and ReconnectPolicy dataclasses
with JSON serialization support.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass
class ConnectionState:
    """Represents the current connection status of a streaming client.

    Attributes:
        status: Status string ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'RECONNECTING', 'ERROR').
        connected_at: ISO timestamp when connection was established.
        last_heartbeat_at: ISO timestamp of last heartbeat message.
        error_message: Optional error details string.
    """
    status: str = "DISCONNECTED"
    connected_at: str = ""
    last_heartbeat_at: str = ""
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert ConnectionState to clean dictionary."""
        return {
            "status": self.status,
            "connected_at": self.connected_at,
            "last_heartbeat_at": self.last_heartbeat_at,
            "error_message": self.error_message,
        }


@dataclass
class ConnectionStatistics:
    """Operational metrics tracking a streaming client connection.

    Attributes:
        connected: Connection state boolean.
        reconnects: Number of reconnection attempts executed.
        messages_received: Total raw websocket frames/messages received.
        messages_published: Total normalized StreamMessage events published to streaming manager.
        subscriptions_count: Number of active topic subscriptions.
        last_message_at: ISO timestamp when last message was processed.
    """
    connected: bool = False
    reconnects: int = 0
    messages_received: int = 0
    messages_published: int = 0
    subscriptions_count: int = 0
    last_message_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert ConnectionStatistics to clean dictionary."""
        return {
            "connected": self.connected,
            "reconnects": self.reconnects,
            "messages_received": self.messages_received,
            "messages_published": self.messages_published,
            "subscriptions_count": self.subscriptions_count,
            "last_message_at": self.last_message_at,
        }


@dataclass
class ReconnectPolicy:
    """Exponential backoff and heartbeat configuration for streaming connection.

    Attributes:
        max_retries: Max consecutive reconnection retries.
        base_delay_sec: Base delay duration in seconds.
        max_delay_sec: Ceiling delay duration in seconds.
        heartbeat_interval_sec: Interval in seconds between heartbeat pings.
    """
    max_retries: int = 5
    base_delay_sec: float = 1.0
    max_delay_sec: float = 30.0
    heartbeat_interval_sec: float = 15.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert ReconnectPolicy to clean dictionary."""
        return {
            "max_retries": self.max_retries,
            "base_delay_sec": self.base_delay_sec,
            "max_delay_sec": self.max_delay_sec,
            "heartbeat_interval_sec": self.heartbeat_interval_sec,
        }
