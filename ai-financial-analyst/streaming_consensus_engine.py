"""
streaming_consensus_engine.py — Enterprise Real-Time Streaming Consensus Engine

Aggregates real-time stream ticks across multiple streaming providers (Polygon, Alpaca, Finnhub),
runs outlier detection within tight time windows (e.g. 100ms), and computes high-confidence
canonical StreamingConsensusResult envelopes.
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from market_types import DataType
from streaming_consensus_models import (
    StreamingConsensusResult,
    StreamingConsensusState,
    StreamingConsensusStatistics,
    StreamingProviderVote,
)
from streaming_consensus_rules import (
    calculate_stream_agreement,
    calculate_stream_confidence,
    detect_stream_outliers,
    remove_duplicate_ticks,
    select_stream_consensus,
    stream_consensus_ready,
)
from streaming_models import StreamMessage

logger = logging.getLogger("streaming_consensus_engine")


class StreamingConsensusEngine:
    """Enterprise Real-Time Streaming Consensus Engine.

    Usage::

        engine = StreamingConsensusEngine(window_duration_sec=0.1)
        res = engine.ingest_message(message)
        if res:
            print(res.consensus_price, res.confidence, res.agreement_status)
    """

    def __init__(self, window_duration_sec: float = 0.1) -> None:
        self.window_duration_sec = window_duration_sec
        self._lock = threading.RLock()

        # Window state per symbol: symbol -> StreamingConsensusState
        self._windows: Dict[str, StreamingConsensusState] = {}

        # Listener callbacks registered to receive finalized StreamingConsensusResult events
        self._listeners: List[Callable[[StreamingConsensusResult], None]] = []

        # Operational Statistics
        self._messages_received = 0
        self._consensus_completed = 0
        self._single_source_results = 0
        self._outliers_detected = 0
        self._total_latency_ms = 0.0

        logger.info("StreamingConsensusEngine initialized (window=%.2fs).", self.window_duration_sec)

    # ─────────────────────────────────────────────
    # Listener Registration & Publication API
    # ─────────────────────────────────────────────

    def register_listener(self, callback: Callable[[StreamingConsensusResult], None]) -> None:
        """Register a callback listener to receive finalized StreamingConsensusResult objects."""
        with self._lock:
            if callback not in self._listeners:
                self._listeners.append(callback)
                logger.info("Registered consensus listener callback.")

    def unregister_listener(self, callback: Callable[[StreamingConsensusResult], None]) -> None:
        """Unregister a consensus listener callback."""
        with self._lock:
            if callback in self._listeners:
                self._listeners.remove(callback)
                logger.info("Unregistered consensus listener callback.")

    def publish_consensus(self, result: StreamingConsensusResult) -> None:
        """Publish finalized StreamingConsensusResult event to registered listeners."""
        with self._lock:
            callbacks = list(self._listeners)

        for cb in callbacks:
            try:
                cb(result)
            except Exception as exc:
                logger.error("Error in consensus listener callback: %s", exc)

    # ─────────────────────────────────────────────
    # Message Ingestion & Consensus Processing
    # ─────────────────────────────────────────────

    def ingest_message(self, message: StreamMessage) -> Optional[StreamingConsensusResult]:
        """Ingest incoming stream message into symbol's consensus window.

        Args:
            message: StreamMessage event from streaming provider client.

        Returns:
            StreamingConsensusResult if consensus window closes and evaluates, else None.
        """
        if not message or not message.symbol:
            return None

        sym = message.symbol.upper()
        now_iso = datetime.now(timezone.utc).isoformat()
        price = getattr(message.payload, "price", 0.0) if message.payload else 0.0

        vote = StreamingProviderVote(
            provider=message.provider,
            symbol=sym,
            price=price,
            timestamp=message.timestamp or now_iso,
            latency_ms=10.0,  # Estimated transport latency
            message=message,
        )

        with self._lock:
            self._messages_received += 1

            if sym not in self._windows:
                self._windows[sym] = StreamingConsensusState(
                    symbol=sym,
                    window_start_iso=now_iso,
                    votes={},
                    is_ready=False,
                )

            win = self._windows[sym]
            win.votes[message.provider] = vote

            # Evaluate if window duration has elapsed
            if stream_consensus_ready(win, self.window_duration_sec):
                return self.evaluate_consensus(sym)

        return None

    def evaluate_consensus(self, symbol: str) -> Optional[StreamingConsensusResult]:
        """Evaluate consensus window state for symbol and return StreamingConsensusResult."""
        start_t = time.monotonic()
        sym = symbol.upper()

        with self._lock:
            if sym not in self._windows:
                return None

            win = self._windows.pop(sym)
            raw_votes = list(win.votes.values())

        if not raw_votes:
            return None

        # Step 1: Suppress duplicate tick votes
        votes = remove_duplicate_ticks(raw_votes)
        total_count = len(votes)

        # Step 2: Detect price outliers
        outliers = detect_stream_outliers(votes, tolerance_pct=0.15)
        valid_votes = [v for v in votes if v.provider not in outliers]
        valid_count = len(valid_votes)

        # Step 3: Compute Agreement & Confidence
        agreement_pct = calculate_stream_agreement(valid_count, total_count)
        confidence = calculate_stream_confidence(agreement_pct, total_count)

        agreement_status = "AGREED"
        if total_count == 1:
            agreement_status = "SINGLE_SOURCE"
            with self._lock:
                self._single_source_results += 1
        elif agreement_pct < 100.0:
            agreement_status = "DISAGREED"

        # Step 4: Select winning consensus vote
        winning_vote = select_stream_consensus(votes, outliers)

        eval_duration_ms = (time.monotonic() - start_t) * 1000.0

        with self._lock:
            self._consensus_completed += 1
            self._outliers_detected += len(outliers)
            self._total_latency_ms += eval_duration_ms

        result = StreamingConsensusResult(
            symbol=sym,
            data_type=winning_vote.message.data_type if winning_vote.message else "QUOTE",
            consensus_price=winning_vote.price,
            consensus_message=winning_vote.message,
            agreement_status=agreement_status,
            agreement_percentage=agreement_pct,
            confidence=confidence,
            provider_votes={v.provider: v for v in votes},
            outlier_providers=outliers,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

        logger.info(
            "Streaming consensus evaluated for %s: price=%.4f, status=%s, agreement=%.1f%%, confidence=%.2f",
            sym, result.consensus_price, agreement_status, agreement_pct, confidence
        )

        # Notify registered consensus listeners (e.g. StreamCacheBridge)
        self.publish_consensus(result)

        return result

    # ─────────────────────────────────────────────
    # Public Statistics API
    # ─────────────────────────────────────────────

    def statistics(self) -> StreamingConsensusStatistics:
        """Return operational StreamingConsensusStatistics snapshot."""
        with self._lock:
            avg_lat = (self._total_latency_ms / self._consensus_completed) if self._consensus_completed > 0 else 0.0
            return StreamingConsensusStatistics(
                messages_received=self._messages_received,
                consensus_completed=self._consensus_completed,
                single_source_results=self._single_source_results,
                outliers_detected=self._outliers_detected,
                average_consensus_latency_ms=avg_lat,
            )


# Shared global singleton instance
global_streaming_consensus_engine = StreamingConsensusEngine()
