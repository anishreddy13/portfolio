"""
streaming_consensus_models.py — Data Models for Streaming Consensus Layer

Defines StreamingProviderVote, StreamingConsensusState, StreamingConsensusResult,
and StreamingConsensusStatistics dataclasses with JSON serialization support.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class StreamingProviderVote:
    """Represents a streaming tick vote from an individual provider.

    Attributes:
        provider: Provider tag string (e.g. 'POLYGON', 'ALPACA', 'FINNHUB').
        symbol: Target ticker symbol.
        price: Observed tick price.
        timestamp: ISO timestamp of stream tick.
        latency_ms: Measured stream transport latency in ms.
        message: Original StreamMessage object.
    """
    provider: str
    symbol: str
    price: float
    timestamp: str
    latency_ms: float = 0.0
    message: Any = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert StreamingProviderVote to clean dictionary."""
        msg_dict = self.message.to_dict() if hasattr(self.message, "to_dict") else self.message
        return {
            "provider": self.provider,
            "symbol": self.symbol,
            "price": self.price,
            "timestamp": self.timestamp,
            "latency_ms": round(self.latency_ms, 2),
            "message": msg_dict,
        }


@dataclass
class StreamingConsensusState:
    """In-flight window state for a single ticker symbol.

    Attributes:
        symbol: Target ticker symbol.
        window_start_iso: ISO timestamp marking start of consensus window.
        votes: Map of provider name to StreamingProviderVote.
        is_ready: True if consensus window has closed and is ready for evaluation.
    """
    symbol: str
    window_start_iso: str
    votes: Dict[str, StreamingProviderVote] = field(default_factory=dict)
    is_ready: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert StreamingConsensusState to clean dictionary."""
        return {
            "symbol": self.symbol,
            "window_start_iso": self.window_start_iso,
            "votes": {k: v.to_dict() for k, v in self.votes.items()},
            "is_ready": self.is_ready,
        }


@dataclass
class StreamingConsensusResult:
    """Canonical multi-provider real-time stream consensus evaluation result.

    Attributes:
        symbol: Target ticker symbol.
        data_type: DataType category string.
        consensus_price: Calculated consensus price.
        consensus_message: Canonical winning StreamMessage.
        agreement_status: Agreement state ('AGREED', 'SINGLE_SOURCE', 'DISAGREED').
        agreement_percentage: Percentage agreement across providers (0.0 to 100.0%).
        confidence: Combined confidence score (0.0 to 1.0).
        provider_votes: Map of participating provider votes.
        outlier_providers: List of provider names flagged as outliers.
        timestamp: ISO timestamp of consensus evaluation.
    """
    symbol: str
    data_type: str
    consensus_price: float
    consensus_message: Any
    agreement_status: str = "AGREED"
    agreement_percentage: float = 100.0
    confidence: float = 0.99
    provider_votes: Dict[str, StreamingProviderVote] = field(default_factory=dict)
    outlier_providers: List[str] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert StreamingConsensusResult to clean dictionary."""
        msg_dict = self.consensus_message.to_dict() if hasattr(self.consensus_message, "to_dict") else self.consensus_message
        return {
            "symbol": self.symbol,
            "data_type": self.data_type,
            "consensus_price": round(self.consensus_price, 4),
            "consensus_message": msg_dict,
            "agreement_status": self.agreement_status,
            "agreement_percentage": round(self.agreement_percentage, 2),
            "confidence": round(self.confidence, 4),
            "provider_votes": {k: v.to_dict() for k, v in self.provider_votes.items()},
            "outlier_providers": self.outlier_providers,
            "timestamp": self.timestamp,
        }


@dataclass
class StreamingConsensusStatistics:
    """Operational metrics tracking the real-time Streaming Consensus Engine.

    Attributes:
        messages_received: Total stream messages ingested.
        consensus_completed: Successful multi-provider consensus evaluations completed.
        single_source_results: Evaluations completed with a single provider vote.
        outliers_detected: Count of stream tick outliers rejected.
        average_consensus_latency_ms: Average consensus window duration in ms.
    """
    messages_received: int = 0
    consensus_completed: int = 0
    single_source_results: int = 0
    outliers_detected: int = 0
    average_consensus_latency_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert StreamingConsensusStatistics to clean dictionary."""
        return {
            "messages_received": self.messages_received,
            "consensus_completed": self.consensus_completed,
            "single_source_results": self.single_source_results,
            "outliers_detected": self.outliers_detected,
            "average_consensus_latency_ms": round(self.average_consensus_latency_ms, 2),
        }
