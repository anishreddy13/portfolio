"""
provider_registry.py — Provider Registration & Filtering Framework

Registry for discovering, querying, and filtering market data provider instances
by asset class, data type, exchange, region, health status, and priority.

Does NOT instantiate providers. Registration and lookup only.
"""

from __future__ import annotations

import logging
import threading
from typing import Dict, List, Optional, Tuple

from market_types import AssetClass, DataType, Exchange, ProviderType, Region
from provider_health import ProviderHealth
from provider_interface import MarketDataProvider

logger = logging.getLogger("provider_registry")


class ProviderRegistry:
    """Thread-safe registry for market data provider instances.

    Allows registering providers with an optional priority integer (higher = preferred)
    and querying registered providers filtered by capability and health.
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()
        # Storage: ProviderType -> (MarketDataProvider, priority)
        self._providers: Dict[ProviderType, Tuple[MarketDataProvider, int]] = {}

    def register(self, provider: MarketDataProvider, priority: int = 10) -> None:
        """Register a provider instance with a priority score."""
        with self._lock:
            p_name = provider.provider_name()
            self._providers[p_name] = (provider, priority)
            logger.info("Registered provider %s with priority=%d", p_name, priority)

    def unregister(self, provider_type: ProviderType) -> None:
        """Unregister a provider by ProviderType."""
        with self._lock:
            if provider_type in self._providers:
                del self._providers[provider_type]
                logger.info("Unregistered provider %s", provider_type)

    def get(self, provider_type: ProviderType) -> Optional[MarketDataProvider]:
        """Look up provider instance by ProviderType."""
        with self._lock:
            item = self._providers.get(provider_type)
            return item[0] if item else None

    def list_providers(self) -> List[MarketDataProvider]:
        """Return list of all registered provider instances ordered by priority."""
        with self._lock:
            sorted_items = sorted(self._providers.values(), key=lambda x: x[1], reverse=True)
            return [item[0] for item in sorted_items]

    def filter(
        self,
        asset_class: Optional[AssetClass] = None,
        data_type: Optional[DataType] = None,
        exchange: Optional[Exchange] = None,
        region: Optional[Region] = None,
        healthy_only: bool = False,
    ) -> List[MarketDataProvider]:
        """Filter registered providers by capabilities and health status.

        Args:
            asset_class: Optional AssetClass constraint.
            data_type: Optional DataType constraint.
            exchange: Optional Exchange constraint.
            region: Optional Region constraint.
            healthy_only: If True, returns only healthy provider instances.

        Returns:
            List of matching MarketDataProvider instances sorted by priority.
        """
        with self._lock:
            matches: List[Tuple[MarketDataProvider, int]] = []

            for provider, priority in self._providers.values():
                # Filter by Health
                if healthy_only:
                    h = provider.health()
                    if not h.healthy:
                        continue

                # Filter by AssetClass capability
                if asset_class is not None:
                    if asset_class not in provider.supported_asset_classes():
                        continue

                # Filter by DataType capability
                if data_type is not None:
                    if data_type not in provider.supported_data_types():
                        continue

                matches.append((provider, priority))

            matches.sort(key=lambda x: x[1], reverse=True)
            return [m[0] for m in matches]


# Global singleton registry instance
global_provider_registry = ProviderRegistry()
