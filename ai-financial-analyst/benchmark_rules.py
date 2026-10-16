"""
benchmark_rules.py — Pure Benchmark Mathematical Rules & Algorithms

Contains pure functions for latency percentiles (P50, P95, P99), throughput calculations,
request per second (RPS) rate, success/error rate computations, resource utilization summarization,
and benchmark report comparison logic.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import math
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("benchmark_rules")


def percentiles(samples: List[float]) -> Tuple[float, float, float, float]:
    """Calculate (P50, P95, P99, Max) percentiles from a list of latency samples."""
    if not samples:
        return (0.0, 0.0, 0.0, 0.0)

    sorted_s = sorted(samples)
    n = len(sorted_s)

    def _pct(p: float) -> float:
        idx = max(0, min(n - 1, int(math.ceil(p * n) - 1)))
        return sorted_s[idx]

    return (
        round(_pct(0.50), 2),
        round(_pct(0.95), 2),
        round(_pct(0.99), 2),
        round(sorted_s[-1], 2),
    )


def latency_distribution(samples: List[float]) -> Dict[str, float]:
    """Return dictionary of latency distribution metrics."""
    p50, p95, p99, max_val = percentiles(samples)
    min_val = min(samples) if samples else 0.0
    return {
        "p50_ms": p50,
        "p95_ms": p95,
        "p99_ms": p99,
        "max_ms": max_val,
        "min_ms": round(min_val, 2),
    }


def throughput(total_req: int, duration_sec: float) -> float:
    """Calculate throughput requests per second."""
    if duration_sec <= 0:
        return 0.0
    return round(total_req / duration_sec, 1)


def requests_per_second(total_req: int, duration_sec: float) -> float:
    """Alias for throughput calculation."""
    return throughput(total_req, duration_sec)


def success_rate(success_count: int, total_count: int) -> float:
    """Calculate percentage success rate (0-100%)."""
    if total_count <= 0:
        return 100.0
    return round((success_count / total_count) * 100.0, 2)


def error_rate(failed_count: int, total_count: int) -> float:
    """Calculate percentage error rate (0-100%)."""
    if total_count <= 0:
        return 0.0
    return round((failed_count / total_count) * 100.0, 2)


def resource_summary(cpu_pct: float, memory_mb: float) -> Dict[str, Any]:
    """Summarize cluster resource utilization envelope."""
    return {
        "cpu_usage_pct": round(cpu_pct, 1),
        "memory_usage_mb": round(memory_mb, 1),
        "status": "HEALTHY" if cpu_pct < 80.0 else "HIGH_LOAD",
    }


def benchmark_summary(reports: List[Any]) -> Dict[str, Any]:
    """Generate aggregate benchmark evaluation summary across historical runs."""
    tot = len(reports)
    if tot == 0:
        return {
            "total_runs": 0,
            "passed_runs": 0,
            "average_p95_ms": 0.0,
            "overall_status": "NO_RUNS",
        }

    passed = len([r for r in reports if getattr(r, "status", "") == "PASSED"])
    p95_list = [getattr(getattr(r, "latency", None), "p95_ms", 0.0) for r in reports]
    avg_p95 = sum(p95_list) / tot if tot > 0 else 0.0

    return {
        "total_runs": tot,
        "passed_runs": passed,
        "average_p95_ms": round(avg_p95, 2),
        "overall_status": "PASSED" if passed == tot else "DEGRADED",
    }
