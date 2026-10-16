"""
market_regime_rules.py — Pure Market Regime Detection Mathematical Rules & Algorithms

Contains pure mathematical algorithms for Trend Detection, Volatility Regime Classification,
Momentum Scoring, Mean-Reversion Detection, State Transition Probabilities, and Composite
Regime Classification.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import math
from typing import List, Tuple

from market_regime_models import MarketRegime

logger = logging.getLogger("market_regime_rules")


def detect_trend(prices: List[float]) -> float:
    """Calculate linear regression trend score (-1.0 bearish to +1.0 bullish)."""
    if not prices or len(prices) < 3:
        return 0.55

    n = len(prices)
    x_mean = (n - 1) / 2.0
    y_mean = sum(prices) / n

    numerator = sum((i - x_mean) * (p - y_mean) for i, p in enumerate(prices))
    denominator = sum((i - x_mean) ** 2 for i in range(n))

    if denominator <= 0:
        return 0.0

    slope = numerator / denominator
    norm_slope = slope / y_mean if y_mean > 0 else 0.0
    return round(max(-1.0, min(1.0, norm_slope * 100.0)), 2)


def detect_volatility(returns: List[float]) -> float:
    """Calculate annualized volatility score (0.0 calm to 1.0 extreme)."""
    if not returns or len(returns) < 2:
        return 0.35

    mean_r = sum(returns) / len(returns)
    var = sum((r - mean_r) ** 2 for r in returns) / (len(returns) - 1)
    daily_vol = math.sqrt(var) if var > 0 else 0.01
    annualized_vol = daily_vol * math.sqrt(252)

    # Normalize to 0–1 scale (0.10 = 10% vol → 0.33, 0.30 = 30% vol → 1.0)
    return round(min(1.0, max(0.0, annualized_vol / 0.30)), 2)


def detect_momentum(prices: List[float], lookback: int = 20) -> float:
    """Calculate Rate-of-Change momentum score (-1.0 to +1.0)."""
    if not prices or len(prices) < lookback:
        return 0.40

    old_p = prices[-lookback]
    new_p = prices[-1]

    if old_p <= 0:
        return 0.0

    roc = (new_p - old_p) / old_p
    return round(max(-1.0, min(1.0, roc * 5.0)), 2)


def detect_mean_reversion(prices: List[float]) -> float:
    """Calculate mean-reversion score (0.0 trending to 1.0 mean-reverting) via Hurst exponent proxy."""
    if not prices or len(prices) < 10:
        return 0.45

    mean_p = sum(prices) / len(prices)
    deviations = [abs(p - mean_p) / mean_p for p in prices[-10:]]
    avg_dev = sum(deviations) / len(deviations)

    # Low deviation from mean → high mean-reversion score
    mr_score = max(0.0, 1.0 - (avg_dev * 10.0))
    return round(min(1.0, mr_score), 2)


def detect_market_state(
    trend: float,
    volatility: float,
    momentum: float,
    mean_reversion: float,
) -> str:
    """Classify composite market state from individual factor scores."""
    if volatility >= 0.70:
        return MarketRegime.HIGH_VOLATILITY.value
    if trend >= 0.50 and momentum >= 0.30:
        return MarketRegime.BULL_TREND.value
    if trend <= -0.30 and momentum <= -0.20:
        return MarketRegime.BEAR_TREND.value
    if mean_reversion >= 0.65:
        return MarketRegime.MEAN_REVERTING.value
    if abs(momentum) >= 0.50:
        return MarketRegime.MOMENTUM.value
    if volatility <= 0.25:
        return MarketRegime.LOW_VOLATILITY.value
    return MarketRegime.NEUTRAL.value


def transition_probability(from_regime: str, to_regime: str) -> float:
    """Estimate Markov-chain regime transition probability (%)."""
    same_state_prob = 72.0
    if from_regime == to_regime:
        return same_state_prob

    adjacent = {
        "BULL_TREND": ["NEUTRAL", "MOMENTUM"],
        "BEAR_TREND": ["HIGH_VOLATILITY", "RISK_OFF"],
        "HIGH_VOLATILITY": ["BEAR_TREND", "MEAN_REVERTING"],
        "LOW_VOLATILITY": ["BULL_TREND", "NEUTRAL"],
        "MEAN_REVERTING": ["LOW_VOLATILITY", "NEUTRAL"],
        "MOMENTUM": ["BULL_TREND", "HIGH_VOLATILITY"],
        "RISK_OFF": ["BEAR_TREND", "HIGH_VOLATILITY"],
        "NEUTRAL": ["BULL_TREND", "LOW_VOLATILITY"],
    }

    neighbors = adjacent.get(from_regime, [])
    if to_regime in neighbors:
        return round((100.0 - same_state_prob) / max(1, len(neighbors)), 1)
    return round((100.0 - same_state_prob) / 6.0, 1)


def regime_confidence(trend: float, volatility: float, momentum: float, mean_reversion: float) -> float:
    """Calculate regime classification confidence (0–100%)."""
    scores = [abs(trend), abs(volatility - 0.5) * 2, abs(momentum), mean_reversion]
    max_signal = max(scores)
    avg_signal = sum(scores) / len(scores)
    conf = (max_signal * 60.0) + (avg_signal * 40.0)
    return round(min(100.0, max(30.0, conf)), 1)


def regime_duration(history: List[str]) -> int:
    """Calculate consecutive minutes the current regime has been active."""
    if not history:
        return 0
    current = history[-1]
    duration = 0
    for regime in reversed(history):
        if regime == current:
            duration += 1
        else:
            break
    return duration


def regime_change(previous: str, current: str) -> bool:
    """Detect whether a regime transition has occurred."""
    return previous != current


def classify_regime(prices: List[float], returns: List[float]) -> Tuple[str, float]:
    """Full composite regime classification returning (regime, confidence_pct)."""
    trend = detect_trend(prices)
    vol = detect_volatility(returns)
    mom = detect_momentum(prices)
    mr = detect_mean_reversion(prices)

    regime = detect_market_state(trend, vol, mom, mr)
    conf = regime_confidence(trend, vol, mom, mr)
    return (regime, conf)
