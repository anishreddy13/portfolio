"""
market_context_rules.py — Market Condition Rule Set

Contains modular rules to analyze market state properties, regimes, support/resistance,
gaps, and health scores using raw price data and indicator values.
"""

from __future__ import annotations

import logging
from typing import Any, List, Optional, Tuple

logger = logging.getLogger("market_context_rules")


# ─────────────────────────────────────────────
# 1. Trend & Strength Detection
# ─────────────────────────────────────────────

def detect_trend(
    close: float,
    ema20: Optional[float],
    ema50: Optional[float],
    sma200: Optional[float] = None,
) -> Tuple[str, str]:
    """Determine trend direction ('Bullish', 'Bearish', 'Sideways') and strength ('Weak', 'Moderate', 'Strong')."""
    if ema20 is None or ema50 is None:
        return "Sideways", "Moderate"

    # Bullish condition: price > EMA20 > EMA50
    if close > ema20 > ema50:
        if sma200 and close > sma200:
            return "Bullish", "Strong"
        return "Bullish", "Moderate"

    # Weak Bullish condition: price > EMA20 but EMA20 <= EMA50
    if close > ema20 and ema20 <= ema50:
        return "Bullish", "Weak"

    # Bearish condition: price < EMA20 < EMA50
    if close < ema20 < ema50:
        if sma200 and close < sma200:
            return "Bearish", "Strong"
        return "Bearish", "Moderate"

    # Weak Bearish condition: price < EMA20 but EMA20 >= EMA50
    if close < ema20 and ema20 >= ema50:
        return "Bearish", "Weak"

    return "Sideways", "Weak"


# ─────────────────────────────────────────────
# 2. Volatility Detection
# ─────────────────────────────────────────────

def detect_volatility(
    atr: Optional[float],
    current_price: float,
    recent_atr_values: Optional[List[Optional[float]]] = None,
) -> str:
    """Determine volatility level ('Low', 'Medium', 'High', 'Extreme')."""
    if atr is None or current_price <= 0:
        return "Medium"

    atr_pct = (atr / current_price) * 100.0

    if atr_pct < 0.8:
        return "Low"
    elif atr_pct < 2.0:
        return "Medium"
    elif atr_pct < 4.0:
        return "High"
    else:
        return "Extreme"


# ─────────────────────────────────────────────
# 3. Momentum Detection
# ─────────────────────────────────────────────

def detect_momentum(
    rsi: Optional[float],
    macd_hist: Optional[float],
    price_change_pct: Optional[float] = None,
) -> str:
    """Determine momentum status ('Strong Bullish', 'Bullish', 'Neutral', 'Bearish', 'Strong Bearish')."""
    if rsi is None:
        return "Neutral"

    hist = macd_hist or 0.0

    if rsi >= 70 and hist > 0:
        return "Strong Bullish"
    elif rsi >= 55 and hist >= 0:
        return "Bullish"
    elif rsi <= 30 and hist < 0:
        return "Strong Bearish"
    elif rsi <= 45 and hist <= 0:
        return "Bearish"
    else:
        return "Neutral"


# ─────────────────────────────────────────────
# 4. Volume Profile Detection
# ─────────────────────────────────────────────

def detect_volume_profile(
    latest_volume: float,
    volume_sma: Optional[float],
) -> str:
    """Determine volume activity level ('Below Average', 'Average', 'Above Average', 'Unusual')."""
    if volume_sma is None or volume_sma <= 0 or latest_volume <= 0:
        return "Average"

    ratio = latest_volume / volume_sma

    if ratio < 0.7:
        return "Below Average"
    elif ratio <= 1.3:
        return "Average"
    elif ratio <= 2.2:
        return "Above Average"
    else:
        return "Unusual"


# ─────────────────────────────────────────────
# 5. Market Regime Detection
# ─────────────────────────────────────────────

