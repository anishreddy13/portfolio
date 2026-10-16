"""
provider_health.py — Provider Operational Health Data Model

Defines data structure for tracking provider status, response latency, rate limit
consumption, and health state across market data providers.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict

from market_types import ProviderType


@dataclass
class ProviderHealth:
    """Operational health snapshot for a single market data provider.

    Attributes:
        provider: ProviderType tag (e.g. POLYGON, ALPACA, FINNHUB).
        status: Health status label ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'RATE_LIMITED', 'UNKNOWN').
        latency_ms: Round-trip response latency in milliseconds.
        last_success: ISO timestamp of most recent successful request.
        last_failure: ISO timestamp of most recent failed request.
        success_rate: Rolling success rate percentage (0.0 to 1.0).
        failure_count: Cumulative failure count.
        consecutive_failures: Current streak of consecutive failed calls.
        rate_limit_remaining: Number of requests remaining in current rate limit window.
        healthy: True if provider is operational and fit for traffic.
    """
    provider: ProviderType
    status: str = "UNKNOWN"
    latency_ms: float = 0.0
    last_success: str = ""
    last_failure: str = ""
    success_rate: float = 1.0
    failure_count: int = 0
    consecutive_failures: int = 0
    rate_limit_remaining: int = 1000
    healthy: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert ProviderHealth to clean dictionary."""
        return {
            "provider": self.provider.value if hasattr(self.provider, "value") else str(self.provider),
            "status": self.status,
            "latency_ms": round(self.latency_ms, 2),
            "last_success": self.last_success,
            "last_failure": self.last_failure,
            "success_rate": round(self.success_rate, 4),
            "failure_count": self.failure_count,
            "consecutive_failures": self.consecutive_failures,
            "rate_limit_remaining": self.rate_limit_remaining,
            "healthy": self.healthy,
        }
