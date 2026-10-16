"""
consensus_models.py — Data Models for Multi-Provider Consensus Layer

Defines ConsensusProviderVote, ConsensusAgreement, ConsensusStatistics, and ConsensusResult
dataclasses representing multi-provider vote distributions, agreement percentages,
confidence scores, and outlier detection reports.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from market_types import ProviderType
from normalized_response import NormalizedResponse


@dataclass
class ConsensusProviderVote:
    """Individual provider vote metadata inside consensus calculation.

    Attributes:
        provider: ProviderType tag.
        vote_value: Extracted numerical or structural payload value.
        is_outlier: True if response was flagged as a statistical outlier.
        confidence_weight: Weighted confidence contribution of provider (0.0 to 1.0).
        staleness_ms: Latency staleness of payload in milliseconds.
        quality_flags: Quality flags attached to provider envelope.
    """
    provider: ProviderType
    vote_value: Any
    is_outlier: bool = False
    confidence_weight: float = 1.0
    staleness_ms: int = 0
    quality_flags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert ConsensusProviderVote to clean dictionary."""
        return {
            "provider": self.provider.value if hasattr(self.provider, "value") else str(self.provider),
            "vote_value": self.vote_value,
            "is_outlier": self.is_outlier,
            "confidence_weight": round(self.confidence_weight, 4),
            "staleness_ms": self.staleness_ms,
            "quality_flags": self.quality_flags,
        }


@dataclass
class ConsensusAgreement:
    """Multi-provider agreement status and provider breakdown.

    Attributes:
        status: Agreement state ('AGREED', 'DISCREPANCY', 'SINGLE_SOURCE', 'NO_CONSENSUS').
        agreement_percentage: Percentage of providers agreeing on output (0.0 to 100.0%).
        agreeing_providers: List of ProviderType tags in consensus agreement.
        disagreeing_providers: List of ProviderType tags deviating from consensus.
    """
    status: str = "SINGLE_SOURCE"
    agreement_percentage: float = 100.0
    agreeing_providers: List[ProviderType] = field(default_factory=list)
    disagreeing_providers: List[ProviderType] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert ConsensusAgreement to clean dictionary."""
        return {
            "status": self.status,
            "agreement_percentage": round(self.agreement_percentage, 1),
            "agreeing_providers": [p.value if hasattr(p, "value") else str(p) for p in self.agreeing_providers],
            "disagreeing_providers": [p.value if hasattr(p, "value") else str(p) for p in self.disagreeing_providers],
        }


@dataclass
class ConsensusStatistics:
    """Statistical distribution metrics across provider numerical values.

    Attributes:
        mean_value: Arithmetic mean across provider payloads.
        median_value: Median price / metric across provider payloads.
        std_dev: Standard deviation across provider payloads.
        max_discrepancy_pct: Maximum percentage delta between any two providers.
    """
    mean_value: float = 0.0
    median_value: float = 0.0
    std_dev: float = 0.0
    max_discrepancy_pct: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert ConsensusStatistics to clean dictionary."""
        return {
            "mean_value": round(self.mean_value, 4),
            "median_value": round(self.median_value, 4),
            "std_dev": round(self.std_dev, 4),
            "max_discrepancy_pct": round(self.max_discrepancy_pct, 2),
        }


@dataclass
class ConsensusResult:
    """Master enterprise consensus payload output.

    Attributes:
        normalized_response: Single canonical NormalizedResponse containing winning value.
        provider_votes: List of ConsensusProviderVote objects representing all inputs.
        selected_provider: ProviderType tag of provider whose value was selected.
        agreement_status: Agreement summary ('AGREED', 'DISCREPANCY', 'SINGLE_SOURCE', 'NO_CONSENSUS').
        agreement_percentage: Percentage agreement score (0.0 to 100.0%).
        confidence: Combined multi-provider confidence score (0.0 to 1.0).
        outlier_providers: List of ProviderType tags rejected as outliers.
        execution_timestamp: ISO timestamp when consensus was calculated.
        metadata: Detailed statistical metadata and diagnostic flags.
    """
    normalized_response: NormalizedResponse[Any]
    provider_votes: List[ConsensusProviderVote] = field(default_factory=list)
    selected_provider: ProviderType = ProviderType.INTERNAL
    agreement_status: str = "SINGLE_SOURCE"
    agreement_percentage: float = 100.0
    confidence: float = 1.0
    outlier_providers: List[ProviderType] = field(default_factory=list)
    execution_timestamp: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert ConsensusResult to clean dictionary."""
        return {
            "normalized_response": self.normalized_response.to_dict(),
            "provider_votes": [v.to_dict() for v in self.provider_votes],
            "selected_provider": self.selected_provider.value if hasattr(self.selected_provider, "value") else str(self.selected_provider),
            "agreement_status": self.agreement_status,
            "agreement_percentage": round(self.agreement_percentage, 1),
            "confidence": round(self.confidence, 4),
            "outlier_providers": [o.value if hasattr(o, "value") else str(o) for o in self.outlier_providers],
            "execution_timestamp": self.execution_timestamp,
            "metadata": self.metadata,
        }