def detect_regime(
    trend: str,
    momentum: str,
    volatility: str,
    current_price: float,
    swing_high: Optional[float],
    swing_low: Optional[float],
    gap_detected: bool,
) -> str:
    """Determine market regime ('Trending', 'Ranging', 'Breakout', 'Reversal', 'Pullback', 'Recovery')."""
    # Breakout condition
    if swing_high and current_price > swing_high:
        return "Breakout"

    # Reversal condition
    if trend == "Bearish" and "Bullish" in momentum and volatility in ("High", "Extreme"):
        return "Reversal"
    if trend == "Bullish" and "Bearish" in momentum and volatility in ("High", "Extreme"):
        return "Reversal"

    # Pullback condition
    if trend == "Bullish" and momentum == "Bearish":
        return "Pullback"
    if trend == "Bearish" and momentum == "Bullish":
        return "Recovery"

    # Trending condition
    if trend in ("Bullish", "Bearish") and momentum != "Neutral":
        return "Trending"

    return "Ranging"


# ─────────────────────────────────────────────
# 6. Support, Resistance & Swing Levels
# ─────────────────────────────────────────────

def calculate_levels(candles: List[Any], window: int = 20) -> Tuple[Optional[float], Optional[float], Optional[float], Optional[float]]:
    """Calculate support, resistance, swing high, and swing low from candles."""
    if not candles or len(candles) < 3:
        return None, None, None, None

    sample = candles[-window:] if len(candles) >= window else candles
    highs = [float(c.high) for c in sample]
    lows = [float(c.low) for c in sample]

    swing_high = round(max(highs), 4)
    swing_low = round(min(lows), 4)

    # Dynamic Support/Resistance using local clusters
    resistance = swing_high
    support = swing_low

    return support, resistance, swing_high, swing_low


# ─────────────────────────────────────────────
# 7. ADR & Gap Detection
# ─────────────────────────────────────────────

def calculate_adr(candles: List[Any], period: int = 14) -> Optional[float]:
    """Calculate Average Daily Range (ADR)."""
    if not candles or len(candles) < period:
        return None

    sample = candles[-period:]
    ranges = [float(c.high) - float(c.low) for c in sample]
    return round(sum(ranges) / len(ranges), 4)


def detect_gap(open_price: float, prev_close: float, threshold_pct: float = 0.5) -> Tuple[bool, float]:
    """Detect price gap at market open versus previous close."""
    if prev_close <= 0 or open_price <= 0:
        return False, 0.0

    gap_pct = ((open_price - prev_close) / prev_close) * 100.0
    gap_detected = abs(gap_pct) >= threshold_pct
    return gap_detected, round(gap_pct, 2)


# ─────────────────────────────────────────────
# 8. Market Health Score (0-100)
# ─────────────────────────────────────────────

def calculate_market_health(
    trend: str,
    trend_strength: str,
    volatility: str,
    momentum: str,
    volume_profile: str,
    rsi: Optional[float],
    macd_hist: Optional[float],
) -> int:
    """Compute an aggregate Market Health Score from 0 to 100.

    Evaluates:
      - Trend conviction (+30)
      - Momentum alignment (+25)
      - Volatility stability (+20)
      - Liquidity/Volume (+15)
      - Indicator agreement (+10)
    """
    score = 50  # Base neutral

    # Trend component
    if trend == "Bullish":
        score += 15 if trend_strength == "Strong" else (10 if trend_strength == "Moderate" else 5)
    elif trend == "Bearish":
        score -= 15 if trend_strength == "Strong" else (10 if trend_strength == "Moderate" else 5)

    # Momentum component
    if "Bullish" in momentum:
        score += 10 if "Strong" in momentum else 5
    elif "Bearish" in momentum:
        score -= 10 if "Strong" in momentum else 5

    # Volatility component
    if volatility == "Low":
        score += 10
    elif volatility == "Medium":
        score += 5
    elif volatility == "Extreme":
        score -= 15

    # Volume Component
    if volume_profile in ("Above Average", "Unusual"):
        score += 10
    elif volume_profile == "Below Average":
        score -= 5

    # Indicator Agreement
    if rsi is not None and macd_hist is not None:
        if (rsi > 50 and macd_hist > 0) or (rsi < 50 and macd_hist < 0):
            score += 10

    return max(0, min(100, score))
