"""
stream_cache_bridge.py — Real-Time Stream-to-Cache Bridge

Connects StreamingConsensusEngine pub/sub events directly into EnterpriseMarketCache.
Listens to evaluated StreamingConsensusResult events and automatically updates cache entries,
enabling non-blocking 0ms cache lookups for downstream Trading CoPilot queries.
"""

from __future__ import annotations

import logging
import threading
from typing import Any, Dict, Optional

from consensus_models import ConsensusResult
from market_cache import EnterpriseMarketCache, global_enterprise_market_cache
from market_types import DataType, ProviderType
from normalized_response import NormalizedResponse
from stream_cache_models import StreamCacheStatistics, StreamCacheUpdate
from stream_cache_rules import (
    cache_update_key,
    ignore_duplicate_stream,
    should_update_cache,
    validate_stream_cache_update,
)
from streaming_consensus_engine import (
    StreamingConsensusEngine,
    global_streaming_consensus_engine,
)
from streaming_consensus_models import StreamingConsensusResult
from streaming_manager import EnterpriseStreamingManager, global_streaming_manager
from streaming_models import StreamMessage

logger = logging.getLogger("stream_cache_bridge")


class StreamCacheBridge:
    """Real-Time Stream-to-Cache Integration Bridge.

    Usage::

        bridge = StreamCacheBridge()
        bridge.start()
        print(bridge.statistics().active_bridge)
        bridge.stop()
    """

    def __init__(
        self,
        streaming_manager: Optional[EnterpriseStreamingManager] = None,
        market_cache: Optional[EnterpriseMarketCache] = None,
        consensus_engine: Optional[StreamingConsensusEngine] = None,
    ) -> None:
        self.manager = streaming_manager or global_streaming_manager
        self.cache = market_cache or global_enterprise_market_cache
        self.consensus_engine = consensus_engine or global_streaming_consensus_engine
        self._lock = threading.RLock()

        self._active = False

        # Last timestamp tracking per key: key -> iso_timestamp
        self._last_timestamps: Dict[str, str] = {}

        # Operational Statistics
        self._messages_received = 0
        self._cache_updates_applied = 0
        self._duplicates_ignored = 0
        self._failed_updates = 0

        logger.info("StreamCacheBridge initialized.")

    # ─────────────────────────────────────────────
    # Bridge Lifecycle API
    # ─────────────────────────────────────────────

    def start(self) -> bool:
        """Start listening to finalized StreamingConsensusResult events from StreamingConsensusEngine."""
        with self._lock:
            if self._active:
                logger.info("StreamCacheBridge already active.")
                return True

            self._active = True
            # Register consensus listener with StreamingConsensusEngine
            self.consensus_engine.register_listener(self.on_streaming_consensus)
            logger.info("StreamCacheBridge started & subscribed to StreamingConsensusEngine events.")
            return True

    def stop(self) -> bool:
        """Stop bridge listener."""
        with self._lock:
            if not self._active:
                return True

            self.consensus_engine.unregister_listener(self.on_streaming_consensus)
            self._active = False
            logger.info("StreamCacheBridge stopped.")
            return True

    # ─────────────────────────────────────────────
    # Real-Time Consensus Listener & Cache Updater
    # ─────────────────────────────────────────────

    def on_streaming_consensus(self, stream_consensus: StreamingConsensusResult) -> bool:
        """Receive a StreamingConsensusResult from StreamingConsensusEngine and update EnterpriseMarketCache.

        Args:
            stream_consensus: Canonical StreamingConsensusResult evaluated by StreamingConsensusEngine.

        Returns:
            True if cache entry was successfully updated.
        """
        if not self._active or not stream_consensus:
            return False

        with self._lock:
            self._messages_received += 1

        sym = stream_consensus.symbol.upper()
        data_type_str = stream_consensus.data_type
        key = cache_update_key(data_type_str, symbol=sym)
        last_ts = self._last_timestamps.get(key)

        if ignore_duplicate_stream(last_ts, stream_consensus.timestamp):
            with self._lock:
                self._duplicates_ignored += 1
            logger.debug("Skipping out-of-order/duplicate streaming consensus result for key: %s", key)
            return False

        try:
            # Extract winning payload from consensus_message
            winning_msg = stream_consensus.consensus_message
            payload = winning_msg.payload if winning_msg else None

            if not payload:
                with self._lock:
                    self._failed_updates += 1
                return False

            # Convert to canonical ConsensusResult expected by EnterpriseMarketCache
            provider_tag = ProviderType.POLYGON
            if winning_msg and winning_msg.provider and winning_msg.provider.upper() == "ALPACA":
                provider_tag = ProviderType.ALPACA
            elif winning_msg and winning_msg.provider and winning_msg.provider.upper() == "FINNHUB":
                provider_tag = ProviderType.FINNHUB

            normalized_envelope = NormalizedResponse(
                value=payload,
                provider=provider_tag,
                confidence=stream_consensus.confidence,
            )

            # Map votes
            votes_map: Dict[ProviderType, NormalizedResponse] = {}
            for p_name, vote in stream_consensus.provider_votes.items():
                p_enum = ProviderType.POLYGON
                if p_name.upper() == "ALPACA":
                    p_enum = ProviderType.ALPACA
                elif p_name.upper() == "FINNHUB":
                    p_enum = ProviderType.FINNHUB

                v_msg = vote.message
                if v_msg and v_msg.payload:
                    votes_map[p_enum] = NormalizedResponse(
                        value=v_msg.payload,
                        provider=p_enum,
                        confidence=stream_consensus.confidence,
                    )

            outlier_enums = []
            for out_p in stream_consensus.outlier_providers:
                if out_p.upper() == "POLYGON":
                    outlier_enums.append(ProviderType.POLYGON)
                elif out_p.upper() == "ALPACA":
                    outlier_enums.append(ProviderType.ALPACA)
                elif out_p.upper() == "FINNHUB":
                    outlier_enums.append(ProviderType.FINNHUB)

            consensus_result = ConsensusResult(
                normalized_response=normalized_envelope,
                provider_votes=votes_map if votes_map else {provider_tag: normalized_envelope},
                selected_provider=provider_tag,
                agreement_status=stream_consensus.agreement_status,
                agreement_percentage=stream_consensus.agreement_percentage,
                confidence=stream_consensus.confidence,
                outlier_providers=outlier_enums,
                metadata={
                    "source": "STREAMING_CONSENSUS_ENGINE",
                    "consensus_price": stream_consensus.consensus_price,
                    "timestamp": stream_consensus.timestamp,
                },
            )

            # Map data_type_str to DataType enum
            dt_enum = DataType.QUOTE
            if data_type_str == DataType.HISTORICAL_BARS.value:
                dt_enum = DataType.HISTORICAL_BARS
            elif data_type_str == DataType.NEWS.value:
                dt_enum = DataType.NEWS

            # Preload updated ConsensusResult into EnterpriseMarketCache
            self.cache.preload(key, consensus_result, dt_enum)

            with self._lock:
                self._last_timestamps[key] = stream_consensus.timestamp
                self._cache_updates_applied += 1

            logger.info("Real-time StreamCacheBridge preloaded cache for '%s' (confidence=%.2f, status=%s)", key, stream_consensus.confidence, stream_consensus.agreement_status)
            return True

        except Exception as exc:
            with self._lock:
                self._failed_updates += 1
            logger.error("Failed applying streaming consensus update for key '%s': %s", key, exc)
            return False

    # Legacy handler for direct raw StreamMessage events if needed
    def on_stream_message(self, message: StreamMessage) -> bool:
        """Legacy StreamMessage handler delegating to streaming consensus."""
        if not self._active or not message:
            return False
        res = self.consensus_engine.ingest_message(message)
        if res:
            return self.on_streaming_consensus(res)
        return True

    # ─────────────────────────────────────────────
    # Public Statistics API
    # ─────────────────────────────────────────────

    def statistics(self) -> StreamCacheStatistics:
        """Return operational StreamCacheStatistics snapshot."""
        with self._lock:
            return StreamCacheStatistics(
                messages_received=self._messages_received,
                cache_updates_applied=self._cache_updates_applied,
                duplicates_ignored=self._duplicates_ignored,
                failed_updates=self._failed_updates,
                active_bridge=self._active,
            )


# Shared global singleton instance
global_stream_cache_bridge = StreamCacheBridge()
