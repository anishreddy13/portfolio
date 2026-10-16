"""
strategy_dictionary.py — Standardized Lexicon & Grammar Dictionary

Contains mappings, regex patterns, and normalization aliases for:
  - Technical indicators (RSI, EMA, SMA, VWAP, MACD, Bollinger Bands, ATR, Volume, Price, High, Low, Close, Open)
  - Comparison & Crossover Operators (>, <, >=, <=, crosses_above, crosses_below, equals, between, outside, inside)
  - Timeframes (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1wk, 1mo)
  - Trading Days & Sessions
  - Entry & Exit Keywords
  - Popular Asset Symbols
"""

from __future__ import annotations

from typing import Dict, List, Set

# ─────────────────────────────────────────────
# 1. Indicator Lexicon & Normalization Mappings
# ─────────────────────────────────────────────

INDICATOR_ALIASES: Dict[str, str] = {
    "rsi": "RSI",
    "relative strength index": "RSI",
    "ema": "EMA",
    "exponential moving average": "EMA",
    "sma": "SMA",
    "simple moving average": "SMA",
    "vwap": "VWAP",
    "volume weighted average price": "VWAP",
    "macd": "MACD",
    "moving average convergence divergence": "MACD",
    "bollinger bands": "BOLLINGER_BANDS",
    "bollinger": "BOLLINGER_BANDS",
    "bb": "BOLLINGER_BANDS",
    "atr": "ATR",
    "average true range": "ATR",
    "volume": "VOLUME",
    "vol": "VOLUME",
    "price": "PRICE",
    "close": "CLOSE",
    "closing price": "CLOSE",
    "high": "HIGH",
    "day high": "HIGH",
    "previous high": "PREVIOUS_HIGH",
    "low": "LOW",
    "day low": "LOW",
    "previous low": "PREVIOUS_LOW",
    "open": "OPEN",
    "day open": "OPEN",
    "signal": "MACD_SIGNAL",
    "macd signal": "MACD_SIGNAL",
}

SUPPORTED_INDICATORS: Set[str] = {
    "RSI", "EMA", "SMA", "VWAP", "MACD", "BOLLINGER_BANDS",
    "ATR", "VOLUME", "PRICE", "HIGH", "LOW", "CLOSE", "OPEN",
    "PREVIOUS_HIGH", "PREVIOUS_LOW", "MACD_SIGNAL"
}

# ─────────────────────────────────────────────
# 2. Operator Normalization Mappings
# ─────────────────────────────────────────────

OPERATOR_ALIASES: Dict[str, str] = {
    ">": ">",
    "greater than": ">",
    "above": ">",
    "higher than": ">",
    "rises above": ">",
    "exceeds": ">",
    
    "<": "<",
    "less than": "<",
    "below": "<",
    "lower than": "<",
    "drops below": "<",
    "falls below": "<",
    
    ">=": ">=",
    "greater than or equal to": ">=",
    "at least": ">=",

    "<=": "<=",
    "less than or equal to": "<=",
    "at most": "<=",

    "crosses above": "crosses_above",
    "crosses over": "crosses_above",
    "crosses up": "crosses_above",
    "crosses north": "crosses_above",

    "crosses below": "crosses_below",
    "crosses under": "crosses_below",
    "crosses down": "crosses_below",
    "crosses south": "crosses_below",

    "equals": "equals",
    "equal to": "equals",
    "is equal to": "equals",
    "==": "equals",

    "between": "between",
    "outside": "outside",
    "inside": "inside",
}

SUPPORTED_OPERATORS: Set[str] = {
    ">", "<", ">=", "<=", "crosses_above", "crosses_below", "equals", "between", "outside", "inside"
}

# ─────────────────────────────────────────────
# 3. Timeframe Normalization Mappings
# ─────────────────────────────────────────────

TIMEFRAME_ALIASES: Dict[str, str] = {
    "1m": "1m",
    "1 min": "1m",
    "1 minute": "1m",
    "1minutes": "1m",
    "5m": "5m",
    "5 min": "5m",
    "5 minute": "5m",
    "5 minutes": "5m",
    "15m": "15m",
    "15 min": "15m",
    "15 minute": "15m",
    "15 minutes": "15m",
    "30m": "30m",
    "30 min": "30m",
    "30 minute": "30m",
    "30 minutes": "30m",
    "1h": "1h",
    "1 hour": "1h",
    "hourly": "1h",
    "60m": "1h",
    "4h": "4h",
    "4 hour": "4h",
    "4 hours": "4h",
    "1d": "1d",
    "1 day": "1d",
    "daily": "1d",
    "1wk": "1wk",
    "1 week": "1wk",
    "weekly": "1wk",
    "1mo": "1mo",
    "1 month": "1mo",
    "monthly": "1mo",
}

SUPPORTED_TIMEFRAMES: Set[str] = {
    "1m", "5m", "15m", "30m", "1h", "4h", "1d", "1wk", "1mo"
}

# ─────────────────────────────────────────────
# 4. Trading Days & Sessions
# ─────────────────────────────────────────────

DAY_ALIASES: Dict[str, str] = {
    "monday": "Monday",
    "mon": "Monday",
    "tuesday": "Tuesday",
    "tue": "Tuesday",
    "wednesday": "Wednesday",
    "wed": "Wednesday",
    "thursday": "Thursday",
    "thu": "Thursday",
    "friday": "Friday",
    "fri": "Friday",
    "saturday": "Saturday",
    "sat": "Saturday",
    "sunday": "Sunday",
    "sun": "Sunday",
}

SESSION_ALIASES: Dict[str, str] = {
    "market hours": "market_hours",
    "only during market hours": "market_hours",
    "regular market hours": "market_hours",
    "regular hours": "market_hours",
    "rth": "market_hours",
    "extended hours": "extended_hours",
    "all day": "all_day",
    "24/7": "all_day",
}

# ─────────────────────────────────────────────
# 5. Keywords for Intent & Action Identification
# ─────────────────────────────────────────────

ENTRY_KEYWORDS: List[str] = [
    "buy", "long", "enter", "go long", "buy when", "enter long"
]

EXIT_KEYWORDS: List[str] = [
    "sell", "exit", "close", "take profit", "stop loss", "tp", "sl", "exit after"
]

KNOWN_ASSETS: Set[str] = {
    "AAPL", "RELIANCE", "TSLA", "NVDA", "MSFT", "BTC", "ETH", "AMZN",
    "GOOGL", "META", "SPY", "QQQ", "BTCUSD", "ETHUSD", "SOL", "NIFTY", "BANKNIFTY"
}
