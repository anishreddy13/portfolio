"""
market_cache.py — Enterprise Market Cache Layer

High-performance, thread-safe, LRU-evicting cache layer wrapping EnterpriseMarketDataService.
Caches multi-provider ConsensusResult envelopes with per-data-type TTL expiration.
"""

from __future__ import annotations

import logging
import threading
from collections import OrderedDict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from consensus_models import ConsensusResult
from market_cache_models import CacheConfiguration, CacheEntry, CacheStatistics
from market_cache_rules import (
    cache_expired,
    cache_hit,
    cache_key,
    cache_miss,
    calculate_ttl,
    should_refresh,
)
from market_data_service_v2 import EnterpriseMarketDataService, global_enterprise_market_data_service
from market_refresh_engine import global_refresh_engine
from market_refresh_rules import stale_allowed
from market_types import AssetClass, DataType, Exchange, Region

logger = logging.getLogger("market_cache")


class EnterpriseMarketCache:
    """Enterprise thread-safe LRU market data cache wrapper around EnterpriseMarketDataService.

    Usage::

        cache = EnterpriseMarketCache()
        quote_result = cache.get_quote("AAPL")
        print(quote_result.normalized_response.value.price, cache.statistics().hit_ratio)
    """

    def __init__(
        self,
        market_data_service: Optional[EnterpriseMarketDataService] = None,
        config: Optional[CacheConfiguration] = None,
    ) -> None:
        self.service = market_data_service or global_enterprise_market_data_service
        self.config = config or CacheConfiguration()
        self._lock = threading.RLock()

        # Storage: key -> CacheEntry (OrderedDict for LRU tracking)
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()

        # Operational statistics counters
        self._hits = 0
        self._misses = 0
        self._refresh_count = 0
        self._expired_entries = 0
        self._evictions = 0

        logger.info("EnterpriseMarketCache initialized (max_entries=%d).", self.config.max_entries)

    # ─────────────────────────────────────────────
    # Internal Cache Management Methods
    # ─────────────────────────────────────────────

    def _get_entry(self, key: str) -> Optional[CacheEntry]:
        """Thread-safe retrieval of CacheEntry with LRU order update and SWR stale grace check."""
        with self._lock:
            if key not in self._cache:
                self._misses += 1
                cache_miss(key)
                return None

            entry = self._cache[key]

            if cache_expired(entry):
                # Check if stale entry is within allowed grace limit for SWR
                if stale_allowed(entry.created_at, entry.ttl_seconds):
                    self._cache.move_to_end(key)
                    self._hits += 1
                    return entry

                self._expired_entries += 1
                self._misses += 1
                del self._cache[key]
                logger.debug("Cache entry for key '%s' expired beyond stale grace limit.", key)
                return None

            # Move key to end for LRU order
            self._cache.move_to_end(key)
            self._hits += 1
            cache_hit(entry)
            return entry

    def _put_entry(self, key: str, data_type: DataType, symbol: str, result: ConsensusResult) -> CacheEntry:
        """Thread-safe insertion of a ConsensusResult payload into LRU cache."""
        with self._lock:
            ttl_sec = calculate_ttl(data_type, self.config)
            now_dt = datetime.now(timezone.utc)
            exp_dt = now_dt + timedelta(seconds=ttl_sec)

            entry = CacheEntry(
                key=key,
                data_type=data_type.value if hasattr(data_type, "value") else str(data_type),
                symbol=symbol,
                value=result,
                created_at=now_dt.isoformat(),
                expires_at=exp_dt.isoformat(),
                ttl_seconds=ttl_sec,
                hit_count=0,
            )

            # Evict LRU items if capacity reached
            while len(self._cache) >= self.config.max_entries:
                evicted_key, _ = self._cache.popitem(last=False)
                self._evictions += 1
                logger.debug("Evicted LRU cache key: %s", evicted_key)

            self._cache[key] = entry
            self._cache.move_to_end(key)
            return entry

    # ─────────────────────────────────────────────
    # Cache Control API Methods
    # ─────────────────────────────────────────────

    def invalidate(self, key: str) -> bool:
        """Invalidate a specific cache key."""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                logger.info("Invalidated cache key: %s", key)
                return True
            return False

    def invalidate_symbol(self, symbol: str) -> int:
        """Invalidate all cached entries associated with a target symbol."""
        sym_upper = symbol.strip().upper()
        count = 0
        with self._lock:
            keys_to_del = [k for k, v in self._cache.items() if v.symbol.upper() == sym_upper]
            for k in keys_to_del:
                del self._cache[k]
                count += 1
        logger.info("Invalidated %d cache entries for symbol: %s", count, sym_upper)
        return count

    def clear(self) -> None:
        """Clear all entries in cache."""
        with self._lock:
            self._cache.clear()
            logger.info("Cleared EnterpriseMarketCache.")

    def preload(self, key: str, result: ConsensusResult, data_type: DataType) -> None:
        """Preload a ConsensusResult payload into cache."""
        sym = getattr(result.normalized_response.value, "symbol", "GLOBAL") if result.normalized_response else "GLOBAL"
        self._put_entry(key, data_type, sym, result)

    def statistics(self) -> CacheStatistics:
        """Return operational CacheStatistics snapshot."""
        with self._lock:
            total_ops = self._hits + self._misses
            ratio = (self._hits / total_ops * 100.0) if total_ops > 0 else 0.0
            return CacheStatistics(
                cache_hits=self._hits,
                cache_misses=self._misses,
                hit_ratio=ratio,
                refresh_count=self._refresh_count,
                expired_entries=self._expired_entries,
                evictions=self._evictions,
                total_entries=len(self._cache),
            )

    # ─────────────────────────────────────────────
    # Public Cached Market Data Methods (SWR Enabled)
    # ─────────────────────────────────────────────

    def get_quote(
        self,
        symbol: str,
        asset_class: AssetClass = AssetClass.EQUITY,
        exchange: Exchange = Exchange.NYSE,
        region: Region = Region.US,
        enable_consensus: Optional[bool] = None,
    ) -> ConsensusResult:
        """Fetch cached quote for symbol. Returns stale data immediately & refreshes in background if expired."""
        key = cache_key(DataType.QUOTE, symbol=symbol, exchange=exchange.value)
        entry = self._get_entry(key)

        if entry:
            if cache_expired(entry):
                logger.info("Serving stale SWR quote for '%s'. Enqueuing background refresh.", symbol)
                global_refresh_engine.enqueue_refresh(
                    key,
                    DataType.QUOTE,
                    symbol,
                    fetch_fn=lambda: self.service.get_quote(symbol, asset_class, exchange, region, enable_consensus),
                    update_cb=lambda res: self._put_entry(key, DataType.QUOTE, symbol, res),
                )
            return entry.value

        # Cache Miss / Synchronous Refresh
        logger.debug("Cache miss for quote '%s'. Querying EnterpriseMarketDataService.", symbol)
        self._refresh_count += 1
        result = self.service.get_quote(symbol, asset_class, exchange, region, enable_consensus)
        self._put_entry(key, DataType.QUOTE, symbol, result)
        return result

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
        """Fetch cached historical series for symbol. SWR enabled."""
        key = cache_key(DataType.HISTORICAL_BARS, symbol=symbol, timeframe=timeframe)
        entry = self._get_entry(key)

        if entry:
            if cache_expired(entry):
                logger.info("Serving stale SWR historical for '%s'. Enqueuing background refresh.", symbol)
                global_refresh_engine.enqueue_refresh(
                    key,
                    DataType.HISTORICAL_BARS,
                    symbol,
                    fetch_fn=lambda: self.service.get_historical(
                        symbol, timeframe, start_date, end_date, limit, asset_class, exchange, region, enable_consensus
                    ),
                    update_cb=lambda res: self._put_entry(key, DataType.HISTORICAL_BARS, symbol, res),
                )
            return entry.value

        logger.debug("Cache miss for historical '%s'. Querying EnterpriseMarketDataService.", symbol)
        self._refresh_count += 1
        result = self.service.get_historical(
            symbol, timeframe, start_date, end_date, limit, asset_class, exchange, region, enable_consensus
        )
        self._put_entry(key, DataType.HISTORICAL_BARS, symbol, result)
        return result

    def get_news(
        self,
        symbol: Optional[str] = None,
        limit: int = 10,
        enable_consensus: Optional[bool] = None,
    ) -> ConsensusResult:
        """Fetch cached market news for symbol. SWR enabled."""
        sym = symbol or "GLOBAL"
        key = cache_key(DataType.NEWS, symbol=sym)
        entry = self._get_entry(key)

        if entry:
            if cache_expired(entry):
                logger.info("Serving stale SWR news for '%s'. Enqueuing background refresh.", sym)
                global_refresh_engine.enqueue_refresh(
                    key,
                    DataType.NEWS,
                    sym,
                    fetch_fn=lambda: self.service.get_news(symbol, limit, enable_consensus),
                    update_cb=lambda res: self._put_entry(key, DataType.NEWS, sym, res),
                )
            return entry.value

        logger.debug("Cache miss for news '%s'. Querying EnterpriseMarketDataService.", sym)
        self._refresh_count += 1
        result = self.service.get_news(symbol, limit, enable_consensus)
        self._put_entry(key, DataType.NEWS, sym, result)
        return result

    def get_fundamentals(self, symbol: str) -> ConsensusResult:
        """Fetch cached company fundamentals for symbol. SWR enabled."""
        key = cache_key(DataType.FUNDAMENTALS, symbol=symbol)
        entry = self._get_entry(key)

        if entry:
            if cache_expired(entry):
                logger.info("Serving stale SWR fundamentals for '%s'. Enqueuing background refresh.", symbol)
                global_refresh_engine.enqueue_refresh(
                    key,
                    DataType.FUNDAMENTALS,
                    symbol,
                    fetch_fn=lambda: self.service.get_fundamentals(symbol),
                    update_cb=lambda res: self._put_entry(key, DataType.FUNDAMENTALS, symbol, res),
                )
            return entry.value

        logger.debug("Cache miss for fundamentals '%s'. Querying EnterpriseMarketDataService.", symbol)
        self._refresh_count += 1
        result = self.service.get_fundamentals(symbol)
        self._put_entry(key, DataType.FUNDAMENTALS, symbol, result)
        return result

    def get_market_status(
        self, exchange: Exchange = Exchange.NYSE, enable_consensus: Optional[bool] = None
    ) -> ConsensusResult:
        """Fetch cached market session status. SWR enabled."""
        key = cache_key(DataType.MARKET_STATUS, exchange=exchange.value)
        entry = self._get_entry(key)

        if entry:
            if cache_expired(entry):
                logger.info("Serving stale SWR market status for '%s'. Enqueuing background refresh.", exchange.value)
                global_refresh_engine.enqueue_refresh(
                    key,
                    DataType.MARKET_STATUS,
                    exchange.value,
                    fetch_fn=lambda: self.service.get_market_status(exchange, enable_consensus),
                    update_cb=lambda res: self._put_entry(key, DataType.MARKET_STATUS, exchange.value, res),
                )
            return entry.value

        logger.debug("Cache miss for market status '%s'. Querying EnterpriseMarketDataService.", exchange.value)
        self._refresh_count += 1
        result = self.service.get_market_status(exchange, enable_consensus)
        self._put_entry(key, DataType.MARKET_STATUS, exchange.value, result)
        return result

    def get_options(self, symbol: str, expiration_date: Optional[str] = None) -> ConsensusResult:
        """Fetch cached options contract chain for symbol. SWR enabled."""
        key = cache_key(DataType.OPTIONS_CHAIN, symbol=symbol, timeframe=expiration_date or "")
        entry = self._get_entry(key)

        if entry:
            if cache_expired(entry):
                logger.info("Serving stale SWR options for '%s'. Enqueuing background refresh.", symbol)
                global_refresh_engine.enqueue_refresh(
                    key,
                    DataType.OPTIONS_CHAIN,
                    symbol,
                    fetch_fn=lambda: self.service.get_options(symbol, expiration_date),
                    update_cb=lambda res: self._put_entry(key, DataType.OPTIONS_CHAIN, symbol, res),
                )
            return entry.value

        logger.debug("Cache miss for options chain '%s'. Querying EnterpriseMarketDataService.", symbol)
        self._refresh_count += 1
        result = self.service.get_options(symbol, expiration_date)
        self._put_entry(key, DataType.OPTIONS_CHAIN, symbol, result)
        return result

    def get_corporate_actions(self, symbol: str) -> ConsensusResult:
        """Fetch cached corporate dividend and split actions for symbol. SWR enabled."""
        key = cache_key(DataType.CORPORATE_ACTIONS, symbol=symbol)
        entry = self._get_entry(key)

        if entry:
            if cache_expired(entry):
                logger.info("Serving stale SWR corporate actions for '%s'. Enqueuing background refresh.", symbol)
                global_refresh_engine.enqueue_refresh(
                    key,
                    DataType.CORPORATE_ACTIONS,
                    symbol,
                    fetch_fn=lambda: self.service.get_corporate_actions(symbol),
                    update_cb=lambda res: self._put_entry(key, DataType.CORPORATE_ACTIONS, symbol, res),
                )
            return entry.value

        logger.debug("Cache miss for corporate actions '%s'. Querying EnterpriseMarketDataService.", symbol)
        self._refresh_count += 1
        result = self.service.get_corporate_actions(symbol)
        self._put_entry(key, DataType.CORPORATE_ACTIONS, symbol, result)
        return result


# Global singleton instance for Enterprise Market Cache
global_enterprise_market_cache = EnterpriseMarketCache()
