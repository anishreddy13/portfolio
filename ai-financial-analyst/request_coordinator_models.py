"""
request_coordinator_models.py — Data Models for Enterprise Request Coalescing (SingleFlight)

Defines PendingRequest, RequestStatistics, and RequestConfiguration dataclasses
with JSON serialization support.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass
class PendingRequest:
    """Represents a single in-flight SingleFlight request.

    Attributes:
        key: Unique request key (e.g. 'QUOTE:AAPL').
        created_at: ISO timestamp when request was initiated.
        waiters_count: Number of concurrent threads waiting for this request to complete.
        result: Evaluated ConsensusResult payload once completed.
        error: Error message string if request failed.
    """
    key: str
    created_at: str = ""
    waiters_count: int = 0
    result: Optional[Any] = None
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert PendingRequest to clean dictionary with JSON-serializable value."""
        res_dict = self.result.to_dict() if hasattr(self.result, "to_dict") else self.result
        return {
            "key": self.key,
            "created_at": self.created_at,
            "waiters_count": self.waiters_count,
            "result": res_dict,
            "error": self.error,
        }


@dataclass
class RequestStatistics:
    """Operational statistics for request coalescing and SingleFlight execution.

    Attributes:
        duplicate_requests_prevented: Count of redundant concurrent requests suppressed.
        active_requests: Current number of in-flight active SingleFlight requests.
        completed_requests: Cumulative total of completed SingleFlight requests.
        average_wait_ms: Average wait duration in ms for coalesced callers.
        timeout_count: Number of requests that timed out waiting for in-flight execution.
    """
    duplicate_requests_prevented: int = 0
    active_requests: int = 0
    completed_requests: int = 0
    average_wait_ms: float = 0.0
    timeout_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert RequestStatistics to clean dictionary."""
        return {
            "duplicate_requests_prevented": self.duplicate_requests_prevented,
            "active_requests": self.active_requests,
            "completed_requests": self.completed_requests,
            "average_wait_ms": round(self.average_wait_ms, 2),
            "timeout_count": self.timeout_count,
        }


@dataclass
class RequestConfiguration:
    """Configuration options for EnterpriseRequestCoordinator.

    Attributes:
        request_timeout_sec: Maximum wait duration in seconds before timing out.
        enable_coalescing: True to enable SingleFlight request deduplication.
    """
    request_timeout_sec: float = 10.0
    enable_coalescing: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert RequestConfiguration to clean dictionary."""
        return {
            "request_timeout_sec": self.request_timeout_sec,
            "enable_coalescing": self.enable_coalescing,
        }
