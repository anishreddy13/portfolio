"""
market_models.py — Typed Data Models for the Market Data Service

Provides standardized, provider-agnostic data structures used by
MarketDataProvider implementations and consumed by the Trading
Co-Pilot pipeline.

All models are plain dataclasses (stdlib) — no external dependencies.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


# ─────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────

class Interval(str, Enum):
    """Supported candlestick intervals."""
    M1  = "1m"
    M5  = "5m"
    M15 = "15m"
    M30 = "30m"
    H1  = "1h"
    D1  = "1d"
    W1  = "1wk"
    MO1 = "1mo"


class Period(str, Enum):
    """Supported lookback periods."""
    D1  = "1d"
    D5  = "5d"
    MO1 = "1mo"
    MO3 = "3mo"
    MO6 = "6mo"
    Y1  = "1y"
    Y2  = "2y"
    Y5  = "5y"
    MAX = "max"


# ─────────────────────────────────────────────
# Error
# ─────────────────────────────────────────────

class MarketDataError(Exception):
    """Unified error raised by MarketDataProvider and MarketDataService.

    Never exposes raw provider exceptions to callers.

    Attributes:
        message: Human-readable description of the failure.
        provider: Name of the provider that raised the error.
        symbol: The symbol involved, if applicable.
        original: The original underlying exception, if any.
    """

    def __init__(
        self,
        message: str,
        *,
        provider: str = "unknown",
        symbol: str = "",
        original: Optional[Exception] = None,
    ) -> None:
        self.provider = provider
        self.symbol = symbol
        self.original = original
        super().__init__(message)


# ─────────────────────────────────────────────
# Quote
# ─────────────────────────────────────────────

@dataclass(frozen=True)
class Quote:
    """A point-in-time price quote for a single symbol.

    Attributes:
        symbol: Ticker symbol (e.g. ``AAPL``).
        exchange: Exchange name (e.g. ``NMS``).
        current_price: Latest traded price.
        change: Absolute price change from previous close.
        change_percent: Percentage change from previous close.
        currency: ISO currency code (e.g. ``USD``).
        market_state: Provider market state string (e.g. ``REGULAR``, ``PRE``, ``POST``, ``CLOSED``).
        previous_close: Previous session closing price.
        open: Current session opening price.
        day_high: Current session high.
        day_low: Current session low.
        volume: Current session volume.
        market_cap: Market capitalization.
        timestamp: ISO-8601 timestamp of the quote.
    """
    symbol: str
    exchange: str = ""
    current_price: float = 0.0
    change: float = 0.0
    change_percent: float = 0.0
    currency: str = "USD"
    market_state: str = ""
    previous_close: float = 0.0
    open: float = 0.0
    day_high: float = 0.0
    day_low: float = 0.0
    volume: int = 0
    market_cap: float = 0.0
    timestamp: str = ""


# ─────────────────────────────────────────────
# OHLC Candle
# ─────────────────────────────────────────────

@dataclass(frozen=True)
class OHLCCandle:
    """A single OHLCV candlestick bar.

    Attributes:
        date: ISO-8601 date or datetime string.
        open: Opening price.
        high: Highest price.
        low: Lowest price.
        close: Closing price.
        volume: Number of shares/contracts traded.
    """
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int = 0


# ─────────────────────────────────────────────
# Historical Series
# ─────────────────────────────────────────────

@dataclass(frozen=True)
class HistoricalSeries:
    """A time-series of OHLCV candles for a symbol.

    Attributes:
        symbol: The ticker symbol.
        interval: The candlestick interval used.
        period: The lookback period used.
        candles: Ordered list of ``OHLCCandle`` objects (oldest first).
    """
    symbol: str
    interval: str
    period: str
    candles: List[OHLCCandle] = field(default_factory=list)


# ─────────────────────────────────────────────
# Market Status
# ─────────────────────────────────────────────

@dataclass(frozen=True)
class MarketStatus:
    """Current operational status of a market exchange.

    Attributes:
        exchange: Exchange identifier (e.g. ``NYSE``, ``NASDAQ``).
        is_open: Whether the exchange is currently open for trading.
        timezone: Exchange timezone string (e.g. ``America/New_York``).
        current_time: Current time in the exchange timezone (ISO-8601).
        next_open: Next scheduled opening time (ISO-8601), if known.
        next_close: Next scheduled closing time (ISO-8601), if known.
    """
    exchange: str
    is_open: bool = False
    timezone: str = ""
    current_time: str = ""
    next_open: str = ""
    next_close: str = ""


# ─────────────────────────────────────────────
# Company Profile
# ─────────────────────────────────────────────

@dataclass(frozen=True)
class CompanyProfile:
    """Basic fundamental profile of a publicly traded company.

    Attributes:
        symbol: Ticker symbol.
        company_name: Official company name.
        sector: GICS sector.
        industry: GICS sub-industry.
        country: Country of incorporation.
        website: Company website URL.
        description: Business summary / long description.
        employees: Full-time employee count.
    """
    symbol: str
    company_name: str = ""
    sector: str = ""
    industry: str = ""
    country: str = ""
    website: str = ""
    description: str = ""
    employees: int = 0


# ─────────────────────────────────────────────
# Search Result
# ─────────────────────────────────────────────

@dataclass(frozen=True)
class SearchResult:
    """A single symbol search match.

    Attributes:
        symbol: Ticker symbol.
        name: Company short name.
        exchange: Exchange the symbol trades on.
    """
    symbol: str
    name: str = ""
    exchange: str = ""
