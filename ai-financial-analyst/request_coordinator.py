"""
request_coordinator.py — Enterprise SingleFlight Request Coordinator

Implements SingleFlight request coalescing between the Trading CoPilot and EnterpriseMarketCache.
Deduplicates simultaneous concurrent market data queries so that only one underlying query
executes while waiting callers share the resulting ConsensusResult payload.
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from consensus_models import ConsensusResult
from market_cache import EnterpriseMarketCache, global_enterprise_market_cache
from market_types import AssetClass, DataType, Exchange, Region
from request_coordinator_models import PendingRequest, RequestConfiguration, RequestStatistics
from request_coordinator_rules import (
    cleanup_completed_requests,
    request_key,
    request_timeout,
    should_join_existing_request,
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


logger = logging.getLogger("request_coordinator")


class EnterpriseRequestCoordinator:
    """Enterprise SingleFlight Request Coalescing Coordinator.

    Usage::

        coordinator = EnterpriseRequestCoordinator()
        quote_result = coordinator.get_quote("AAPL")
        print(quote_result.normalized_response.value.price)
    """

    def __init__(
        self,
        market_cache: Optional[EnterpriseMarketCache] = None,
        config: Optional[RequestConfiguration] = None,
    ) -> None:
        self.cache = market_cache or global_enterprise_market_cache
        self.config = config or RequestConfiguration()
        self._lock = threading.RLock()

        # Storage: key -> (PendingRequest, threading.Event)
        self._in_flight: Dict[str, Tuple[PendingRequest, threading.Event]] = {}

        # Operational Statistics
        self._duplicate_prevented = 0
        self._completed_requests = 0
        self._total_wait_ms = 0.0
        self._waiter_count_total = 0
        self._timeout_count = 0

        logger.info("EnterpriseRequestCoordinator initialized (coalescing=%s).", self.config.enable_coalescing)

    # ─────────────────────────────────────────────
    # SingleFlight Coalescing Engine
    # ─────────────────────────────────────────────

    def _execute_singleflight(
        self,
        key: str,
        fetch_fn: Callable[[], ConsensusResult],
    ) -> ConsensusResult:
        """SingleFlight execution logic with event synchronization across waiting caller threads."""
        start_t = time.monotonic()
        event_to_wait: Optional[threading.Event] = None
        is_leader = False

        with self._lock:
            if key in self._in_flight and self.config.enable_coalescing:
                pending_req, evt = self._in_flight[key]
                if should_join_existing_request(pending_req, self.config.enable_coalescing):
                    pending_req.waiters_count += 1
                    self._duplicate_prevented += 1
                    event_to_wait = evt
                    logger.debug("Coalescing concurrent caller into in-flight request key: %s (waiters=%d)", key, pending_req.waiters_count)

            if event_to_wait is None:
                # Leader thread initiating request
                is_leader = True
                now_iso = datetime.now(timezone.utc).isoformat()
                pending_req = PendingRequest(key=key, created_at=now_iso, waiters_count=0)
                evt = threading.Event()
                self._in_flight[key] = (pending_req, evt)

        # ── Follower Thread Execution Path ──────────────────────
        if not is_leader and event_to_wait is not None:
            signaled = event_to_wait.wait(timeout=self.config.request_timeout_sec)
            wait_duration_ms = (time.monotonic() - start_t) * 1000.0

            with self._lock:
                self._total_wait_ms += wait_duration_ms
                self._waiter_count_total += 1

                if not signaled:
                    self._timeout_count += 1
                    logger.warning("Follower thread timed out waiting for SingleFlight key: %s", key)
                    raise TimeoutError(f"SingleFlight request timed out waiting for key '{key}'")

                if key in self._in_flight:
                    p_req, _ = self._in_flight[key]
                    if p_req.result:
                        return p_req.result

            # Fallback if result missing
            return fetch_fn()

        # ── Leader Thread Execution Path ────────────────────────
        try:
            result = fetch_fn()
            with self._lock:
                if key in self._in_flight:
                    p_req, evt = self._in_flight[key]
                    p_req.result = result
                    self._completed_requests += 1
                    evt.set()  # Wake all waiting follower threads
            lat_ms = (time.monotonic() - start_t) * 1000.0
            obs = _get_obs_engine()
            if obs is not None:
                obs.record("REQUEST_COORDINATOR", "request_latency_ms", lat_ms)

            return result
        except Exception as exc:
            err_msg = str(exc)
            logger.error("Leader thread failed executing SingleFlight key '%s': %s", key, err_msg)
            with self._lock:
                if key in self._in_flight:
                    p_req, evt = self._in_flight[key]
                    p_req.error = err_msg
                    evt.set()
            raise
        finally:
            # Cleanup in-flight entry
            with self._lock:
                if key in self._in_flight:
                    del self._in_flight[key]

    # ─────────────────────────────────────────────
    # Public Statistics API
    # ─────────────────────────────────────────────

    def statistics(self) -> RequestStatistics:
        """Return operational RequestStatistics snapshot."""
        with self._lock:
            avg_wait = (self._total_wait_ms / self._waiter_count_total) if self._waiter_count_total > 0 else 0.0
            return RequestStatistics(
                duplicate_requests_prevented=self._duplicate_prevented,
                active_requests=len(self._in_flight),
                completed_requests=self._completed_requests,
                average_wait_ms=avg_wait,
                timeout_count=self._timeout_count,
            )

    # ─────────────────────────────────────────────
    # Public Coalesced API Methods
    # ─────────────────────────────────────────────

    def get_quote(
        self,
        symbol: str,
        asset_class: AssetClass = AssetClass.EQUITY,
        exchange: Exchange = Exchange.NYSE,
        region: Region = Region.US,
        enable_consensus: Optional[bool] = None,
    ) -> ConsensusResult:
        """Fetch coalesced quote for symbol."""
        key = request_key(DataType.QUOTE, symbol=symbol, exchange=exchange.value)
        return self._execute_singleflight(
            key, lambda: self.cache.get_quote(symbol, asset_class, exchange, region, enable_consensus)
        )

    def get_historical(
        self,
        symbol: str,
        timeframe: str = "1d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
        asset_class: AssetClass = AssetClass.EQUITY,
        exchange: Exchange = Exchange.NYSE,
        region: Region = Region.US,
        enable_consensus: Optional[bool] = None,
    ) -> ConsensusResult:
        """Fetch coalesced historical series for symbol."""
        key = request_key(DataType.HISTORICAL_BARS, symbol=symbol, timeframe=timeframe)
        return self._execute_singleflight(
            key,
            lambda: self.cache.get_historical(
                symbol, timeframe, start_date, end_date, limit, asset_class, exchange, region, enable_consensus
            ),
        )

    def get_news(
        self,
        symbol: Optional[str] = None,
        limit: int = 10,
        enable_consensus: Optional[bool] = None,
    ) -> ConsensusResult:
        """Fetch coalesced news feed for symbol."""
        sym = symbol or "GLOBAL"
        key = request_key(DataType.NEWS, symbol=sym)
        return self._execute_singleflight(
            key, lambda: self.cache.get_news(symbol, limit, enable_consensus)
        )

    def get_fundamentals(self, symbol: str) -> ConsensusResult:
        """Fetch coalesced company fundamentals for symbol."""
        key = request_key(DataType.FUNDAMENTALS, symbol=symbol)
        return self._execute_singleflight(
            key, lambda: self.cache.get_fundamentals(symbol)
        )

    def get_market_status(
        self, exchange: Exchange = Exchange.NYSE, enable_consensus: Optional[bool] = None
    ) -> ConsensusResult:
        """Fetch coalesced market status for exchange."""
        key = request_key(DataType.MARKET_STATUS, exchange=exchange.value)
        return self._execute_singleflight(
            key, lambda: self.cache.get_market_status(exchange, enable_consensus)
        )

    def get_options(self, symbol: str, expiration_date: Optional[str] = None) -> ConsensusResult:
        """Fetch coalesced options contract chain for symbol."""
        key = request_key(DataType.OPTIONS_CHAIN, symbol=symbol, timeframe=expiration_date or "")
        return self._execute_singleflight(
            key, lambda: self.cache.get_options(symbol, expiration_date)
        )

    def get_corporate_actions(self, symbol: str) -> ConsensusResult:
        """Fetch coalesced corporate actions for symbol."""
        key = request_key(DataType.CORPORATE_ACTIONS, symbol=symbol)
        return self._execute_singleflight(
            key, lambda: self.cache.get_corporate_actions(symbol)
        )


# Alias for backward compatibility
RequestCoordinator = EnterpriseRequestCoordinator

# Shared global singleton instance
global_request_coordinator = EnterpriseRequestCoordinator()

