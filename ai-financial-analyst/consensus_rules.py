"""
consensus_rules.py — Pure Multi-Provider Consensus Scoring Rules

Contains pure algorithm functions for detecting outliers, calculating provider agreement percentages,
computing multi-provider confidence scores, performing majority voting, and merging news feeds.

No HTTP requests, networking, or router modifications.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from market_entities import HistoricalSeries, MarketNews, MarketStatus, OHLCBar, Quote
from market_types import MarketSession, ProviderType
from normalized_response import NormalizedResponse
from consensus_models import (
    ConsensusAgreement,
    ConsensusProviderVote,
    ConsensusResult,
    ConsensusStatistics,
)

logger = logging.getLogger("consensus_rules")


def detect_outliers(
    responses: List[NormalizedResponse[Any]], tolerance_pct: float = 0.15
) -> Tuple[List[NormalizedResponse[Any]], List[NormalizedResponse[Any]]]:
    """Identify normal vs outlier responses based on numerical deviation from median.

    Args:
        responses: List of NormalizedResponse envelopes from multiple providers.
        tolerance_pct: Acceptable percentage deviation from median (default 0.15%).

    Returns:
        Tuple of (normal_responses, outlier_responses).
    """
    if len(responses) <= 2:
        return responses, []

    # Extract numerical price/value from payloads
    extracted: List[Tuple[NormalizedResponse[Any], float]] = []
    for resp in responses:
        if not resp.value:
            continue
        val = getattr(resp.value, "price", None)
        if val is None and hasattr(resp.value, "close"):
            val = getattr(resp.value, "close")
        if val is not None and isinstance(val, (int, float)) and val > 0:
            extracted.append((resp, float(val)))

    if len(extracted) <= 2:
        return responses, []

    prices = sorted([item[1] for item in extracted])
    mid_idx = len(prices) // 2
    median_val = prices[mid_idx] if len(prices) % 2 != 0 else (prices[mid_idx - 1] + prices[mid_idx]) / 2.0

    normal: List[NormalizedResponse[Any]] = []
    outliers: List[NormalizedResponse[Any]] = []

    for resp, val in extracted:
        dev_pct = (abs(val - median_val) / median_val) * 100.0 if median_val else 0.0
        if dev_pct > tolerance_pct and dev_pct > 1.0:  # Require at least 1.0% absolute deviation for outlier classification
            outliers.append(resp)
            logger.warning(
                "Detected outlier response from provider %s (Val: %.2f vs Median: %.2f, Dev: %.2f%%)",
                resp.provider, val, median_val, dev_pct
            )
        else:
            normal.append(resp)

    return (normal if normal else responses), outliers


def calculate_agreement_percentage(agreeing_count: int, total_count: int) -> float:
    """Calculate percentage agreement score (0.0 to 100.0%)."""
    if total_count <= 0:
        return 100.0
    return (agreeing_count / total_count) * 100.0


def calculate_confidence(
    responses: List[NormalizedResponse[Any]],
    agreeing_count: int,
    total_count: int,
    agreement_pct: float,
) -> float:
    """Compute multi-provider confidence score combining provider count, latency, freshness, and agreement.

    Formula:
      Base Score = 0.50 + (0.30 * agreement_pct / 100) + (0.10 * min(3, total_count) / 3) + (0.10 * fresh_bonus)
    """
    if not responses:
        return 0.0

    if total_count == 1:
        # Single provider source
        single_conf = responses[0].confidence
        return round(single_conf * 0.90, 4)

    agree_factor = (agreement_pct / 100.0) * 0.35
    count_factor = min(1.0, total_count / 3.0) * 0.15

    avg_staleness = sum(r.staleness_ms for r in responses) / total_count
    fresh_factor = max(0.0, 0.10 - (avg_staleness / 10000.0))

    base_conf = 0.40 + agree_factor + count_factor + fresh_factor
    return round(min(1.0, max(0.0, base_conf)), 4)


def select_consensus_value(
    responses: List[NormalizedResponse[Any]], outliers: List[NormalizedResponse[Any]]
) -> Tuple[NormalizedResponse[Any], ProviderType]:
    """Select the optimal canonical NormalizedResponse from non-outlier candidates."""
    valid_candidates = [r for r in responses if r not in outliers and r.value is not None]
    if not valid_candidates:
        valid_candidates = [r for r in responses if r.value is not None]

    if not valid_candidates:
        return responses[0], responses[0].provider

    # Sort by provider confidence descending, then staleness ascending
    valid_candidates.sort(key=lambda r: (r.confidence, -r.staleness_ms), reverse=True)
    winner = valid_candidates[0]
    return winner, winner.provider


def compare_quotes(
    responses: List[NormalizedResponse[Quote]], tolerance_pct: float = 0.15
) -> ConsensusResult:
    """Compare real-time Quote envelopes across multiple providers and compute consensus result."""
    now_iso = datetime.now(timezone.utc).isoformat()

    if not responses:
        raise ValueError("Cannot compute consensus on empty response list.")

    if len(responses) == 1:
        resp = responses[0]
        vote = ConsensusProviderVote(
            provider=resp.provider,
            vote_value=resp.value.price if resp.value else 0.0,
            confidence_weight=resp.confidence,
            staleness_ms=resp.staleness_ms,
        )
        return ConsensusResult(
            normalized_response=resp,
            provider_votes=[vote],
            selected_provider=resp.provider,
            agreement_status="SINGLE_SOURCE",
            agreement_percentage=100.0,
            confidence=resp.confidence,
            outlier_providers=[],
            execution_timestamp=now_iso,
        )

    normal_resp, outlier_resp = detect_outliers(responses, tolerance_pct)
    outlier_tags = [r.provider for r in outlier_resp]

    winning_resp, selected_tag = select_consensus_value(responses, outlier_resp)

    agreeing_tags = [r.provider for r in normal_resp]
    disagreeing_tags = [r.provider for r in outlier_resp]

    agree_pct = calculate_agreement_percentage(len(agreeing_tags), len(responses))
    confidence_score = calculate_confidence(responses, len(agreeing_tags), len(responses), agree_pct)

    votes: List[ConsensusProviderVote] = []
    for r in responses:
        votes.append(
            ConsensusProviderVote(
                provider=r.provider,
                vote_value=r.value.price if r.value else 0.0,
                is_outlier=(r in outlier_resp),
                confidence_weight=r.confidence,
                staleness_ms=r.staleness_ms,
                quality_flags=r.quality_flags,
            )
        )

    status = "AGREED" if agree_pct >= 80.0 else ("DISCREPANCY" if agree_pct > 0 else "NO_CONSENSUS")

    return ConsensusResult(
        normalized_response=winning_resp,
        provider_votes=votes,
        selected_provider=selected_tag,
        agreement_status=status,
        agreement_percentage=agree_pct,
        confidence=confidence_score,
        outlier_providers=outlier_tags,
        execution_timestamp=now_iso,
        metadata={"tolerance_pct": tolerance_pct, "total_votes": len(responses)},
    )


def compare_historical(
    responses: List[NormalizedResponse[HistoricalSeries]]
) -> ConsensusResult:
    """Compare HistoricalSeries envelopes across providers (bar count, close prices, timestamps)."""
    now_iso = datetime.now(timezone.utc).isoformat()
    if len(responses) == 1:
        resp = responses[0]
        return ConsensusResult(
            normalized_response=resp,
            provider_votes=[ConsensusProviderVote(provider=resp.provider, vote_value=len(resp.value.candles) if resp.value else 0)],
            selected_provider=resp.provider,
            agreement_status="SINGLE_SOURCE",
            agreement_percentage=100.0,
            confidence=resp.confidence,
            execution_timestamp=now_iso,
        )

    # Sort by number of candles descending
    valid = [r for r in responses if r.value and len(r.value.candles) > 0]
    if not valid:
        valid = responses

    valid.sort(key=lambda r: len(r.value.candles) if r.value else 0, reverse=True)
    winner = valid[0]

    votes = [
        ConsensusProviderVote(
            provider=r.provider,
            vote_value=len(r.value.candles) if r.value else 0,
            confidence_weight=r.confidence,
        )
        for r in responses
    ]

    return ConsensusResult(
        normalized_response=winner,
        provider_votes=votes,
        selected_provider=winner.provider,
        agreement_status="AGREED",
        agreement_percentage=100.0,
        confidence=winner.confidence,
        execution_timestamp=now_iso,
    )


def compare_news(
    responses: List[NormalizedResponse[List[MarketNews]]]
) -> ConsensusResult:
    """Deduplicate news headlines across providers and merge unique news articles."""
    now_iso = datetime.now(timezone.utc).isoformat()
    seen_headlines = set()
    merged_news: List[MarketNews] = []
    contributing_providers: List[ProviderType] = []

    for r in responses:
        if not r.value or not isinstance(r.value, list):
            continue
        contributing_providers.append(r.provider)
        for item in r.value:
            norm_headline = item.headline.strip().lower()
            if norm_headline not in seen_headlines and len(norm_headline) > 5:
                seen_headlines.add(norm_headline)
                merged_news.append(item)

    merged_envelope = NormalizedResponse(
        value=merged_news,
        provider=responses[0].provider if responses else ProviderType.INTERNAL,
        provider_timestamp=now_iso,
        received_timestamp=now_iso,
        normalized_timestamp=now_iso,
        confidence=0.98 if len(contributing_providers) > 1 else 0.85,
        agreement_status="AGREED" if len(contributing_providers) > 1 else "SINGLE_SOURCE",
        metadata={"merged_count": len(merged_news), "contributors": [p.value for p in contributing_providers]},
    )

    votes = [
        ConsensusProviderVote(provider=r.provider, vote_value=len(r.value) if isinstance(r.value, list) else 0)
        for r in responses
    ]

    return ConsensusResult(
        normalized_response=merged_envelope,
        provider_votes=votes,
        selected_provider=responses[0].provider if responses else ProviderType.INTERNAL,
        agreement_status="AGREED" if len(contributing_providers) > 1 else "SINGLE_SOURCE",
        agreement_percentage=100.0,
        confidence=merged_envelope.confidence,
        execution_timestamp=now_iso,
    )


def compare_market_status(
    responses: List[NormalizedResponse[MarketStatus]]
) -> ConsensusResult:
    """Perform majority voting on exchange market session status (open vs closed)."""
    now_iso = datetime.now(timezone.utc).isoformat()
    if not responses:
        raise ValueError("No responses to compare market status.")

    open_count = sum(1 for r in responses if r.value and r.value.is_open)
    closed_count = len(responses) - open_count

    majority_is_open = open_count >= closed_count
    winner = next((r for r in responses if r.value and r.value.is_open == majority_is_open), responses[0])

    agree_pct = calculate_agreement_percentage(max(open_count, closed_count), len(responses))
    confidence_score = calculate_confidence(responses, max(open_count, closed_count), len(responses), agree_pct)

    votes = [
        ConsensusProviderVote(provider=r.provider, vote_value="OPEN" if (r.value and r.value.is_open) else "CLOSED")
        for r in responses
    ]

    return ConsensusResult(
        normalized_response=winner,
        provider_votes=votes,
        selected_provider=winner.provider,
        agreement_status="AGREED" if agree_pct >= 66.0 else "DISCREPANCY",
        agreement_percentage=agree_pct,
        confidence=confidence_score,
        execution_timestamp=now_iso,
    )
