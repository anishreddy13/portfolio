"""
signal_rules.py — Pure Signal Engine Mathematical Rules & Ranking Algorithms

Contains pure mathematical algorithms for validating, scoring, combining, ranking,
and resolving conflicts among quantitative strategy signals.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
from typing import List, Optional, Tuple

from signal_models import SignalDecision, SignalDirection, SignalStrength, TradingSignal

logger = logging.getLogger("signal_rules")


def validate_signal(signal: TradingSignal) -> Tuple[bool, str]:
    """Validate incoming TradingSignal envelope parameters."""
    if not signal or not signal.symbol or signal.suggested_price <= 0:
        return (False, "Invalid symbol or suggested price.")

    if signal.direction not in ("BUY", "SELL", "HOLD", "FLAT"):
        return (False, f"Unsupported signal direction: {signal.direction}")

    return (True, "TradingSignal valid.")


def score_signal(signal: TradingSignal) -> float:
    """Calculate composite quality score (0.0 to 100.0) for a TradingSignal."""
    if not signal:
        return 0.0

    str_val = signal.strength.value if signal.strength else 0.5
    conf_val = signal.strength.confidence if signal.strength else 0.5

    # Reward reward-to-risk ratio
    risk_dist = abs(signal.suggested_price - signal.stop_loss)
    reward_dist = abs(signal.take_profit - signal.suggested_price)
    rr_ratio = (reward_dist / risk_dist) if risk_dist > 0 else 1.5

    composite_score = (str_val * 40.0) + (conf_val * 40.0) + (min(3.0, rr_ratio) * 6.66)
    return round(min(100.0, max(0.0, composite_score)), 1)


def combine_signals(signals: List[TradingSignal]) -> TradingSignal:
    """Combine multiple concordant signals into a single unified TradingSignal."""
    if not signals:
        raise ValueError("Cannot combine empty signal list.")

    first = signals[0]
    avg_price = sum(s.suggested_price for s in signals) / len(signals)
    avg_sl = sum(s.stop_loss for s in signals) / len(signals)
    avg_tp = sum(s.take_profit for s in signals) / len(signals)

    avg_str = sum(s.strength.value for s in signals if s.strength) / len(signals)
    avg_conf = sum(s.strength.confidence for s in signals if s.strength) / len(signals)

    return TradingSignal(
        signal_id=f"sig-combined-{first.signal_id[:6]}",
        symbol=first.symbol,
        direction=first.direction,
        source="COMPOSITE",
        strength=SignalStrength(value=avg_str, confidence=avg_conf, level="STRONG_CONVICTION"),
        suggested_price=avg_price,
        stop_loss=avg_sl,
        take_profit=avg_tp,
        time_to_live_sec=first.time_to_live_sec,
        timestamp=first.timestamp,
    )


def resolve_conflicts(signals: List[TradingSignal]) -> SignalDecision:
    """Resolve conflicting BUY/SELL signals for a symbol and select winning signal."""
    if not signals:
        return SignalDecision(is_approved=False, rejection_reason="No signals provided.")

    buys = [s for s in signals if s.direction == "BUY"]
    sells = [s for s in signals if s.direction == "SELL"]

    # If no conflicts, pick highest scoring
    if not buys or not sells:
        best_sig = best_signal(signals)
        return SignalDecision(is_approved=True, winning_signal=best_sig, conflict_resolved=False)

    # Conflict exists: compare aggregate scores
    buy_score = sum(score_signal(s) for s in buys)
    sell_score = sum(score_signal(s) for s in sells)

    if buy_score >= sell_score:
        winning = best_signal(buys)
        return SignalDecision(is_approved=True, winning_signal=winning, conflict_resolved=True)
    else:
        winning = best_signal(sells)
        return SignalDecision(is_approved=True, winning_signal=winning, conflict_resolved=True)


def expire_signal(signal: TradingSignal, now_ts: float) -> bool:
    """Check if TradingSignal TTL has expired."""
    if not signal:
        return True
    return signal.is_expired


def signal_strength(strength_val: float) -> str:
    """Return human-readable strength rating category string."""
    if strength_val >= 0.8:
        return "STRONG_CONVICTION"
    elif strength_val >= 0.6:
        return "MODERATE"
    return "WEAK"


def signal_confidence(signals: List[TradingSignal]) -> float:
    """Calculate aggregate confidence rating percentage (0.0 to 100.0%)."""
    if not signals:
        return 0.0
    confs = [s.strength.confidence for s in signals if s.strength]
    return round((sum(confs) / len(confs)) * 100.0, 1) if confs else 85.0


def rank_signals(signals: List[TradingSignal]) -> List[TradingSignal]:
    """Rank list of TradingSignals in descending order of score_signal()."""
    return sorted(signals, key=lambda s: score_signal(s), reverse=True)


def best_signal(signals: List[TradingSignal]) -> Optional[TradingSignal]:
    """Return highest scoring TradingSignal from a list."""
    ranked = rank_signals(signals)
    return ranked[0] if ranked else None
