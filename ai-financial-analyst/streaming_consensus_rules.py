"""
streaming_consensus_rules.py — Pure Real-Time Streaming Consensus Rules

Contains pure mathematical algorithms for stream tick grouping, outlier detection (median deviation),
agreement scoring, confidence computation, and duplicate tick suppression.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import statistics
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Tuple

from streaming_consensus_models import StreamingConsensusState, StreamingProviderVote
from streaming_models import StreamMessage

logger = logging.getLogger("streaming_consensus_rules")


def group_events(messages: List[StreamMessage]) -> Dict[str, List[StreamMessage]]:
    """Group a list of StreamMessages by target ticker symbol."""
    grouped: Dict[str, List[StreamMessage]] = {}
    for msg in messages:
        sym = msg.symbol.upper()
        if sym not in grouped:
            grouped[sym] = []
        grouped[sym].append(msg)
    return grouped


def remove_duplicate_ticks(votes: List[StreamingProviderVote]) -> List[StreamingProviderVote]:
    """Remove duplicate tick votes from the same provider in a single window."""
    seen_providers: Set[str] = set()
    unique_votes: List[StreamingProviderVote] = []

    for v in votes:
        if v.provider not in seen_providers:
            seen_providers.add(v.provider)
            unique_votes.append(v)

    return unique_votes


def detect_stream_outliers(
    votes: List[StreamingProviderVote],
    tolerance_pct: float = 0.15,
) -> List[str]:
    """Detect streaming provider tick outliers deviating > tolerance_pct from median price.

    Args:
        votes: List of participating StreamingProviderVote objects.
        tolerance_pct: Max allowed percentage deviation from median price (default 0.15%).

    Returns:
        List of outlier provider tags.
    """
    if len(votes) < 3:
        return []

    prices = [v.price for v in votes if v.price > 0]
    if not prices:
        return []

    median_price = statistics.median(prices)
    outliers: List[str] = []

    for v in votes:
        if median_price == 0:
            continue
        dev_pct = abs(v.price - median_price) / median_price * 100.0
        if dev_pct > tolerance_pct:
            outliers.append(v.provider)
            logger.warning("Stream outlier detected: provider=%s, price=%.4f, median=%.4f (dev=%.2f%%)", v.provider, v.price, median_price, dev_pct)

    return outliers


def calculate_stream_agreement(valid_votes_count: int, total_votes_count: int) -> float:
    """Calculate stream agreement percentage across participating providers."""
    if total_votes_count <= 0:
        return 0.0
    return (valid_votes_count / total_votes_count) * 100.0


def calculate_stream_confidence(
    agreement_pct: float,
    participating_providers_count: int,
    avg_latency_ms: float = 10.0,
) -> float:
    """Calculate multi-provider stream confidence score (0.0 to 1.0).

    Factors:
      - Single source vs Multi-provider
      - Agreement percentage
      - Transport latency penalty
    """
    if participating_providers_count <= 1:
        return 0.85  # Single source base confidence

    base_score = (agreement_pct / 100.0) * 0.85
    provider_bonus = min(participating_providers_count * 0.05, 0.12)
    latency_penalty = min(avg_latency_ms / 1000.0 * 0.05, 0.05)

    final_score = base_score + provider_bonus - latency_penalty
    return max(0.1, min(0.99, final_score))


def select_stream_consensus(
    votes: List[StreamingProviderVote],
    outliers: List[str],
) -> StreamingProviderVote:
    """Select canonical winning StreamingProviderVote excluding outliers."""
    valid_votes = [v for v in votes if v.provider not in outliers]
    if not valid_votes:
        valid_votes = votes

    # Sort by lowest latency, then newest timestamp
    valid_votes.sort(key=lambda x: (x.latency_ms, x.timestamp), reverse=False)
    return valid_votes[0]


def merge_provider_ticks(votes: List[StreamingProviderVote]) -> StreamingProviderVote:
    """Merge tick price values using volume-weighted or median average across non-outlier votes."""
    if not votes:
        raise ValueError("Cannot merge empty votes list.")
    if len(votes) == 1:
        return votes[0]

    prices = [v.price for v in votes if v.price > 0]
    avg_price = statistics.median(prices) if prices else votes[0].price

    leader = votes[0]
    leader.price = avg_price
    return leader


def stream_consensus_ready(state: StreamingConsensusState, window_duration_sec: float = 0.1) -> bool:
    """Determine if a symbol's streaming consensus window has reached its duration threshold."""
    if state.is_ready:
        return True

    try:
        start_dt = datetime.fromisoformat(state.window_start_iso)
        now_dt = datetime.now(timezone.utc)
        elapsed = (now_dt - start_dt).total_seconds()
        return elapsed >= window_duration_sec
    except Exception:
        return True
