"""
provider_execution_models.py — Data Models for Provider Execution Layer

Defines ExecutionAttempt and ExecutionTrace dataclasses tracking individual execution
attempts, per-attempt latencies, retry counts, fallback usage, and execution status.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from market_types import ProviderType


@dataclass
class ExecutionAttempt:
    """Represents a single execution attempt against a market data provider.

    Attributes:
        provider: ProviderType tag targeted in this attempt.
        start_time: ISO timestamp when attempt initiated.
        end_time: ISO timestamp when attempt completed.
        duration_ms: Round-trip duration of attempt in milliseconds.
        status: Execution status ('SUCCESS', 'FAILED', 'RETRYING', 'TIMED_OUT').
        error_message: Optional exception / failure message.
        retry_number: Retry sequence number (0 for initial attempt).
    """
    provider: ProviderType
    start_time: str = ""
    end_time: str = ""
    duration_ms: float = 0.0
    status: str = "FAILED"
    error_message: Optional[str] = None
    retry_number: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert ExecutionAttempt to clean dictionary."""
        return {
            "provider": self.provider.value if hasattr(self.provider, "value") else str(self.provider),
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration_ms": round(self.duration_ms, 2),
            "status": self.status,
            "error_message": self.error_message,
            "retry_number": self.retry_number,
        }


@dataclass
class ExecutionTrace:
    """Comprehensive execution trace capturing all attempts across primary and fallback chain.

    Attributes:
        attempts: Chronological list of ExecutionAttempt objects.
        successful_provider: ProviderType tag of provider that successfully fulfilled request.
        total_duration_ms: Total duration across all retries and fallbacks in ms.
        fallback_used: True if request was fulfilled by a fallback provider.
        final_status: Overall trace execution status ('COMPLETED', 'FAILED').
    """
    attempts: List[ExecutionAttempt] = field(default_factory=list)
    successful_provider: Optional[ProviderType] = None
    total_duration_ms: float = 0.0
    fallback_used: bool = False
    final_status: str = "FAILED"

    def to_dict(self) -> Dict[str, Any]:
        """Convert ExecutionTrace to clean dictionary."""
        return {
            "attempts": [a.to_dict() for a in self.attempts],
            "successful_provider": (
                self.successful_provider.value if hasattr(self.successful_provider, "value")
                else (str(self.successful_provider) if self.successful_provider else None)
            ),
            "total_duration_ms": round(self.total_duration_ms, 2),
            "fallback_used": self.fallback_used,
            "final_status": self.final_status,
        }
