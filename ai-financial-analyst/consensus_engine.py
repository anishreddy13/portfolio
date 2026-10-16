"""
consensus_engine.py — Enterprise Multi-Provider Consensus Engine

Orchestrates multi-provider consensus comparisons using consensus_rules algorithms.
Transforms a list of NormalizedResponse envelopes from multiple providers into a single
canonical ConsensusResult payload tagged with agreement metrics and confidence scores.
"""

from __future__ import annotations

import logging
from typing import Any, List, Optional

from market_entities import HistoricalSeries, MarketNews, MarketStatus, Quote
from normalized_response import NormalizedResponse
from consensus_models import ConsensusResult
from consensus_rules import (
    compare_historical,
    compare_market_status,
    compare_news,
    compare_quotes,
    detect_outliers,
    select_consensus_value,
)

# Late-bound import to avoid circular dependency at module level
_observability_engine = None


def _get_obs_engine():
    global _observability_engine
    if _observability_engine is None:
        try:
            from observability_engine import global_observability_engine
            _observability_engine = global_observability_engine
        except ImportError:
            _observability_engine = None
    return _observability_engine


logger = logging.getLogger("consensus_engine")


class ConsensusEngine:
    """Enterprise multi-provider consensus engine.

    Usage::

        engine = ConsensusEngine()
        result = engine.consensus_quote([polygon_quote_res, alpaca_quote_res, finnhub_quote_res])
        print(result.agreement_status, result.confidence, result.normalized_response.value.price)
    """

    def __init__(self) -> None:
        logger.info("ConsensusEngine initialized.")

    def consensus_quote(
        self, responses: List[NormalizedResponse[Quote]], tolerance_pct: float = 0.15
    ) -> ConsensusResult:
        """Compute consensus quote across multiple provider responses within price tolerance."""
        import time
        start_t = time.monotonic()
        if not responses:
            raise ValueError("ConsensusEngine.consensus_quote requires non-empty response list.")
        res = compare_quotes(responses, tolerance_pct=tolerance_pct)
        lat_ms = (time.monotonic() - start_t) * 1000.0
        obs = _get_obs_engine()
        if obs is not None:
            obs.record("CONSENSUS_ENGINE", "consensus_latency_ms", lat_ms)
        return res

    def consensus_historical(
        self, responses: List[NormalizedResponse[HistoricalSeries]]
    ) -> ConsensusResult:
        """Compute consensus historical series across multiple provider responses."""
        if not responses:
            raise ValueError("ConsensusEngine.consensus_historical requires non-empty response list.")
        return compare_historical(responses)

    def consensus_news(
        self, responses: List[NormalizedResponse[List[MarketNews]]]
    ) -> ConsensusResult:
        """Deduplicate headlines and compute merged consensus news stream."""
        if not responses:
            raise ValueError("ConsensusEngine.consensus_news requires non-empty response list.")
        return compare_news(responses)

    def consensus_market_status(
        self, responses: List[NormalizedResponse[MarketStatus]]
    ) -> ConsensusResult:
        """Compute majority-vote consensus on market clock/session status."""
        if not responses:
            raise ValueError("ConsensusEngine.consensus_market_status requires non-empty response list.")
        return compare_market_status(responses)

    def consensus_generic(self, responses: List[NormalizedResponse[Any]]) -> ConsensusResult:
        """Compute generic multi-provider consensus using outlier detection and confidence scoring."""
        if not responses:
            raise ValueError("ConsensusEngine.consensus_generic requires non-empty response list.")

        normal, outliers = detect_outliers(responses)
        winner, selected_tag = select_consensus_value(responses, outliers)

        agree_count = len(normal)
        total_count = len(responses)
        agree_pct = (agree_count / total_count) * 100.0 if total_count > 0 else 100.0

        return ConsensusResult(
            normalized_response=winner,
            selected_provider=selected_tag,
            agreement_status="AGREED" if agree_pct >= 80.0 else "DISCREPANCY",
            agreement_percentage=agree_pct,
            confidence=winner.confidence,
            outlier_providers=[r.provider for r in outliers],
        )
