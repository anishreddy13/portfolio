"""
routing_models.py — Data Models for Provider Router

Defines RoutingDecision and RoutingResult dataclasses representing provider selection
decisions, fallback chains, and execution routing summaries.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from market_types import DataType, Exchange, ProviderType, Region
from normalized_response import NormalizedResponse


@dataclass
class RoutingDecision:
    """Represents an intelligent provider selection decision.

    Attributes:
        requested_data_type: DataType category requested.
        requested_symbol: Target ticker symbol / query string.
        requested_exchange: Target Exchange venue.
        requested_region: Target Region geographic zone.
        selected_provider: ProviderType tag chosen to service primary request.
        fallback_chain: Ordered list of backup ProviderType tags.
        selection_reason: Human-readable rationale for selection decision.
        decision_timestamp: ISO timestamp when decision was computed.
    """
    requested_data_type: DataType
    requested_symbol: str
    requested_exchange: Exchange = Exchange.NYSE
    requested_region: Region = Region.US
    selected_provider: ProviderType = ProviderType.INTERNAL
    fallback_chain: List[ProviderType] = field(default_factory=list)
    selection_reason: str = ""
    decision_timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert RoutingDecision to clean dictionary."""
        return {
            "requested_data_type": self.requested_data_type.value if hasattr(self.requested_data_type, "value") else str(self.requested_data_type),
            "requested_symbol": self.requested_symbol,
            "requested_exchange": self.requested_exchange.value if hasattr(self.requested_exchange, "value") else str(self.requested_exchange),
            "requested_region": self.requested_region.value if hasattr(self.requested_region, "value") else str(self.requested_region),
            "selected_provider": self.selected_provider.value if hasattr(self.selected_provider, "value") else str(self.selected_provider),
            "fallback_chain": [p.value if hasattr(p, "value") else str(p) for p in self.fallback_chain],
            "selection_reason": self.selection_reason,
            "decision_timestamp": self.decision_timestamp,
        }


@dataclass
class RoutingResult:
    """Full execution summary containing routing decision and normalized response payload.

    Attributes:
        decision: RoutingDecision metadata.
        provider_response: NormalizedResponse payload returned by selected provider.
        provider_health_snapshot: Health metrics snapshot of servicing provider.
        routing_duration_ms: Total overhead duration of routing decision in ms.
    """
    decision: RoutingDecision
    provider_response: NormalizedResponse[Any]
    provider_health_snapshot: Optional[Dict[str, Any]] = None
    routing_duration_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert RoutingResult to clean dictionary."""
        return {
            "decision": self.decision.to_dict(),
            "provider_response": self.provider_response.to_dict(),
            "provider_health_snapshot": self.provider_health_snapshot,
            "routing_duration_ms": round(self.routing_duration_ms, 2),
        }
