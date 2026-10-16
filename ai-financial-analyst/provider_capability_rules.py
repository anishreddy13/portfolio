"""
provider_capability_rules.py — Pure Provider Capability Scoring Rules

Contains pure algorithm functions evaluating capability matrix entries against data queries.
Combines feature support, historical depth, latency, cost tier, asset class, and exchange support.

No HTTP, networking, or router modifications.
"""

from __future__ import annotations

import logging
from typing import List, Optional, Tuple

from market_types import AssetClass, DataType, Exchange, ProviderType
from provider_capability_matrix import ProviderCapabilityMatrix, global_capability_matrix
from provider_capability_models import CapabilityMatrixEntry

logger = logging.getLogger("provider_capability_rules")


def supports_request(
    entry: CapabilityMatrixEntry,
    data_type: DataType,
    asset_class: Optional[AssetClass] = None,
    exchange: Optional[Exchange] = None,
) -> bool:
    """Determine if a matrix entry supports the requested data type, asset class, and exchange.

    Args:
        entry: Target CapabilityMatrixEntry.
        data_type: Required DataType.
        asset_class: Optional AssetClass constraint.
        exchange: Optional Exchange constraint.

    Returns:
        True if all constraints are supported by entry.
    """
    if data_type not in entry.data_types:
        return False

    if asset_class and asset_class not in entry.asset_classes:
        return False

    if exchange and exchange not in entry.exchanges:
        return False

    return True


def provider_score(
    entry: CapabilityMatrixEntry,
    data_type: DataType,
    asset_class: AssetClass = AssetClass.EQUITY,
    exchange: Exchange = Exchange.NYSE,
) -> float:
    """Calculate multi-dimensional capability score for a provider matrix entry.

    Combines:
      - Explicit Priority Weight for data_type: +priority points
      - Latency Bonus: +max(0, 50 - latency_ms / 10)
      - History Depth Bonus: +min(30, max_history_depth_days / 100)
      - Cost Tier Adjustment: Free (+10), Premium (+20 for enterprise reliability)
      - Asset & Exchange Support: +15 points each
    """
    if not supports_request(entry, data_type, asset_class, exchange):
        return -500.0

    score = 0.0

    # 1. Base Priority Weight for Data Type
    prio = entry.priority_per_data_type.get(data_type, 50)
    score += float(prio)

    # 2. Latency Bonus
    lat_bonus = max(0.0, 50.0 - (entry.capabilities.typical_latency_ms / 10.0))
    score += lat_bonus

    # 3. History Depth Bonus
    depth_bonus = min(30.0, float(entry.capabilities.max_history_depth_days) / 100.0)
    score += depth_bonus

    # 4. Cost Tier Weighting
    if entry.cost_tier in ("PREMIUM", "ENTERPRISE"):
        score += 20.0  # Premium accounts have higher rate limits and reliability
    elif entry.cost_tier == "FREE":
        score += 10.0

    # 5. Asset & Exchange Support
    if asset_class in entry.asset_classes:
        score += 15.0
    if exchange in entry.exchanges:
        score += 15.0

    return score


def best_provider_for_data_type(
    matrix: Optional[ProviderCapabilityMatrix] = None,
    data_type: DataType = DataType.QUOTE,
    asset_class: AssetClass = AssetClass.EQUITY,
    exchange: Exchange = Exchange.NYSE,
) -> Optional[ProviderType]:
    """Find the single best provider for a request using capability scoring.

    Args:
        matrix: Target ProviderCapabilityMatrix instance.
        data_type: Requested DataType.
        asset_class: Target AssetClass.
        exchange: Target Exchange.

    Returns:
        Optimal ProviderType tag or None.
    """
    mat = matrix or global_capability_matrix
    candidates = mat.providers_for(data_type)

    if not candidates:
        return None

    scored: List[Tuple[ProviderType, float]] = []
    for p in candidates:
        entry = mat.get(p)
        if entry:
            s = provider_score(entry, data_type, asset_class, exchange)
            scored.append((p, s))

    if not scored:
        return None

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[0][0]


def fallback_providers(
    matrix: Optional[ProviderCapabilityMatrix] = None,
    data_type: DataType = DataType.QUOTE,
    primary: Optional[ProviderType] = None,
) -> List[ProviderType]:
    """Construct an ordered fallback list of providers excluding the primary provider."""
    mat = matrix or global_capability_matrix
    candidates = mat.providers_for(data_type)

    if primary and primary in candidates:
        candidates.remove(primary)

    scored: List[Tuple[ProviderType, float]] = []
    for p in candidates:
        entry = mat.get(p)
        if entry:
            s = provider_score(entry, data_type)
            scored.append((p, s))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [item[0] for item in scored]
