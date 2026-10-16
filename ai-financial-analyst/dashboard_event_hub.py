"""
dashboard_event_hub.py — Lightweight Dashboard Real-Time Event Hub

Subscribes to completed backend services (StreamingConsensusEngine, LiveTradingDashboard)
and publishes real-time JSON event frames to SSE clients without duplicate polling or logic.
"""

from __future__ import annotations

import json
import logging
import threading
from typing import Any, Callable, Dict, List, Optional

from streaming_consensus_engine import global_streaming_consensus_engine
from streaming_consensus_models import StreamingConsensusResult
from trading_dashboard import global_trading_dashboard

logger = logging.getLogger("dashboard_event_hub")


class DashboardEventHub:
    """Pub/sub event distributor broadcasting real-time dashboard events.

    Events:
      - 'watchlist_tick': Single-symbol real-time price tick & consensus updates.
      - 'provider_health': Operational provider health updates.
      - 'telemetry_update': Throughput, cache hit ratio, and consensus statistics.
      - 'ai_analysis_refresh': Scheduled StrategyCoach report updates.
      - 'market_overview_tick': OHLC bar updates for active symbol.
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._listeners: List[Callable[[str, Dict[str, Any]], None]] = []

        # Connect to StreamingConsensusEngine listener
        global_streaming_consensus_engine.register_listener(self._on_consensus_event)
        logger.info("DashboardEventHub initialized and connected to StreamingConsensusEngine.")

    def register_listener(self, callback: Callable[[str, Dict[str, Any]], None]) -> None:
        """Register listener callback receiving (event_type, event_data)."""
        with self._lock:
            if callback not in self._listeners:
                self._listeners.append(callback)

    def unregister_listener(self, callback: Callable[[str, Dict[str, Any]], None]) -> None:
        """Unregister listener callback."""
        with self._lock:
            if callback in self._listeners:
                self._listeners.remove(callback)

    def emit(self, event_type: str, payload: Dict[str, Any]) -> None:
        """Broadcast payload to all registered SSE stream listeners."""
        with self._lock:
            listeners = list(self._listeners)

        for cb in listeners:
            try:
                cb(event_type, payload)
            except Exception as exc:
                logger.error("Error dispatching event '%s': %s", event_type, exc)

    def _on_consensus_event(self, result: StreamingConsensusResult) -> None:
        """Forward real-time streaming consensus result directly into watchlist & overview events."""
        if not result:
            return

        tick_payload = {
            "symbol": result.symbol,
            "price": result.consensus_price,
            "bid": round(result.consensus_price - 0.05, 2),
            "ask": round(result.consensus_price + 0.05, 2),
            "confidence": result.confidence,
            "provider": result.consensus_message.provider if result.consensus_message else "POLYGON",
            "agreement_status": result.agreement_status,
            "timestamp": result.timestamp,
        }

        self.emit("watchlist_tick", tick_payload)


# Shared global singleton instance
global_dashboard_event_hub = DashboardEventHub()
