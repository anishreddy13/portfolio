"""
provider_capability_matrix.py — Enterprise Provider Capability Matrix Singleton

Central repository storing provider capability entries, supported asset classes,
exchanges, regions, cost tiers, and per-data-type priority rankings.
"""

from __future__ import annotations

import logging
import threading
from typing import Dict, List, Optional

from market_types import AssetClass, DataType, Exchange, ProviderType, Region
from provider_capability_models import CapabilityMatrixEntry, ProviderCapability, ProviderLimits

logger = logging.getLogger("provider_capability_matrix")


class ProviderCapabilityMatrix:
    """Thread-safe registry for managing enterprise provider capability definitions."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._entries: Dict[ProviderType, CapabilityMatrixEntry] = {}

        # Populate initial default matrix configurations
        self._init_default_entries()

    def _init_default_entries(self) -> None:
        """Pre-populate matrix with default capabilities for Massive, Alpaca, and Finnhub."""
        # 1. Massive (Polygon) Entry
        polygon_entry = CapabilityMatrixEntry(
            provider=ProviderType.POLYGON,
            asset_classes=[AssetClass.EQUITY, AssetClass.ETF, AssetClass.FOREX, AssetClass.CRYPTO, AssetClass.OPTION, AssetClass.INDEX],
            data_types=[
                DataType.QUOTE,
                DataType.HISTORICAL_BARS,
                DataType.FUNDAMENTALS,
                DataType.CORPORATE_ACTIONS,
                DataType.NEWS,
                DataType.ECONOMIC_EVENT,
                DataType.OPTIONS_CONTRACT,
                DataType.OPTIONS_CHAIN,
                DataType.MARKET_STATUS,
            ],
            exchanges=[Exchange.NYSE, Exchange.NASDAQ, Exchange.AMEX, Exchange.ARCA, Exchange.CBOE, Exchange.FOREX, Exchange.CRYPTO],
            regions=[Region.US, Region.GLOBAL],
            cost_tier="PREMIUM",
            capabilities=ProviderCapability(
                supports_live_quotes=True,
                supports_historical=True,
                supports_news=True,
                supports_fundamentals=True,
                supports_options=True,
                supports_corporate_actions=True,
                supports_economic_events=True,
                max_history_depth_days=3650,
                typical_latency_ms=115.0,
            ),
            limits=ProviderLimits(requests_per_minute=1000, burst_limit=50),
            priority_per_data_type={
                DataType.QUOTE: 95,
                DataType.HISTORICAL_BARS: 98,
                DataType.FUNDAMENTALS: 90,
                DataType.OPTIONS_CHAIN: 95,
                DataType.CORPORATE_ACTIONS: 95,
                DataType.ECONOMIC_EVENT: 90,
            },
        )
        self._entries[ProviderType.POLYGON] = polygon_entry

        # 2. Alpaca Entry
        alpaca_entry = CapabilityMatrixEntry(
            provider=ProviderType.ALPACA,
            asset_classes=[AssetClass.EQUITY, AssetClass.ETF, AssetClass.CRYPTO, AssetClass.OPTION],
            data_types=[
                DataType.QUOTE,
                DataType.HISTORICAL_BARS,
                DataType.NEWS,
                DataType.MARKET_STATUS,
            ],
            exchanges=[Exchange.NYSE, Exchange.NASDAQ, Exchange.AMEX, Exchange.CRYPTO],
            regions=[Region.US],
            cost_tier="FREE",
            capabilities=ProviderCapability(
                supports_live_quotes=True,
                supports_historical=True,
                supports_news=True,
                supports_fundamentals=False,
                supports_options=False,
                supports_corporate_actions=False,
                supports_economic_events=False,
                max_history_depth_days=1825,
                typical_latency_ms=95.0,
            ),
            limits=ProviderLimits(requests_per_minute=200, burst_limit=10),
            priority_per_data_type={
                DataType.QUOTE: 90,
                DataType.HISTORICAL_BARS: 88,
                DataType.MARKET_STATUS: 95,
                DataType.NEWS: 80,
            },
        )
        self._entries[ProviderType.ALPACA] = alpaca_entry

        # 3. Finnhub Entry
        finnhub_entry = CapabilityMatrixEntry(
            provider=ProviderType.FINNHUB,
            asset_classes=[AssetClass.EQUITY, AssetClass.ETF, AssetClass.FOREX, AssetClass.CRYPTO, AssetClass.OPTION],
            data_types=[
                DataType.QUOTE,
                DataType.HISTORICAL_BARS,
                DataType.FUNDAMENTALS,
                DataType.CORPORATE_ACTIONS,
                DataType.NEWS,
                DataType.OPTIONS_CHAIN,
                DataType.MARKET_STATUS,
            ],
            exchanges=[Exchange.NYSE, Exchange.NASDAQ, Exchange.FOREX, Exchange.CRYPTO],
            regions=[Region.US, Region.GLOBAL],
            cost_tier="FREE",
            capabilities=ProviderCapability(
                supports_live_quotes=True,
                supports_historical=True,
                supports_news=True,
                supports_fundamentals=True,
                supports_options=True,
                supports_corporate_actions=True,
                supports_economic_events=False,
                max_history_depth_days=1095,
                typical_latency_ms=110.0,
            ),
            limits=ProviderLimits(requests_per_minute=60, burst_limit=5),
            priority_per_data_type={
                DataType.FUNDAMENTALS: 92,
                DataType.NEWS: 92,
                DataType.QUOTE: 85,
                DataType.HISTORICAL_BARS: 82,
                DataType.CORPORATE_ACTIONS: 88,
            },
        )
        self._entries[ProviderType.FINNHUB] = finnhub_entry

    def register(self, entry: CapabilityMatrixEntry) -> None:
        """Register or update a provider capability matrix entry."""
        with self._lock:
            self._entries[entry.provider] = entry
            logger.info("Registered capability entry for provider %s", entry.provider)

    def unregister(self, provider: ProviderType) -> None:
        """Unregister a provider capability entry."""
        with self._lock:
            if provider in self._entries:
                del self._entries[provider]
                logger.info("Unregistered capability entry for provider %s", provider)

    def get(self, provider: ProviderType) -> Optional[CapabilityMatrixEntry]:
        """Retrieve capability matrix entry by ProviderType."""
        with self._lock:
            return self._entries.get(provider)

    def primary_provider(self, data_type: DataType) -> Optional[ProviderType]:
        """Find the top-ranked primary provider for a target DataType."""
        with self._lock:
            candidates = [e for e in self._entries.values() if data_type in e.data_types]
            if not candidates:
                return None
            candidates.sort(
                key=lambda x: x.priority_per_data_type.get(data_type, 10), reverse=True
            )
            return candidates[0].provider

    def fallback_chain(self, data_type: DataType) -> List[ProviderType]:
        """Build ordered fallback chain of ProviderType tags for a target DataType."""
        with self._lock:
            candidates = [e for e in self._entries.values() if data_type in e.data_types]
            candidates.sort(
                key=lambda x: x.priority_per_data_type.get(data_type, 10), reverse=True
            )
            return [e.provider for e in candidates[1:]]

    def providers_for(self, data_type: DataType) -> List[ProviderType]:
        """List all providers supporting a target DataType."""
        with self._lock:
            return [e.provider for e in self._entries.values() if data_type in e.data_types]

    def providers_for_asset(self, asset_class: AssetClass) -> List[ProviderType]:
        """List all providers supporting a target AssetClass."""
        with self._lock:
            return [e.provider for e in self._entries.values() if asset_class in e.asset_classes]

    def providers_for_exchange(self, exchange: Exchange) -> List[ProviderType]:
        """List all providers supporting a target Exchange venue."""
        with self._lock:
            return [e.provider for e in self._entries.values() if exchange in e.exchanges]


# Singleton matrix instance
global_capability_matrix = ProviderCapabilityMatrix()
