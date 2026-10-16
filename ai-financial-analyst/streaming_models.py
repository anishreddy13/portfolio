"""
streaming_models.py — Data Models for Enterprise Streaming Foundation

Defines StreamSubscription, StreamMessage, StreamStatistics, and StreamConfiguration
dataclasses with JSON serialization support.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass
class StreamSubscription:
    """Represents an active market data stream subscription registration.

    Attributes:
        key: Unique subscription topic key (e.g. 'QUOTE:AAPL').
        symbol: Target ticker symbol.
        data_type: DataType category string.
        subscriber_id: Unique subscriber identifier string.
        created_at: ISO timestamp when subscription was registered.
        active: Subscription status boolean.
    """
    key: str
    symbol: str
    data_type: str
    subscriber_id: str
    created_at: str = ""
    active: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert StreamSubscription to clean dictionary."""
        return {
            "key": self.key,
            "symbol": self.symbol,
            "data_type": self.data_type,
            "subscriber_id": self.subscriber_id,
            "created_at": self.created_at,
            "active": self.active,
        }


@dataclass
class StreamMessage:
    """Represents a normalized real-time streaming market event payload.

    Attributes:
        message_id: Unique streaming message GUID.
        key: Subscription topic key tag.
        symbol: Target ticker symbol.
        data_type: DataType category string.
        provider: Origin provider name string (e.g. 'POLYGON', 'ALPACA').
        timestamp: ISO timestamp of stream event.
        payload: Canonical normalized data payload dictionary or entity.
        sequence_number: Monotonic incrementing message sequence number.
    """
    message_id: str
    key: str
    symbol: str
    data_type: str
    provider: str
    timestamp: str
    payload: Any
    sequence_number: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert StreamMessage to clean dictionary."""
        p_dict = self.payload.to_dict() if hasattr(self.payload, "to_dict") else self.payload
        return {
            "message_id": self.message_id,
            "key": self.key,
            "symbol": self.symbol,
            "data_type": self.data_type,
            "provider": self.provider,
            "timestamp": self.timestamp,
            "payload": p_dict,
            "sequence_number": self.sequence_number,
        }


@dataclass
class StreamStatistics:
    """Operational performance metrics for the streaming manager.

    Attributes:
        active_subscriptions: Current number of active subscription topics.
        messages_received: Cumulative total stream messages received from providers.
        messages_broadcast: Cumulative total stream messages delivered to subscribers.
        reconnect_count: Number of stream reconnect attempts executed.
        dropped_messages: Number of dropped messages due to queue overflow or buffer limits.
    """
    active_subscriptions: int = 0
    messages_received: int = 0
    messages_broadcast: int = 0
    reconnect_count: int = 0
    dropped_messages: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert StreamStatistics to clean dictionary."""
        return {
            "active_subscriptions": self.active_subscriptions,
            "messages_received": self.messages_received,
            "messages_broadcast": self.messages_broadcast,
            "reconnect_count": self.reconnect_count,
            "dropped_messages": self.dropped_messages,
        }


@dataclass
class StreamConfiguration:
    """Configuration options for EnterpriseStreamingManager.

    Attributes:
        max_subscribers: Maximum concurrent subscribers per topic key.
        buffer_capacity: Queue buffer size for streaming messages.
        reconnect_max_retries: Max reconnection retries before failing.
        reconnect_base_delay_sec: Base delay in seconds for exponential reconnect backoff.
    """
    max_subscribers: int = 500
    buffer_capacity: int = 1000
    reconnect_max_retries: int = 5
    reconnect_base_delay_sec: float = 1.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert StreamConfiguration to clean dictionary."""
        return {
            "max_subscribers": self.max_subscribers,
            "buffer_capacity": self.buffer_capacity,
            "reconnect_max_retries": self.reconnect_max_retries,
            "reconnect_base_delay_sec": self.reconnect_base_delay_sec,
        }
