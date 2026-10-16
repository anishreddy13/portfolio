"""
drift_rules.py — Drift Evaluation Rules & Confidence Calculation Engine

Contains modular rules for calculating statistical drift across 10 strategy metrics,
determining confidence scores (0-100), triggering alerts, and generating purely
descriptive observation strings without trade/investment advice.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from drift_models import DriftAlert, DriftMetric

logger = logging.getLogger("drift_rules")

# ─────────────────────────────────────────────
# 1. Confidence Score Calculation
# ─────────────────────────────────────────────

def calculate_confidence(sample_size: int, baseline_count: int = 100) -> int:
    """Calculate statistical confidence score (0-100) based on sample size.

    Fewer trades = lower confidence due to small sample size noise.
    More trades = higher confidence approaching 100%.
    """
    if sample_size <= 0:
        return 0
    if sample_size < 5:
        return 35
    elif sample_size < 15:
        return 55
    elif sample_size < 30:
        return 75
    elif sample_size < 50:
        return 88
    else:
        return 98


# ─────────────────────────────────────────────
# 2. Individual Metric Drift Evaluator
# ─────────────────────────────────────────────

def evaluate_metric_drift(
    name: str,
    baseline_value: float,
    current_value: float,
    sample_size: int,
    higher_is_better: bool = True,
    threshold_minor: float = 10.0,
    threshold_major: float = 25.0,
) -> DriftMetric:
    """Evaluate statistical drift for a single metric."""
    confidence = calculate_confidence(sample_size)

    if baseline_value == 0.0:
        drift_pct = 0.0 if current_value == 0.0 else 100.0
    else:
        drift_pct = ((current_value - baseline_value) / abs(baseline_value)) * 100.0

    # Determine if drift is adverse
    if higher_is_better:
        adverse_pct = -drift_pct  # Drop is adverse
    else:
        adverse_pct = drift_pct    # Increase (e.g. drawdown) is adverse

    has_drift = adverse_pct >= threshold_minor
    severity = "NONE"

    if adverse_pct >= threshold_major * 1.5:
        severity = "CRITICAL"
    elif adverse_pct >= threshold_major:
        severity = "MAJOR"
    elif adverse_pct >= threshold_minor * 1.5:
        severity = "MODERATE"
    elif adverse_pct >= threshold_minor:
        severity = "MINOR"

    return DriftMetric(
        name=name,
        baseline_value=baseline_value,
        current_value=current_value,
        drift_percent=drift_pct,
        has_drift=has_drift,
        severity=severity,
        confidence=confidence,
    )


# ─────────────────────────────────────────────
# 3. Overall Drift State & Alerts
# ─────────────────────────────────────────────

def determine_overall_drift_state(metrics: List[DriftMetric]) -> Tuple[str, int]:
    """Determine overall drift state and average confidence score.

    States: 'No Drift', 'Minor Drift', 'Moderate Drift', 'Major Drift', 'Critical Drift'
    """
    if not metrics:
        return "No Drift", 100

    severities = [m.severity for m in metrics if m.has_drift]
    confidences = [m.confidence for m in metrics]
    avg_conf = int(sum(confidences) / len(confidences)) if confidences else 100

    if "CRITICAL" in severities:
        return "Critical Drift", avg_conf
    elif "MAJOR" in severities:
        return "Major Drift", avg_conf
    elif "MODERATE" in severities:
        return "Moderate Drift", avg_conf
    elif "MINOR" in severities:
        return "Minor Drift", avg_conf

    return "No Drift", avg_conf


def generate_drift_alerts(metrics: List[DriftMetric]) -> List[DriftAlert]:
    """Generate structured drift alerts based on observed metric deviations."""
    alerts: List[DriftAlert] = []
    now = datetime.now(timezone.utc).isoformat()

    alert_mapping = {
        "Win Rate": ("PERFORMANCE_DRIFT", "Win rate decreased {drift:.1f}% compared to historical baseline."),
        "Profit Factor": ("PERFORMANCE_DRIFT", "Profit factor dropped {drift:.1f}% below historical expectation."),
        "Drawdown": ("DRAWDOWN_DRIFT", "Max drawdown increased {drift:.1f}% compared to historical baseline."),
        "Trade Frequency": ("TRADE_BEHAVIOUR_DRIFT", "Trade execution frequency shifted by {drift:.1f}%."),
        "Average Trade Duration": ("TRADE_BEHAVIOUR_DRIFT", "Average holding duration changed by {drift:.1f}%."),
        "Average Win": ("PERFORMANCE_DRIFT", "Average winning trade size decreased by {drift:.1f}%."),
        "Average Loss": ("RISK_DRIFT", "Average losing trade size expanded by {drift:.1f}%."),
        "Expectancy": ("PERFORMANCE_DRIFT", "Per-trade expectancy declined by {drift:.1f}%."),
        "Risk Exposure": ("RISK_DRIFT", "Capital risk exposure shifted by {drift:.1f}%."),
        "Market Regime Performance": ("MARKET_REGIME_DRIFT", "Strategy performance degraded under current market regime."),
    }

    for m in metrics:
        if m.has_drift and m.name in alert_mapping:
            alert_type, template = alert_mapping[m.name]
            desc = template.format(drift=abs(m.drift_percent))
            alerts.append(
                DriftAlert(
                    alert_type=alert_type,
                    severity=m.severity,
                    description=desc,
                    confidence=m.confidence,
                    timestamp=now,
                )
            )

    return alerts


def generate_drift_observations(metrics: List[DriftMetric]) -> List[str]:
    """Generate descriptive observation strings.

    STRICT CONSTRAINT:
    Must ONLY describe observed statistical deviations.
    Must NEVER recommend buying, selling, or altering strategy parameters.
    """
    obs: List[str] = []

    for m in metrics:
        if m.has_drift:
            if m.drift_percent < 0:
                obs.append(f"{m.name} decreased by {abs(m.drift_percent):.1f}% compared to historical baseline (current: {m.current_value:.2f}, baseline: {m.baseline_value:.2f}).")
            else:
                obs.append(f"{m.name} increased by {m.drift_percent:.1f}% compared to historical baseline (current: {m.current_value:.2f}, baseline: {m.baseline_value:.2f}).")

    if not obs:
        obs.append("No statistically significant behavioral or performance drift detected relative to baseline.")

    return obs
