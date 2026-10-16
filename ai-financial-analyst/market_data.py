"""
market_data.py — Market Data Service for the Trading Strategy Co-Pilot

Provider-based architecture:

    MarketDataProvider (ABC)
        └── YFinanceProvider       (concrete, uses yfinance + yahooquery)
        └── (future providers)     AlpacaProvider, PolygonProvider, etc.

    MarketDataService
        ├── wraps a single MarketDataProvider
        ├── adds transparent caching via MarketCache
        └── exposes the public API consumed by the pipeline

This module does NOT connect to LangGraph, Gradio, or any endpoint.
It is pure infrastructure.
"""

from __future__ import annotations

import abc
import logging
from datetime import datetime, timezone
from typing import List, Optional

import yfinance as yf

try:
    from yahooquery import search as yq_search
except ImportError:
    yq_search = None  # type: ignore[assignment]

from market_models import (
    CompanyProfile,
    HistoricalSeries,
    Interval,
    MarketDataError,
    MarketStatus,
    OHLCCandle,
    Period,
    Quote,
    SearchResult,
)
from market_cache import MarketCache

logger = logging.getLogger("market_data")


# ═════════════════════════════════════════════
# 1. Abstract Provider
# ═════════════════════════════════════════════

class MarketDataProvider(abc.ABC):
    """Abstract interface that every market data provider must implement.

    To add a new provider (e.g. Alpaca, Polygon, Twelve Data):
        1. Create a new file ``my_provider.py``
        2. Subclass ``MarketDataProvider``
        3. Implement all five abstract methods
        4. Pass an instance to ``MarketDataService(provider=MyProvider())``
    """

    @property
    @abc.abstractmethod
    def name(self) -> str:
        """Human-readable provider name (used in error messages / logging)."""

    @abc.abstractmethod
    def search_symbol(self, query: str) -> List[SearchResult]:
        """Search for symbols matching a query string."""

    @abc.abstractmethod
    def get_quote(self, symbol: str) -> Quote:
        """Fetch a point-in-time quote for a single symbol."""

    @abc.abstractmethod
    def get_history(
        self,
        symbol: str,
        interval: Interval,
        period: Period,
    ) -> HistoricalSeries:
        """Fetch OHLCV history for a symbol."""

    @abc.abstractmethod
    def get_market_status(self, exchange: str) -> MarketStatus:
        """Fetch the current trading status of an exchange."""

    @abc.abstractmethod
    def get_company_profile(self, symbol: str) -> CompanyProfile:
        """Fetch the fundamental profile for a symbol."""


# ═════════════════════════════════════════════
# 2. YFinance Provider (concrete)
# ═════════════════════════════════════════════

