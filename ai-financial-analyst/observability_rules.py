"""
observability_rules.py — Pure Observability & Monitoring Mathematical Rules & Algorithms

Contains pure functions for latency percentile calculations (P50, P95, P99), moving averages,
z-score anomaly detection, health scoring, alert rule evaluation, and aggregate system health.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import math
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("observability_rules")


def record_latency(samples: List[float], new_latency_ms: float) -> List[float]:
    """Append new latency sample maintaining maximum buffer size of 1000."""
    updated = list(samples)
    updated.append(new_latency_ms)
    if len(updated) > 1000:
        updated = updated[-1000:]
    return updated


def calculate_percentiles(samples: List[float]) -> Tuple[float, float, float, float]:
    """Calculate (P50, P95, P99, Max) percentiles from a list of numeric samples."""
    if not samples:
        return (0.0, 0.0, 0.0, 0.0)

    sorted_s = sorted(samples)
    n = len(sorted_s)

    def _pct(p: float) -> float:
        idx = max(0, min(n - 1, int(math.ceil(p * n) - 1)))
        return sorted_s[idx]

    p50 = _pct(0.50)
    p95 = _pct(0.95)
    p99 = _pct(0.99)
    max_val = sorted_s[-1]

    return (round(p50, 2), round(p95, 2), round(p99, 2), round(max_val, 2))


def moving_average(samples: List[float], window: int = 10) -> float:
    """Calculate moving average over recent window."""
    if not samples:
        return 0.0
    w_samples = samples[-window:] if len(samples) >= window else samples
    return round(sum(w_samples) / len(w_samples), 4)


def detect_anomaly(
    current_value: float,
    historical_mean: float,
    std_dev: float,
    z_threshold: float = 3.0,
) -> bool:
    """Detect statistical anomaly using Z-score threshold."""
    if std_dev <= 0:
        return False
    z_score = abs(current_value - historical_mean) / std_dev
    return z_score >= z_threshold


def health_score(
    latency_p95_ms: float,
    error_rate_pct: float,
    max_acceptable_latency_ms: float = 100.0,
) -> float:
    """Calculate 0-100 health score based on P95 latency and error rate."""
    score = 100.0

    # Latency penalty: up to -40 points for 2x max acceptable latency
    if latency_p95_ms > max_acceptable_latency_ms:
        over = (latency_p95_ms - max_acceptable_latency_ms) / max_acceptable_latency_ms
        score -= min(40.0, over * 40.0)

    # Error rate penalty: up to -60 points for 10% error rate
    score -= min(60.0, error_rate_pct * 6.0)

    return round(max(0.0, score), 1)


def service_status(h_score: float) -> str:
    """Classify SubsystemStatus based on health score."""
    if h_score >= 90.0:
        return "HEALTHY"
    if h_score >= 60.0:
        return "DEGRADED"
    return "UNHEALTHY"


def system_health(subsystem_scores: List[float]) -> Tuple[float, str]:
    """Calculate overall system health score and aggregate status."""
    if not subsystem_scores:
        return (100.0, "HEALTHY")

    avg_score = round(sum(subsystem_scores) / len(subsystem_scores), 1)
    status = service_status(avg_score)
    return (avg_score, status)


def trigger_alert(rule: Any, current_val: float) -> bool:
    """Evaluate single alert rule against current metric value."""
    if not getattr(rule, "is_enabled", True):
        return False

    thresh = float(getattr(rule, "threshold", 0.0))
    comp = str(getattr(rule, "comparison", "GT")).strip().upper()

    if comp == "GT" and current_val > thresh:
        return True
    if comp == "LT" and current_val < thresh:
        return True
    if comp == "EQ" and abs(current_val - thresh) < 0.0001:
        return True

    return False


def evaluate_alert_rules(rules: List[Any], current_metrics: Dict[str, float]) -> List[Any]:
    """Evaluate list of alert rules against current metric map."""
    triggered = []
    for r in rules:
        m_name = getattr(r, "metric_name", "")
        if m_name in current_metrics:
            val = current_metrics[m_name]
            if trigger_alert(r, val):
                triggered.append(r)
    return triggered


def aggregate_metrics(samples: List[float]) -> Dict[str, float]:
    """Calculate basic metric statistics (mean, min, max, count)."""
    if not samples:
        return {"mean": 0.0, "min": 0.0, "max": 0.0, "count": 0}
    return {
        "mean": round(sum(samples) / len(samples), 4),
        "min": round(min(samples), 4),
        "max": round(max(samples), 4),
        "count": len(samples),
    }
