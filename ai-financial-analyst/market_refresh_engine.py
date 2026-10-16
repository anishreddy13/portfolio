"""
market_refresh_engine.py — Enterprise Stale-While-Revalidate (SWR) Refresh Engine

Executes background asynchronous cache refresh tasks using a ThreadPoolExecutor worker pool.
Deduplicates in-flight refresh jobs so duplicate background tasks are skipped while
preventing user-facing request latency.
"""

from __future__ import annotations

import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional, Set

from consensus_models import ConsensusResult
from market_refresh_models import RefreshConfiguration, RefreshStatistics, RefreshTask
from market_refresh_rules import refresh_key, refresh_priority
from market_types import AssetClass, DataType, Exchange, Region

logger = logging.getLogger("market_refresh_engine")


class EnterpriseRefreshEngine:
    """Enterprise Stale-While-Revalidate (SWR) background refresh engine.

    Usage::

        engine = EnterpriseRefreshEngine()
        engine.enqueue_refresh(
            key="QUOTE:AAPL",
            data_type=DataType.QUOTE,
            symbol="AAPL",
            fetch_fn=lambda: service.get_quote("AAPL"),
            update_cb=lambda res: cache.preload("QUOTE:AAPL", res, DataType.QUOTE)
        )
    """

    def __init__(self, config: Optional[RefreshConfiguration] = None) -> None:
        self.config = config or RefreshConfiguration()
        self._lock = threading.RLock()

        # ThreadPool for background workers
        self._executor = ThreadPoolExecutor(
            max_workers=self.config.max_worker_threads,
            thread_name_prefix="SWR-Worker",
        )

        # Set of in-flight refresh keys to prevent duplicate queued jobs
        self._in_flight_keys: Set[str] = set()

        # Operational Statistics
        self._refresh_requests = 0
        self._completed_refreshes = 0
        self._skipped_refreshes = 0
        self._total_refresh_time_ms = 0.0

        logger.info("EnterpriseRefreshEngine initialized (workers=%d, SWR=%s).", self.config.max_worker_threads, self.config.enable_swr)

    # ─────────────────────────────────────────────
    # Core Background Enqueue Dispatcher
    # ─────────────────────────────────────────────

    def enqueue_refresh(
        self,
        key: str,
        data_type: DataType,
        symbol: str,
        fetch_fn: Callable[[], ConsensusResult],
        update_cb: Callable[[ConsensusResult], None],
    ) -> bool:
        """Enqueue a background refresh task if SWR is enabled and job is not already in-flight.

        Args:
            key: Standardized cache key string.
            data_type: Target DataType category.
            symbol: Target symbol.
            fetch_fn: Function fetching fresh ConsensusResult from EnterpriseMarketDataService.
            update_cb: Callback inserting fresh ConsensusResult into EnterpriseMarketCache.

        Returns:
            True if task was successfully queued for background execution.
        """
        if not self.config.enable_swr:
            return False

        with self._lock:
            self._refresh_requests += 1

            if key in self._in_flight_keys:
                self._skipped_refreshes += 1
                logger.debug("Suppressing duplicate background refresh request for key: %s", key)
                return False

            self._in_flight_keys.add(key)

        # Submit task to ThreadPoolExecutor without blocking caller
        self._executor.submit(self._worker_task, key, data_type, symbol, fetch_fn, update_cb)
        return True

    def _worker_task(
        self,
        key: str,
        data_type: DataType,
        symbol: str,
        fetch_fn: Callable[[], ConsensusResult],
        update_cb: Callable[[ConsensusResult], None],
    ) -> None:
        """Background worker thread executing API query and updating cache."""
        start_t = time.monotonic()
        try:
            logger.info("Executing background SWR refresh for key: %s", key)
            fresh_result = fetch_fn()
            update_cb(fresh_result)

            duration_ms = (time.monotonic() - start_t) * 1000.0
            with self._lock:
                self._completed_refreshes += 1
                self._total_refresh_time_ms += duration_ms

            logger.info("Background SWR refresh completed for key '%s' in %.2fms", key, duration_ms)

        except Exception as exc:
            logger.warning("Background SWR refresh failed for key '%s': %s", key, exc)
        finally:
            with self._lock:
                self._in_flight_keys.discard(key)

    # ─────────────────────────────────────────────
    # Public Statistics API
    # ─────────────────────────────────────────────

    def statistics(self) -> RefreshStatistics:
        """Return operational RefreshStatistics snapshot."""
        with self._lock:
            avg_time = (self._total_refresh_time_ms / self._completed_refreshes) if self._completed_refreshes > 0 else 0.0
            return RefreshStatistics(
                refresh_requests=self._refresh_requests,
                completed_refreshes=self._completed_refreshes,
                skipped_refreshes=self._skipped_refreshes,
                average_refresh_time_ms=avg_time,
                active_refresh_jobs=len(self._in_flight_keys),
            )

    # ─────────────────────────────────────────────
    # Convenient Shortcut Helper API Methods
    # ─────────────────────────────────────────────

    def refresh_quote(
        self, symbol: str, fetch_fn: Callable[[], ConsensusResult], update_cb: Callable[[ConsensusResult], None]
    ) -> bool:
        """Shortcut to enqueue quote background refresh."""
        key = refresh_key(DataType.QUOTE, symbol=symbol)
        return self.enqueue_refresh(key, DataType.QUOTE, symbol, fetch_fn, update_cb)

    def refresh_historical(
        self, symbol: str, timeframe: str, fetch_fn: Callable[[], ConsensusResult], update_cb: Callable[[ConsensusResult], None]
    ) -> bool:
        """Shortcut to enqueue historical series background refresh."""
        key = refresh_key(DataType.HISTORICAL_BARS, symbol=symbol, timeframe=timeframe)
        return self.enqueue_refresh(key, DataType.HISTORICAL_BARS, symbol, fetch_fn, update_cb)

    def refresh_news(
        self, symbol: Optional[str], fetch_fn: Callable[[], ConsensusResult], update_cb: Callable[[ConsensusResult], None]
    ) -> bool:
        """Shortcut to enqueue news feed background refresh."""
        sym = symbol or "GLOBAL"
        key = refresh_key(DataType.NEWS, symbol=sym)
        return self.enqueue_refresh(key, DataType.NEWS, sym, fetch_fn, update_cb)

    def refresh_fundamentals(
        self, symbol: str, fetch_fn: Callable[[], ConsensusResult], update_cb: Callable[[ConsensusResult], None]
    ) -> bool:
        """Shortcut to enqueue fundamentals background refresh."""
        key = refresh_key(DataType.FUNDAMENTALS, symbol=symbol)
        return self.enqueue_refresh(key, DataType.FUNDAMENTALS, symbol, fetch_fn, update_cb)

    def refresh_market_status(
        self, exchange: str, fetch_fn: Callable[[], ConsensusResult], update_cb: Callable[[ConsensusResult], None]
    ) -> bool:
        """Shortcut to enqueue market status background refresh."""
        key = refresh_key(DataType.MARKET_STATUS, exchange=exchange)
        return self.enqueue_refresh(key, DataType.MARKET_STATUS, exchange, fetch_fn, update_cb)

    def refresh_options(
        self, symbol: str, expiration_date: Optional[str], fetch_fn: Callable[[], ConsensusResult], update_cb: Callable[[ConsensusResult], None]
    ) -> bool:
        """Shortcut to enqueue options background refresh."""
        key = refresh_key(DataType.OPTIONS_CHAIN, symbol=symbol, timeframe=expiration_date or "")
        return self.enqueue_refresh(key, DataType.OPTIONS_CHAIN, symbol, fetch_fn, update_cb)

    def refresh_corporate_actions(
        self, symbol: str, fetch_fn: Callable[[], ConsensusResult], update_cb: Callable[[ConsensusResult], None]
    ) -> bool:
        """Shortcut to enqueue corporate actions background refresh."""
        key = refresh_key(DataType.CORPORATE_ACTIONS, symbol=symbol)
        return self.enqueue_refresh(key, DataType.CORPORATE_ACTIONS, symbol, fetch_fn, update_cb)


# Shared global singleton instance
global_refresh_engine = EnterpriseRefreshEngine()