class YFinanceProvider(MarketDataProvider):
    """Concrete provider backed by ``yfinance`` and ``yahooquery``."""

    @property
    def name(self) -> str:
        return "yfinance"

    # ── search ──────────────────────────────────

    def search_symbol(self, query: str) -> List[SearchResult]:
        """Search using yahooquery (already a project dependency)."""
        if yq_search is None:
            logger.warning("yahooquery not available; symbol search disabled")
            return []

        try:
            raw = yq_search(query)
            quotes = raw.get("quotes", []) if isinstance(raw, dict) else []
            results: List[SearchResult] = []
            for item in quotes:
                symbol = item.get("symbol", "")
                if not symbol:
                    continue
                results.append(SearchResult(
                    symbol=symbol,
                    name=item.get("shortname") or item.get("longname", ""),
                    exchange=item.get("exchange", ""),
                ))
            return results
        except Exception as exc:
            raise MarketDataError(
                f"Symbol search failed for query '{query}'",
                provider=self.name,
                symbol=query,
                original=exc,
            ) from exc

    # ── quote ───────────────────────────────────

    def get_quote(self, symbol: str) -> Quote:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info or {}
        except Exception as exc:
            raise MarketDataError(
                f"Failed to fetch quote for '{symbol}'",
                provider=self.name,
                symbol=symbol,
                original=exc,
            ) from exc

        if not info or info.get("trailingPegRatio") is None and info.get("currentPrice") is None:
            # yfinance returns an almost-empty dict for invalid symbols
            if not info.get("regularMarketPrice") and not info.get("currentPrice"):
                raise MarketDataError(
                    f"No quote data found for '{symbol}'",
                    provider=self.name,
                    symbol=symbol,
                )

        current_price = (
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or 0.0
        )
        previous_close = info.get("previousClose") or info.get("regularMarketPreviousClose") or 0.0
        change = round(current_price - previous_close, 4) if current_price and previous_close else 0.0
        change_pct = round((change / previous_close) * 100, 4) if previous_close else 0.0

        return Quote(
            symbol=symbol.upper(),
            exchange=info.get("exchange", ""),
            current_price=current_price,
            change=change,
            change_percent=change_pct,
            currency=info.get("currency", "USD"),
            market_state=info.get("marketState", ""),
            previous_close=previous_close,
            open=info.get("open") or info.get("regularMarketOpen") or 0.0,
            day_high=info.get("dayHigh") or info.get("regularMarketDayHigh") or 0.0,
            day_low=info.get("dayLow") or info.get("regularMarketDayLow") or 0.0,
            volume=int(info.get("volume") or info.get("regularMarketVolume") or 0),
            market_cap=float(info.get("marketCap") or 0),
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    # ── history ─────────────────────────────────

    def get_history(
        self,
        symbol: str,
        interval: Interval,
        period: Period,
    ) -> HistoricalSeries:
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period.value, interval=interval.value)
        except Exception as exc:
            raise MarketDataError(
                f"Failed to fetch history for '{symbol}' "
                f"(interval={interval.value}, period={period.value})",
                provider=self.name,
                symbol=symbol,
                original=exc,
            ) from exc

        if df is None or df.empty:
            raise MarketDataError(
                f"No historical data for '{symbol}' "
                f"(interval={interval.value}, period={period.value})",
                provider=self.name,
                symbol=symbol,
            )

        candles: List[OHLCCandle] = []
        for idx, row in df.iterrows():
            candles.append(OHLCCandle(
                date=idx.isoformat() if hasattr(idx, "isoformat") else str(idx),
                open=round(float(row.get("Open", 0)), 4),
                high=round(float(row.get("High", 0)), 4),
                low=round(float(row.get("Low", 0)), 4),
                close=round(float(row.get("Close", 0)), 4),
                volume=int(row.get("Volume", 0)),
            ))

        return HistoricalSeries(
            symbol=symbol.upper(),
            interval=interval.value,
            period=period.value,
            candles=candles,
        )

    # ── market status ───────────────────────────

    def get_market_status(self, exchange: str) -> MarketStatus:
        try:
            # Use a well-known symbol per exchange to infer status
            probe_map = {
                "NYSE": "IBM",
                "NASDAQ": "AAPL",
                "NSE": "RELIANCE.NS",
                "LSE": "HSBA.L",
                "TSE": "7203.T",
            }
            probe_symbol = probe_map.get(exchange.upper(), "AAPL")
            ticker = yf.Ticker(probe_symbol)
            info = ticker.info or {}
        except Exception as exc:
            raise MarketDataError(
                f"Failed to fetch market status for '{exchange}'",
                provider=self.name,
                symbol=exchange,
                original=exc,
            ) from exc

        market_state = info.get("marketState", "CLOSED")
        is_open = market_state in ("REGULAR", "PRE", "PREPRE")
        tz = info.get("exchangeTimezoneShortName") or info.get("exchangeTimezoneName", "")

        return MarketStatus(
            exchange=exchange.upper(),
            is_open=is_open,
            timezone=tz,
            current_time=datetime.now(timezone.utc).isoformat(),
            next_open="",   # yfinance does not expose scheduling data
            next_close="",  # placeholder for future provider enrichment
        )

    # ── company profile ─────────────────────────

    def get_company_profile(self, symbol: str) -> CompanyProfile:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info or {}
        except Exception as exc:
            raise MarketDataError(
                f"Failed to fetch company profile for '{symbol}'",
                provider=self.name,
                symbol=symbol,
                original=exc,
            ) from exc

        return CompanyProfile(
            symbol=symbol.upper(),
            company_name=info.get("longName") or info.get("shortName", ""),
            sector=info.get("sector", ""),
            industry=info.get("industry", ""),
            country=info.get("country", ""),
            website=info.get("website", ""),
            description=info.get("longBusinessSummary", ""),
            employees=int(info.get("fullTimeEmployees") or 0),
        )


# ═════════════════════════════════════════════
# 3. Market Data Service (public API)
# ═════════════════════════════════════════════

