"""
provider_capability_models.py — Data Models for Provider Capability Matrix

Defines ProviderCostTier, ProviderLimits, ProviderCapability, and CapabilityMatrixEntry
dataclasses encapsulating provider features, priority rankings, cost tiers, and rate limits.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from market_types import AssetClass, DataType, Exchange, ProviderType, Region


class ProviderCostTier(str, Enum):
    """Cost tier designation for market data providers."""
    FREE = "FREE"
    PAID = "PAID"
    PREMIUM = "PREMIUM"
    ENTERPRISE = "ENTERPRISE"


@dataclass
class ProviderLimits:
    """Rate limits and API request quota constraints.

    Attributes:
        requests_per_minute: Maximum requests allowed per 60-second window.
        burst_limit: Maximum concurrent / burst requests.
        daily_quota: Daily request cap if applicable.
    """
    requests_per_minute: int = 60
    burst_limit: int = 5
    daily_quota: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert ProviderLimits to clean dictionary."""
        return {
            "requests_per_minute": self.requests_per_minute,
            "burst_limit": self.burst_limit,
            "daily_quota": self.daily_quota,
        }


@dataclass
class ProviderCapability:
    """Granular feature capabilities matrix for a provider.

    Attributes:
        supports_live_quotes: Supports real-time quote snapshots.
        supports_historical: Supports historical OHLC candlestick series.
        supports_news: Supports financial news & sentiment streams.
        supports_fundamentals: Supports corporate balance sheet & valuation metrics.
        supports_options: Supports options chains and Greeks.
        supports_corporate_actions: Supports dividends and stock splits.
        supports_economic_events: Supports macroeconomic indicator events.
        max_history_depth_days: Maximum historical depth available in days.
        typical_latency_ms: Typical round-trip API response time in ms.
    """
    supports_live_quotes: bool = True
    supports_historical: bool = True
    supports_news: bool = False
    supports_fundamentals: bool = False
    supports_options: bool = False
    supports_corporate_actions: bool = False
    supports_economic_events: bool = False
    max_history_depth_days: int = 365
    typical_latency_ms: float = 100.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert ProviderCapability to clean dictionary."""
        return {
            "supports_live_quotes": self.supports_live_quotes,
            "supports_historical": self.supports_historical,
            "supports_news": self.supports_news,
            "supports_fundamentals": self.supports_fundamentals,
            "supports_options": self.supports_options,
            "supports_corporate_actions": self.supports_corporate_actions,
            "supports_economic_events": self.supports_economic_events,
            "max_history_depth_days": self.max_history_depth_days,
            "typical_latency_ms": round(self.typical_latency_ms, 2),
        }


@dataclass
class CapabilityMatrixEntry:
    """Master taxonomy entry defining full capabilities, priority, and bounds for a provider.

    Attributes:
        provider: ProviderType tag.
        asset_classes: List of supported AssetClass categories.
        data_types: List of supported DataType categories.
        exchanges: List of supported Exchange venues.
        regions: List of supported Region geographic zones.
        cost_tier: Cost classification string ('FREE', 'PAID', 'PREMIUM').
        capabilities: ProviderCapability features object.
        limits: ProviderLimits request rate constraints.
        priority_per_data_type: Dictionary mapping DataType to priority weight (1-100).
    """
    provider: ProviderType
    asset_classes: List[AssetClass] = field(default_factory=list)
    data_types: List[DataType] = field(default_factory=list)
    exchanges: List[Exchange] = field(default_factory=list)
    regions: List[Region] = field(default_factory=list)
    cost_tier: str = "FREE"
    capabilities: ProviderCapability = field(default_factory=ProviderCapability)
    limits: ProviderLimits = field(default_factory=ProviderLimits)
    priority_per_data_type: Dict[DataType, int] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert CapabilityMatrixEntry to clean dictionary."""
        return {
            "provider": self.provider.value if hasattr(self.provider, "value") else str(self.provider),
            "asset_classes": [a.value if hasattr(a, "value") else str(a) for a in self.asset_classes],
            "data_types": [d.value if hasattr(d, "value") else str(d) for d in self.data_types],
            "exchanges": [e.value if hasattr(e, "value") else str(e) for e in self.exchanges],
            "regions": [r.value if hasattr(r, "value") else str(r) for r in self.regions],
            "cost_tier": self.cost_tier,
            "capabilities": self.capabilities.to_dict(),
            "limits": self.limits.to_dict(),
            "priority_per_data_type": {
                (dt.value if hasattr(dt, "value") else str(dt)): val
                for dt, val in self.priority_per_data_type.items()
            },
        }
