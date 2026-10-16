"""
streaming_manager.py — Enterprise Real-Time Streaming Manager

Thread-safe pub/sub broker manager handling real-time stream subscriptions, subscriber registries,
message validation, and normalized event broadcasting to downstream clients.
"""

from __future__ import annotations

import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional, Set

from market_types import DataType, ProviderType
from streaming_models import StreamConfiguration, StreamMessage, StreamStatistics, StreamSubscription
from streaming_rules import (
    reconnect_delay,
    should_subscribe,
    should_unsubscribe,
    subscription_key,
    validate_stream_message,
)

# Late-bound import to avoid circular dependency at module level
_observability_engine = None


def _get_obs_engine():
    global _observability_engine
    if _observability_engine is None:
        try:
            from observability_engine import global_observability_engine
            _observability_engine = global_observability_engine
        except ImportError:
            _observability_engine = None
    return _observability_engine


logger = logging.getLogger("streaming_manager")


class EnterpriseStreamingManager:
    """Enterprise Real-Time Streaming Manager.

    Usage::

        manager = EnterpriseStreamingManager()
        sub_id = manager.subscribe("AAPL", DataType.QUOTE, callback=lambda msg: print(msg.payload))
        manager.broadcast("QUOTE:AAPL", payload={"price": 182.5}, provider=ProviderType.POLYGON)
    """

    def __init__(self, config: Optional[StreamConfiguration] = None) -> None:
        self.config = config or StreamConfiguration()
        self._lock = threading.RLock()

        # Registry: key -> Dict[subscriber_id, (StreamSubscription, Callback)]
        self._subscribers: Dict[str, Dict[str, Tuple[StreamSubscription, Callable[[StreamMessage], None]]]] = {}

        # Operational Statistics Counters
        self._messages_received = 0
        self._messages_broadcast = 0
        self._reconnect_count = 0
        self._dropped_messages = 0

        logger.info("EnterpriseStreamingManager initialized (max_subscribers=%d).", self.config.max_subscribers)

    # ─────────────────────────────────────────────
    # Public Subscription Management API
    # ─────────────────────────────────────────────

    def subscribe(
        self,
        symbol: str,
        data_type: DataType,
        callback: Callable[[StreamMessage], None],
        subscriber_id: Optional[str] = None,
        exchange: str = "",
    ) -> str:
        """Register a subscriber callback for a specific symbol & data_type stream topic.

        Args:
            symbol: Target symbol (e.g. 'AAPL').
            data_type: Target DataType category.
            callback: Callable receiver function accepting StreamMessage.
            subscriber_id: Optional custom subscriber GUID string.
            exchange: Optional exchange code.

        Returns:
            subscriber_id string identifier.
        """
        key = subscription_key(data_type, symbol=symbol, exchange=exchange)
        sub_id = subscriber_id or str(uuid.uuid4())

        with self._lock:
            if key not in self._subscribers:
                self._subscribers[key] = {}

            current_count = len(self._subscribers[key])
            if not should_subscribe(current_count, self.config.max_subscribers):
                logger.warning("Subscription limit reached for topic key '%s' (%d/%d)", key, current_count, self.config.max_subscribers)
                raise ValueError(f"Topic '{key}' reached max subscriber capacity.")

            sub_record = StreamSubscription(
                key=key,
                symbol=symbol.upper(),
                data_type=data_type.value if hasattr(data_type, "value") else str(data_type),
                subscriber_id=sub_id,
                created_at=datetime.now(timezone.utc).isoformat(),
                active=True,
            )

            self._subscribers[key][sub_id] = (sub_record, callback)
            logger.info("Subscribed %s to topic key '%s' (total_waiters=%d)", sub_id, key, len(self._subscribers[key]))

        return sub_id

    def unsubscribe(self, key_or_sub_id: str, subscriber_id: Optional[str] = None) -> bool:
        """Unregister a subscriber from a stream topic or remove by subscriber_id."""
        with self._lock:
            # Case 1: Topic key & subscriber_id specified
            if subscriber_id and key_or_sub_id in self._subscribers:
                if subscriber_id in self._subscribers[key_or_sub_id]:
                    del self._subscribers[key_or_sub_id][subscriber_id]
                    if not self._subscribers[key_or_sub_id]:
                        del self._subscribers[key_or_sub_id]
                    logger.info("Unsubscribed %s from key '%s'", subscriber_id, key_or_sub_id)
                    return True

            # Case 2: Scan all topics for target sub_id
            removed = False
            for k in list(self._subscribers.keys()):
                if key_or_sub_id in self._subscribers[k]:
                    del self._subscribers[k][key_or_sub_id]
                    if not self._subscribers[k]:
                        del self._subscribers[k]
                    removed = True
                    logger.info("Unsubscribed %s from key '%s'", key_or_sub_id, k)

            return removed

    # ─────────────────────────────────────────────
    # Public Publishing & Broadcasting API
    # ─────────────────────────────────────────────

    def publish(self, message: StreamMessage) -> int:
        """Publish a pre-formatted StreamMessage event to all registered topic subscribers.

        Args:
            message: Validated StreamMessage object.

        Returns:
            Number of subscribers receiving the broadcast message.
        """
        if not validate_stream_message(message):
            with self._lock:
                self._dropped_messages += 1
            logger.warning("Invalid StreamMessage payload dropped: key=%s", getattr(message, "key", "UNKNOWN"))
            return 0

        with self._lock:
            self._messages_received += 1
            callbacks_to_invoke = list(self._subscribers.get(message.key, {}).values())

        if not callbacks_to_invoke:
            return 0

        delivered_count = 0
        for _, cb in callbacks_to_invoke:
            try:
                cb(message)
                delivered_count += 1
            except Exception as exc:
                logger.error("Error in stream subscriber callback for key '%s': %s", message.key, exc)

        with self._lock:
            self._messages_broadcast += delivered_count

        obs = _get_obs_engine()
        if obs is not None:
            obs.record("STREAMING_MANAGER", "throughput_msg_sec", float(self._messages_broadcast))

        return delivered_count

    def broadcast(
        self,
        key: str,
        payload: Any,
        provider: ProviderType = ProviderType.POLYGON,
        symbol: str = "",
        data_type: str = "QUOTE",
    ) -> int:
        """Convenience method to wrap payload into StreamMessage and broadcast to subscribers."""
        parts = key.split(":")
        dt_str = data_type if len(parts) < 2 else parts[0]
        sym_str = symbol if len(parts) < 2 else parts[1]

        msg = StreamMessage(
            message_id=str(uuid.uuid4()),
            key=key,
            symbol=sym_str.upper(),
            data_type=dt_str,
            provider=provider.value if hasattr(provider, "value") else str(provider),
            timestamp=datetime.now(timezone.utc).isoformat(),
            payload=payload,
            sequence_number=self._messages_received + 1,
        )

        return self.publish(msg)

    # ─────────────────────────────────────────────
    # Public Statistics API
    # ─────────────────────────────────────────────

    def statistics(self) -> StreamStatistics:
        """Return operational StreamStatistics snapshot."""
        with self._lock:
            return StreamStatistics(
                active_subscriptions=len(self._subscribers),
                messages_received=self._messages_received,
                messages_broadcast=self._messages_broadcast,
                reconnect_count=self._reconnect_count,
                dropped_messages=self._dropped_messages,
            )


# Shared global singleton instance
global_streaming_manager = EnterpriseStreamingManager()