class MarketDataService:
    """High-level, cached Market Data API for the Trading Co-Pilot.

    Wraps any ``MarketDataProvider`` with transparent caching.
    Defaults to ``YFinanceProvider`` if no provider is specified.

    Usage::

        service = MarketDataService()
        quote = service.get_quote("AAPL")
        print(quote.current_price)

    To swap providers::

        from my_custom_provider import PolygonProvider
        service = MarketDataService(provider=PolygonProvider(api_key="..."))
    """

    def __init__(
        self,
        provider: Optional[MarketDataProvider] = None,
        cache: Optional[MarketCache] = None,
    ) -> None:
        self._provider = provider or YFinanceProvider()
        self._cache = cache or MarketCache()
        logger.info(
            "MarketDataService initialized (provider=%s)",
            self._provider.name,
        )

    @property
    def provider_name(self) -> str:
        """Name of the active data provider."""
        return self._provider.name

    # ── search ──────────────────────────────────

    def search_symbol(self, query: str) -> List[SearchResult]:
        """Search for symbols matching a query string.

        Args:
            query: Free-text search (e.g. ``"Apple"`` or ``"AAPL"``).

        Returns:
            List of ``SearchResult`` objects.

        Raises:
            MarketDataError: On provider failure.
        """
        if not query or not query.strip():
            return []
        return self._provider.search_symbol(query.strip())

    # ── quote ───────────────────────────────────

    def get_quote(self, symbol: str) -> Quote:
        """Fetch a live quote for a symbol (cached).

        Args:
            symbol: Ticker symbol (e.g. ``"AAPL"``).

        Returns:
            A ``Quote`` object.

        Raises:
            MarketDataError: On provider failure or invalid symbol.
        """
        symbol = symbol.strip().upper()
        cached = self._cache.get("quotes", symbol)
        if cached is not None:
            return cached

        quote = self._provider.get_quote(symbol)
        self._cache.set("quotes", symbol, quote)
        return quote

    # ── history ─────────────────────────────────

    def get_history(
        self,
        symbol: str,
        interval: Interval = Interval.D1,
        period: Period = Period.MO6,
    ) -> HistoricalSeries:
        """Fetch OHLCV history for a symbol (cached).

        Args:
            symbol: Ticker symbol.
            interval: Candlestick interval (default ``1d``).
            period: Lookback period (default ``6mo``).

        Returns:
            A ``HistoricalSeries`` containing a list of ``OHLCCandle`` objects.

        Raises:
            MarketDataError: On provider failure.
        """
        symbol = symbol.strip().upper()
        cache_key = f"{symbol}:{interval.value}:{period.value}"
        cached = self._cache.get("history", cache_key)
        if cached is not None:
            return cached

        series = self._provider.get_history(symbol, interval, period)
        self._cache.set("history", cache_key, series)
        return series

    # ── market status ───────────────────────────

    def get_market_status(self, exchange: str = "NYSE") -> MarketStatus:
        """Fetch the current trading status of an exchange (cached).

        Args:
            exchange: Exchange identifier (default ``"NYSE"``).

        Returns:
            A ``MarketStatus`` object.

        Raises:
            MarketDataError: On provider failure.
        """
        exchange = exchange.strip().upper()
        cached = self._cache.get("market_status", exchange)
        if cached is not None:
            return cached

        status = self._provider.get_market_status(exchange)
        self._cache.set("market_status", exchange, status)
        return status

    # ── company profile ─────────────────────────

    def get_company_profile(self, symbol: str) -> CompanyProfile:
        """Fetch the fundamental company profile (cached).

        Args:
            symbol: Ticker symbol.

        Returns:
            A ``CompanyProfile`` object.

        Raises:
            MarketDataError: On provider failure.
        """
        symbol = symbol.strip().upper()
        cached = self._cache.get("company_profile", symbol)
        if cached is not None:
            return cached

        profile = self._provider.get_company_profile(symbol)
        self._cache.set("company_profile", symbol, profile)
        return profile

    # ── cache management ────────────────────────

    def clear_cache(self, namespace: Optional[str] = None) -> None:
        """Clear the data cache.

        Args:
            namespace: Specific namespace to clear, or ``None`` for all.
        """
        self._cache.clear(namespace)

    def cache_stats(self) -> dict:
        """Return cache entry counts per namespace (diagnostics)."""
        return self._cache.stats()
