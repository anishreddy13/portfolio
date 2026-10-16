"""
market_context_models.py — Data Models for Market Context Engine

Defines data structures returned by the MarketContextEngine describing market
regime, trend, volatility, momentum, volume profile, technical levels, and health score.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional


class MarketContextError(Exception):
    """Custom exception raised when market context analysis fails."""
    def __init__(self, message: str, symbol: str = "") -> None:
        self.symbol = symbol
        super().__init__(message)


@dataclass
class MarketContext:
    """Standardized representation of complete market state and regime.

    Attributes:
        symbol: Ticker symbol (e.g. 'AAPL').
        timeframe: Bar timeframe of analyzed data (e.g. '1d').
        trend: Overall trend direction ('Bullish', 'Bearish', 'Sideways').
        volatility: Volatility level ('Low', 'Medium', 'High', 'Extreme').
        momentum: Price momentum status ('Strong Bullish', 'Bullish', 'Neutral', 'Bearish', 'Strong Bearish').
        volume_profile: Volume activity level ('Below Average', 'Average', 'Above Average', 'Unusual').
        trend_strength: Trend conviction strength ('Weak', 'Moderate', 'Strong').
        regime: Current market regime ('Trending', 'Ranging', 'Breakout', 'Reversal', 'Pullback', 'Recovery').
        support_level: Calculated dynamic support price level.
        resistance_level: Calculated dynamic resistance price level.
        recent_swing_high: Price of the most recent swing high.
        recent_swing_low: Price of the most recent swing low.
        average_daily_range: Average Daily Range (ADR) value.
        gap_detected: True if opening gap detected vs previous close.
        gap_percent: Percentage size of the gap.
        market_health_score: Quality and stability score from 0 to 100.
        key_indicators_snapshot: Key indicator values used for analysis.
        timestamp: ISO timestamp of analysis.
    """
    symbol: str
    timeframe: str = "1d"
    trend: str = "Sideways"
    volatility: str = "Medium"
    momentum: str = "Neutral"
    volume_profile: str = "Average"
    trend_strength: str = "Moderate"
    regime: str = "Ranging"
    support_level: Optional[float] = None
    resistance_level: Optional[float] = None
    recent_swing_high: Optional[float] = None
    recent_swing_low: Optional[float] = None
    average_daily_range: Optional[float] = None
    gap_detected: bool = False
    gap_percent: float = 0.0
    market_health_score: int = 50
    key_indicators_snapshot: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert MarketContext to clean dictionary."""
        return {
            "symbol": self.symbol,
            "timeframe": self.timeframe,
            "trend": self.trend,
            "volatility": self.volatility,
            "momentum": self.momentum,
            "volume_profile": self.volume_profile,
            "trend_strength": self.trend_strength,
            "regime": self.regime,
            "support_level": self.support_level,
            "resistance_level": self.resistance_level,
            "recent_swing_high": self.recent_swing_high,
            "recent_swing_low": self.recent_swing_low,
            "average_daily_range": self.average_daily_range,
            "gap_detected": self.gap_detected,
            "gap_percent": round(self.gap_percent, 2),
            "market_health_score": self.market_health_score,
            "key_indicators_snapshot": self.key_indicators_snapshot,
            "timestamp": self.timestamp,
        }
