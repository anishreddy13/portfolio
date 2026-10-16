"""
routing_rules.py — Pure Provider Selection & Scoring Rules

Contains pure algorithm functions for filtering providers, scoring fitness,
selecting optimal primary provider, and constructing fallback chains.

No networking, HTTP, caching, or provider-specific references.
"""

from __future__ import annotations

import logging
from typing import List, Optional, Tuple

from market_types import AssetClass, DataType, Exchange, ProviderType, Region
from provider_interface import MarketDataProvider

logger = logging.getLogger("routing_rules")


def score_provider(
    provider: MarketDataProvider,
    data_type: DataType,
    asset_class: AssetClass = AssetClass.EQUITY,
    exchange: Exchange = Exchange.NYSE,
    region: Region = Region.US,
) -> float:
    """Calculate fitness score for a provider servicing a specific data request.

    Scoring Criteria:
      1. Healthy Status: +100 points
      2. High Success Rate: +50 * success_rate
      3. Low Latency: +max(0, 50 - latency_ms / 10)
      4. Data Type Support: +30 points
      5. Asset Class Support: +20 points
      6. Exchange Support: +10 points
      7. Priority Weight: +priority score
    """
    health = provider.health()
    score = 0.0

    # Rule 1: Health Status (Skip or penalize unhealthy)
    if health.healthy and health.status == "HEALTHY":
        score += 100.0
    elif health.status == "DEGRADED":
        score += 40.0
    else:
        # Unhealthy / Rate Limited
        score -= 200.0

    # Rule 2: Success Rate
    score += health.success_rate * 50.0

    # Rule 3: Low Latency Bonus
    latency_bonus = max(0.0, 50.0 - (health.latency_ms / 10.0))
    score += latency_bonus

    # Rule 4: Data Type Support
    if data_type in provider.supported_data_types():
        score += 30.0
    else:
        score -= 100.0

    # Rule 5: Asset Class Support
    if asset_class in provider.supported_asset_classes():
        score += 20.0
    else:
        score -= 50.0

    # Rule 6: Exchange Support
    score += 10.0

    return score


def filter_providers(
    providers: List[MarketDataProvider],
    data_type: DataType,
    asset_class: Optional[AssetClass] = None,
) -> List[MarketDataProvider]:
    """Filter candidate providers capable of supporting requested data type and asset class."""
    candidates: List[MarketDataProvider] = []
    for p in providers:
        if data_type not in p.supported_data_types():
            continue
        if asset_class and asset_class not in p.supported_asset_classes():
            continue
        candidates.append(p)
    return candidates


def choose_best_provider(
    providers: List[MarketDataProvider],
    data_type: DataType,
    asset_class: AssetClass = AssetClass.EQUITY,
    exchange: Exchange = Exchange.NYSE,
    region: Region = Region.US,
) -> Tuple[Optional[MarketDataProvider], float, str]:
    """Select the optimal provider based on fitness scoring.

    Returns:
        Tuple of (best_provider_instance, calculated_score, selection_reason)
    """
    if not providers:
        return None, 0.0, "No providers registered in registry."

    candidates = filter_providers(providers, data_type, asset_class)
    if not candidates:
        return None, 0.0, f"No registered provider supports data_type={data_type.value} and asset_class={asset_class.value}."

    scored_list: List[Tuple[MarketDataProvider, float]] = []
    for p in candidates:
        s = score_provider(p, data_type, asset_class, exchange, region)
        scored_list.append((p, s))

    scored_list.sort(key=lambda x: x[1], reverse=True)
    best_provider, best_score = scored_list[0]

    reason = (
        f"Selected provider '{best_provider.provider_name().value}' with score {best_score:.1f} "
        f"(Health: {best_provider.health().status}, Latency: {best_provider.health().latency_ms:.1f}ms)."
    )

    return best_provider, best_score, reason


def build_fallback_chain(
    providers: List[MarketDataProvider],
    best_provider: Optional[MarketDataProvider],
    data_type: DataType,
) -> List[ProviderType]:
    """Build an ordered fallback chain of ProviderType tags excluding the best provider."""
    chain: List[ProviderType] = []
    best_name = best_provider.provider_name() if best_provider else None

    candidates = filter_providers(providers, data_type)
    for p in candidates:
        p_name = p.provider_name()
        if p_name != best_name and p_name not in chain:
            chain.append(p_name)

    return chain
