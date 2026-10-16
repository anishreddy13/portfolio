"""
alpaca_provider.py — Alpaca Market Data Provider Adapter

Concrete implementation of MarketDataProvider for Alpaca Markets API services.
Normalizes all provider responses into enterprise NormalizedResponse[T] envelopes.

Features:
- API key & secret resolution from ALPACA_API_KEY and ALPACA_SECRET_KEY environment variables.
- Standardized REST requests with APCA-API-KEY-ID headers.
- Structured logging and error mapping into normalized response envelopes.
"""

from __future__ import annotations

import json
import logging
import os
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from market_entities import (
    CompanyFundamentals,
    CorporateAction,
    EconomicEvent,
    HistoricalSeries,
    Instrument,
    MarketNews,
    MarketStatus,
    OHLCBar,
    OptionsChain,
    OptionsContract,
    Quote,
)
from market_types import AssetClass, Currency, DataType, Exchange, MarketSession, ProviderType
from normalized_response import NormalizedResponse
from provider_health import ProviderHealth
from provider_interface import MarketDataProvider

logger = logging.getLogger("alpaca_provider")

DATA_BASE_URL = "https://data.alpaca.markets"
PAPER_BASE_URL = "https://paper-api.alpaca.markets"


class AlpacaProvider(MarketDataProvider):
    """Alpaca Markets enterprise market data provider adapter.

    Usage::

        provider = AlpacaProvider()
        quote_res = provider.get_quote("AAPL")
        print(quote_res.value.price)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        secret_key: Optional[str] = None,
    ) -> None:
        self.api_key = api_key or os.environ.get("ALPACA_API_KEY") or ""
        self.secret_key = secret_key or os.environ.get("ALPACA_SECRET_KEY") or ""

        self._last_success = ""
        self._last_failure = ""
        self._failure_count = 0
        self._consecutive_failures = 0
        self._success_count = 0

        if not self.api_key or not self.secret_key:
            logger.warning("AlpacaProvider initialized without complete credentials. Set ALPACA_API_KEY and ALPACA_SECRET_KEY.")
        else:
            logger.info("AlpacaProvider initialized successfully.")

    # ─────────────────────────────────────────────
    # Internal HTTP Request Dispatcher
    # ─────────────────────────────────────────────

    def _http_get(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None, use_paper_url: bool = False
    ) -> Tuple[Dict[str, Any], float]:
        """Perform HTTP GET request with APCA authentication headers and latency timing."""
        base = PAPER_BASE_URL if use_paper_url else DATA_BASE_URL
        query_str = f"?{urllib.parse.urlencode(params)}" if params else ""
        url = f"{base}{endpoint}{query_str}"

        headers = {
            "User-Agent": "AlpacaProvider-AI-Analyst/2.0",
            "Accept": "application/json",
        }
        if self.api_key:
            headers["APCA-API-KEY-ID"] = self.api_key
        if self.secret_key:
            headers["APCA-API-SECRET-KEY"] = self.secret_key

        start_t = time.monotonic()
        req = urllib.request.Request(url, headers=headers)

        try:
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                raw_bytes = resp.read()
                latency_ms = (time.monotonic() - start_t) * 1000.0
                data = json.loads(raw_bytes.decode("utf-8"))
                self._last_success = datetime.now(timezone.utc).isoformat()
                self._consecutive_failures = 0
                self._success_count += 1
                return data, latency_ms
        except Exception as exc:
            latency_ms = (time.monotonic() - start_t) * 1000.0
            self._last_failure = datetime.now(timezone.utc).isoformat()
            self._failure_count += 1
            self._consecutive_failures += 1
            logger.error("AlpacaProvider HTTP request failed: %s (URL: %s)", exc, endpoint)
            raise RuntimeError(f"AlpacaProvider HTTP Error: {exc}") from exc

    def _build_wrapper(
        self, payload: Any, latency_ms: float, quality_flags: Optional[List[str]] = None
    ) -> NormalizedResponse[Any]:
        """Construct NormalizedResponse envelope."""
        now = datetime.now(timezone.utc).isoformat()
        has_creds = bool(self.api_key and self.secret_key)
        return NormalizedResponse(
            value=payload,
            provider=ProviderType.ALPACA,
            provider_timestamp=now,
            received_timestamp=now,
            normalized_timestamp=now,
            confidence=0.96 if has_creds else 0.40,
            staleness_ms=int(latency_ms),
            agreement_status="SINGLE_SOURCE",
            quality_flags=quality_flags or [],
        )

    # ─────────────────────────────────────────────
    # MarketDataProvider Interface Implementations
    # ─────────────────────────────────────────────

    def get_quote(self, symbol: str) -> NormalizedResponse[Quote]:
        """Fetch real-time snapshot quote for symbol via Alpaca Stock Data API."""
        sym = symbol.upper()
        try:
            raw, latency_ms = self._http_get(f"/v2/stocks/{sym}/quotes/latest")
            quote_data = raw.get("quote", {})
            bid = float(quote_data.get("bp", 0.0))
            ask = float(quote_data.get("ap", 0.0))
            price = (bid + ask) / 2.0 if (bid > 0 and ask > 0) else bid

            quote_obj = Quote(
                symbol=sym,
                price=price,
                bid=bid,
                ask=ask,
                last_trade_price=price,
                last_trade_size=float(quote_data.get("as", 100)),
                volume=0.0,
                market_status=MarketSession.REGULAR_HOURS,
                timestamp=quote_data.get("t", datetime.now(timezone.utc).isoformat()),
            )
            return self._build_wrapper(quote_obj, latency_ms)

        except Exception as exc:
            logger.warning("Alpaca quote call failed for %s: %s. Returning unavailable envelope.", sym, exc)
            return self._build_wrapper(
                Quote(symbol=sym, price=0.0, timestamp=datetime.now(timezone.utc).isoformat()),
                0.0,
                quality_flags=["PROVIDER_UNAVAILABLE"],
            )

    def get_historical(
        self,
        symbol: str,
        timeframe: str = "1d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
    ) -> NormalizedResponse[HistoricalSeries]:
        """Fetch historical aggregate OHLC bars for symbol via Alpaca Stock Bars API."""
        sym = symbol.upper()
        timeframe_param = "1Day" if "d" in timeframe else "15Min"
        params: Dict[str, Any] = {"timeframe": timeframe_param, "limit": limit}

        try:
            raw, latency_ms = self._http_get(f"/v2/stocks/{sym}/bars", params)
            bars = raw.get("bars", [])
            candles: List[OHLCBar] = []

            for b in bars:
                candles.append(
                    OHLCBar(
                        symbol=sym,
                        open=float(b.get("o", 0.0)),
                        high=float(b.get("h", 0.0)),
                        low=float(b.get("l", 0.0)),
                        close=float(b.get("c", 0.0)),
                        volume=float(b.get("v", 0.0)),
                        vwap=float(b.get("vw", 0.0)) if "vw" in b else None,
                        trade_count=int(b.get("n", 0)) if "n" in b else None,
                        timestamp=b.get("t", ""),
                    )
                )

            series_obj = HistoricalSeries(symbol=sym, timeframe=timeframe, candles=candles)
            return self._build_wrapper(series_obj, latency_ms)

        except Exception as exc:
            logger.warning("Alpaca historical bars call failed for %s: %s", sym, exc)
            return self._build_wrapper(
                HistoricalSeries(symbol=sym, timeframe=timeframe, candles=[]),
                0.0,
                quality_flags=["PROVIDER_UNAVAILABLE"],
            )

    def get_company_fundamentals(self, symbol: str) -> NormalizedResponse[CompanyFundamentals]:
        """Fetch company fundamentals envelope."""
        sym = symbol.upper()
        # Alpaca Data API does not directly expose balance sheet fundamentals
        fundamentals = CompanyFundamentals(
            symbol=sym,
            market_cap=0.0,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
        return self._build_wrapper(fundamentals, 0.0, quality_flags=["UNSUPPORTED_DATA_TYPE"])

    def get_news(self, symbol: Optional[str] = None, limit: int = 10) -> NormalizedResponse[List[MarketNews]]:
        """Fetch market news articles via Alpaca News API."""
        params: Dict[str, Any] = {"limit": limit}
        if symbol:
            params["symbols"] = symbol.upper()

        try:
            raw, latency_ms = self._http_get("/v1/news", params)
            news_items_raw = raw.get("news", [])
            news_items: List[MarketNews] = []

            for item in news_items_raw:
                news_items.append(
                    MarketNews(
                        headline=item.get("headline", ""),
                        source=item.get("source", "Alpaca"),
                        url=item.get("url", ""),
                        summary=item.get("summary", ""),
                        sentiment_score=0.0,
                        related_symbols=item.get("symbols", []),
                        published_at=item.get("created_at", ""),
                    )
                )
            return self._build_wrapper(news_items, latency_ms)

        except Exception as exc:
            logger.warning("Alpaca news call failed: %s", exc)
            return self._build_wrapper([], 0.0, quality_flags=["PROVIDER_UNAVAILABLE"])

    def get_market_status(self, exchange: Exchange = Exchange.NYSE) -> NormalizedResponse[MarketStatus]:
        """Fetch market clock status via Alpaca Market Clock API."""
        try:
            raw, latency_ms = self._http_get("/v2/clock", use_paper_url=True)
            is_open = bool(raw.get("is_open", False))
            session = MarketSession.REGULAR_HOURS if is_open else MarketSession.CLOSED

            status_obj = MarketStatus(
                exchange=exchange,
                session=session,
                is_open=is_open,
                next_open=raw.get("next_open", ""),
                next_close=raw.get("next_close", ""),
                timestamp=raw.get("timestamp", datetime.now(timezone.utc).isoformat()),
            )
            return self._build_wrapper(status_obj, latency_ms)

        except Exception as exc:
            logger.warning("Alpaca clock status call failed: %s", exc)
            return self._build_wrapper(
                MarketStatus(exchange=exchange, session=MarketSession.UNKNOWN, is_open=False, timestamp=datetime.now(timezone.utc).isoformat()),
                0.0,
                quality_flags=["PROVIDER_UNAVAILABLE"],
            )

    def get_options_chain(self, symbol: str, expiration_date: Optional[str] = None) -> NormalizedResponse[OptionsChain]:
        """Fetch options contract chain envelope."""
        sym = symbol.upper()
        chain_obj = OptionsChain(underlying_symbol=sym, expiration_date=expiration_date or "")
        return self._build_wrapper(chain_obj, 0.0, quality_flags=["UNSUPPORTED_DATA_TYPE"])

    def get_corporate_actions(self, symbol: str) -> NormalizedResponse[List[CorporateAction]]:
        """Fetch corporate actions envelope."""
        return self._build_wrapper([], 0.0, quality_flags=["UNSUPPORTED_DATA_TYPE"])

    def get_economic_events(self, country: str = "US", limit: int = 10) -> NormalizedResponse[List[EconomicEvent]]:
        """Fetch macroeconomic events envelope."""
        return self._build_wrapper([], 0.0, quality_flags=["UNSUPPORTED_DATA_TYPE"])

    def search_symbol(self, query: str) -> NormalizedResponse[List[Instrument]]:
        """Search instruments via Alpaca Assets API."""
        try:
            raw, latency_ms = self._http_get("/v2/assets", {"status": "active"}, use_paper_url=True)
            results = raw if isinstance(raw, list) else []
            q_upper = query.upper()
            instruments: List[Instrument] = []

            for r in results:
                sym = r.get("symbol", "")
                name = r.get("name", "")
                if q_upper in sym or q_upper in name.upper():
                    instruments.append(
                        Instrument(
                            internal_id=r.get("id", sym),
                            symbol=sym,
                            provider_symbol=sym,
                            exchange=Exchange.NASDAQ if r.get("exchange") == "NASDAQ" else Exchange.NYSE,
                            asset_class=AssetClass.EQUITY if r.get("class") == "us_equity" else AssetClass.CRYPTO,
                            currency=Currency.USD,
                            name=name,
                            active=r.get("status") == "active",
                        )
                    )
                    if len(instruments) >= 10:
                        break

            return self._build_wrapper(instruments, latency_ms)

        except Exception as exc:
            logger.warning("Alpaca search call failed for '%s': %s", query, exc)
            return self._build_wrapper([], 0.0, quality_flags=["PROVIDER_UNAVAILABLE"])

    def health(self) -> ProviderHealth:
        """Return operational ProviderHealth state for Alpaca."""
        has_creds = bool(self.api_key and self.secret_key)
        total_calls = self._success_count + self._failure_count
        success_rate = (self._success_count / total_calls) if total_calls > 0 else 1.0
        healthy = has_creds and (self._consecutive_failures < 3)

        return ProviderHealth(
            provider=ProviderType.ALPACA,
            status="HEALTHY" if healthy else ("RATE_LIMITED" if not has_creds else "UNHEALTHY"),
            latency_ms=95.0 if healthy else 0.0,
            last_success=self._last_success,
            last_failure=self._last_failure,
            success_rate=success_rate,
            failure_count=self._failure_count,
            consecutive_failures=self._consecutive_failures,
            rate_limit_remaining=200 if has_creds else 0,
            healthy=healthy,
        )

    def provider_name(self) -> ProviderType:
        """Return unique ProviderType tag."""
        return ProviderType.ALPACA

    def supported_asset_classes(self) -> List[AssetClass]:
        """Return list of AssetClass categories supported by Alpaca."""
        return [
            AssetClass.EQUITY,
            AssetClass.ETF,
            AssetClass.CRYPTO,
            AssetClass.OPTION,
        ]

    def supported_data_types(self) -> List[DataType]:
        """Return list of DataType categories supported by Alpaca."""
        return [
            DataType.QUOTE,
            DataType.HISTORICAL_BARS,
            DataType.NEWS,
            DataType.MARKET_STATUS,
        ]

    def rate_limit(self) -> Dict[str, Any]:
        """Return rate limit allocation metadata for Alpaca (200 requests/minute)."""
        return {
            "tier": "Standard (200 req/min)",
            "requests_remaining": 200 if (self.api_key and self.secret_key) else 0,
            "reset_seconds": 60,
        }
