"""
market_refresh_models.py — Data Models for Enterprise Stale-While-Revalidate (SWR) Engine

Defines RefreshTask, RefreshStatistics, and RefreshConfiguration dataclasses
with JSON serialization support.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass
class RefreshTask:
    """Represents a background cache refresh task inside SWR engine queue.

    Attributes:
        key: Unique cache key tag (e.g. 'QUOTE:AAPL').
        data_type: DataType category string.
        symbol: Target ticker symbol.
        created_at: ISO timestamp when refresh task was enqueued.
        priority: Priority ranking integer (higher = processed first).
        status: Current task status ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED').
    """
    key: str
    data_type: str
    symbol: str
    created_at: str = ""
    priority: int = 50
    status: str = "QUEUED"

    def to_dict(self) -> Dict[str, Any]:
        """Convert RefreshTask to clean dictionary."""
        return {
            "key": self.key,
            "data_type": self.data_type,
            "symbol": self.symbol,
            "created_at": self.created_at,
            "priority": self.priority,
            "status": self.status,
        }


@dataclass
class RefreshStatistics:
    """Operational metrics tracking background SWR refresh jobs.

    Attributes:
        refresh_requests: Total refresh task enqueue requests received.
        completed_refreshes: Successfully completed background refreshes.
        skipped_refreshes: Duplicate refresh requests suppressed.
        average_refresh_time_ms: Average background refresh duration in ms.
        active_refresh_jobs: Current number of active background worker tasks.
    """
    refresh_requests: int = 0
    completed_refreshes: int = 0
    skipped_refreshes: int = 0
    average_refresh_time_ms: float = 0.0
    active_refresh_jobs: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert RefreshStatistics to clean dictionary."""
        return {
            "refresh_requests": self.refresh_requests,
            "completed_refreshes": self.completed_refreshes,
            "skipped_refreshes": self.skipped_refreshes,
            "average_refresh_time_ms": round(self.average_refresh_time_ms, 2),
            "active_refresh_jobs": self.active_refresh_jobs,
        }


@dataclass
class RefreshConfiguration:
    """Configuration settings for EnterpriseRefreshEngine.

    Attributes:
        max_worker_threads: Max concurrent background worker threads.
        stale_grace_sec: Grace period in seconds where stale data is served while refreshing.
        enable_swr: True to enable Stale-While-Revalidate background engine.
    """
    max_worker_threads: int = 3
    stale_grace_sec: float = 300.0
    enable_swr: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert RefreshConfiguration to clean dictionary."""
        return {
            "max_worker_threads": self.max_worker_threads,
            "stale_grace_sec": self.stale_grace_sec,
            "enable_swr": self.enable_swr,
        }
