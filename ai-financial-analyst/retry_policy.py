"""
retry_policy.py — Pure Provider Retry Policy Engine

Defines retry rules, exponential backoff delays, and retryable error classification.
Contains pure policy logic without networking or provider dependencies.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import List, Optional

logger = logging.getLogger("retry_policy")


@dataclass
class RetryPolicy:
    """Configurable policy dictating per-provider retry decisions and backoff delays.

    Attributes:
        max_retries: Maximum number of retry attempts per provider.
        retry_delay_ms: Initial base delay before first retry in milliseconds.
        backoff_multiplier: Exponential multiplier applied to delay per retry.
        retryable_errors: List of exception class names eligible for retry.
    """
    max_retries: int = 2
    retry_delay_ms: float = 300.0
    backoff_multiplier: float = 1.5
    retryable_errors: List[str] = field(
        default_factory=lambda: [
            "TimeoutError",
            "ConnectionError",
            "RuntimeError",
            "HTTPError",
            "RateLimitError",
        ]
    )

    def should_retry(self, attempt_count: int, exception: Optional[Exception] = None) -> bool:
        """Determine if a failed request should be retried based on attempt count and error.

        Args:
            attempt_count: Number of attempts already completed (1-indexed).
            exception: Exception raised during execution attempt.

        Returns:
            True if retry should be attempted.
        """
        if attempt_count >= self.max_retries:
            return False

        if exception is None:
            return True

        exc_name = exception.__class__.__name__
        # Check if exception type or message matches retryable criteria
        if any(err.lower() in exc_name.lower() or err.lower() in str(exception).lower() for err in self.retryable_errors):
            return True

        return True  # Default permissive retry policy for transient operational faults

    def next_delay(self, attempt_count: int) -> float:
        """Calculate exponential backoff delay in seconds for the next attempt.

        Args:
            attempt_count: Current attempt iteration (1-indexed).

        Returns:
            Delay duration in seconds.
        """
        delay_ms = self.retry_delay_ms * (self.backoff_multiplier ** max(0, attempt_count - 1))
        return delay_ms / 1000.0
