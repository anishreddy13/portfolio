"""
finnhub_provider.py — Finnhub Market Data Provider Adapter

Concrete implementation of MarketDataProvider for Finnhub.io API services.
Normalizes all provider responses into enterprise NormalizedResponse[T] envelopes.

Features:
- API key resolution from FINNHUB_API_KEY environment variable.
- Standardized REST requests with X-Finnhub-Token headers.
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

logger = logging.getLogger("finnhub_provider")

BASE_URL = "https://finnhub.io/api/v1"


class FinnhubProvider(MarketDataProvider):
    """Finnhub.io enterprise market data provider adapter.

    Usage::

        provider = FinnhubProvider()
        quote_res = provider.get_quote("AAPL")
        print(quote_res.value.price)
    """

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.environ.get("FINNHUB_API_KEY") or ""

        self._last_success = ""
        self._last_failure = ""
        self._failure_count = 0
        self._consecutive_failures = 0
        self._success_count = 0

        if not self.api_key:
            logger.warning("FinnhubProvider initialized without API key. Set FINNHUB_API_KEY environment variable.")
        else:
            logger.info("FinnhubProvider initialized successfully.")

    # ─────────────────────────────────────────────
    # Internal HTTP Request Dispatcher
    # ─────────────────────────────────────────────

    def _http_get(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None
    ) -> Tuple[Dict[str, Any], float]:
        """Perform HTTP GET request with Finnhub token authentication and latency timing."""
        query_params = dict(params or {})
        if self.api_key:
            query_params["token"] = self.api_key

        url = f"{BASE_URL}{endpoint}"
        if query_params:
            url += "?" + urllib.parse.urlencode(query_params)

        headers = {
            "User-Agent": "FinnhubProvider-AI-Analyst/2.0",
            "Accept": "application/json",
        }
        if self.api_key:
            headers["X-Finnhub-Token"] = self.api_key

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
            logger.error("FinnhubProvider HTTP request failed: %s (URL: %s)", exc, endpoint)
            raise RuntimeError(f"FinnhubProvider HTTP Error: {exc}") from exc

    def _build_wrapper(
        self, payload: Any, latency_ms: float, quality_flags: Optional[List[str]] = None
    ) -> NormalizedResponse[Any]:
        """Construct NormalizedResponse envelope."""
        now = datetime.now(timezone.utc).isoformat()
        has_key = bool(self.api_key)
        return NormalizedResponse(
            value=payload,
            provider=ProviderType.FINNHUB,
            provider_timestamp=now,
            received_timestamp=now,
            normalized_timestamp=now,
            confidence=0.97 if has_key else 0.45,
            staleness_ms=int(latency_ms),
            agreement_status="SINGLE_SOURCE",
            quality_flags=quality_flags or [],
        )

    # ─────────────────────────────────────────────
    # MarketDataProvider Interface Implementations
    # ─────────────────────────────────────────────

    def get_quote(self, symbol: str) -> NormalizedResponse[Quote]:
        """Fetch real-time quote snapshot for symbol via Finnhub /quote API."""
        sym = symbol.upper()
        try:
            raw, latency_ms = self._http_get("/quote", {"symbol": sym})
            c = float(raw.get("c", 0.0))
            h = float(raw.get("h", c))
            l = float(raw.get("l", c))
            o = float(raw.get("o", c))
            pc = float(raw.get("pc", c))
            d = float(raw.get("d", c - pc))
            dp = float(raw.get("dp", (d / pc * 100.0) if pc else 0.0))

            quote_obj = Quote(
                symbol=sym,
                price=c,
                bid=c * 0.9995,
                ask=c * 1.0005,
                last_trade_price=c,
                volume=0.0,
                open=o,
                high=h,
                low=l,
                previous_close=pc,
                change=d,
                change_percent=dp,
                market_status=MarketSession.REGULAR_HOURS,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            return self._build_wrapper(quote_obj, latency_ms)

        except Exception as exc:
            logger.warning("Finnhub quote call failed for %s: %s", sym, exc)
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
        """Fetch historical aggregate OHLC bars for symbol via Finnhub /stock/candle API."""
        sym = symbol.upper()
        res_param = "D" if "d" in timeframe else "15"
        now_ts = int(time.time())
        from_ts = now_ts - (limit * 86400 if "d" in timeframe else limit * 900)

        params: Dict[str, Any] = {
            "symbol": sym,
            "resolution": res_param,
            "from": from_ts,
            "to": now_ts,
        }

        try:
            raw, latency_ms = self._http_get("/stock/candle", params)
            status = raw.get("s", "no_data")
            candles: List[OHLCBar] = []

            if status == "ok":
                opens = raw.get("o", [])
                highs = raw.get("h", [])
                lows = raw.get("l", [])
                closes = raw.get("c", [])
                volumes = raw.get("v", [])
                timestamps = raw.get("t", [])

                for i in range(len(closes)):
                    t_iso = datetime.fromtimestamp(timestamps[i], timezone.utc).isoformat() if i < len(timestamps) else ""
                    candles.append(
                        OHLCBar(
                            symbol=sym,
                            open=float(opens[i]) if i < len(opens) else 0.0,
                            high=float(highs[i]) if i < len(highs) else 0.0,
                            low=float(lows[i]) if i < len(lows) else 0.0,
                            close=float(closes[i]),
                            volume=float(volumes[i]) if i < len(volumes) else 0.0,
                            timestamp=t_iso,
                        )
                    )

            series_obj = HistoricalSeries(symbol=sym, timeframe=timeframe, candles=candles)
            return self._build_wrapper(series_obj, latency_ms)

        except Exception as exc:
            logger.warning("Finnhub historical candle call failed for %s: %s", sym, exc)
            return self._build_wrapper(
                HistoricalSeries(symbol=sym, timeframe=timeframe, candles=[]),
                0.0,
                quality_flags=["PROVIDER_UNAVAILABLE"],
            )

    def get_company_fundamentals(self, symbol: str) -> NormalizedResponse[CompanyFundamentals]:
        """Fetch company valuation metrics via Finnhub /stock/metric API."""
        sym = symbol.upper()
        try:
            raw, latency_ms = self._http_get("/stock/metric", {"symbol": sym, "metric": "all"})
            metrics = raw.get("metric", {})

            fundamentals = CompanyFundamentals(
                symbol=sym,
                market_cap=float(metrics.get("marketCapitalization", 0.0)) * 1000000.0,
                pe_ratio=float(metrics.get("peTTM", 0.0)) if metrics.get("peTTM") else None,
                pb_ratio=float(metrics.get("pbQuarterly", 0.0)) if metrics.get("pbQuarterly") else None,
                ps_ratio=float(metrics.get("psTTM", 0.0)) if metrics.get("psTTM") else None,
                eps=float(metrics.get("epsTTM", 0.0)) if metrics.get("epsTTM") else None,
                dividend_yield=float(metrics.get("dividendYieldIndicatedAnnual", 0.0)) if metrics.get("dividendYieldIndicatedAnnual") else None,
                gross_margin=float(metrics.get("grossMarginTTM", 0.0)) if metrics.get("grossMarginTTM") else None,
                operating_margin=float(metrics.get("operatingMarginTTM", 0.0)) if metrics.get("operatingMarginTTM") else None,
                net_margin=float(metrics.get("netProfitMarginTTM", 0.0)) if metrics.get("netProfitMarginTTM") else None,
                fiscal_period="TTM",
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            return self._build_wrapper(fundamentals, latency_ms)

        except Exception as exc:
            logger.warning("Finnhub fundamentals call failed for %s: %s", sym, exc)
            return self._build_wrapper(
                CompanyFundamentals(symbol=sym, market_cap=0.0, timestamp=datetime.now(timezone.utc).isoformat()),
                0.0,
                quality_flags=["PROVIDER_UNAVAILABLE"],
            )

    def get_news(self, symbol: Optional[str] = None, limit: int = 10) -> NormalizedResponse[List[MarketNews]]:
        """Fetch market & company news articles via Finnhub /company-news or /news API."""
        try:
            if symbol:
                today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                params = {"symbol": symbol.upper(), "from": "2025-01-01", "to": today}
                raw, latency_ms = self._http_get("/company-news", params)
            else:
                raw, latency_ms = self._http_get("/news", {"category": "general"})

            articles = raw if isinstance(raw, list) else []
            news_items: List[MarketNews] = []

            for item in articles[:limit]:
                news_items.append(
                    MarketNews(
                        headline=item.get("headline", ""),
                        source=item.get("source", "Finnhub"),
                        url=item.get("url", ""),
                        summary=item.get("summary", ""),
                        sentiment_score=0.0,
                        related_symbols=[item.get("related", "")] if item.get("related") else [],
                        published_at=datetime.fromtimestamp(item.get("datetime", 0), timezone.utc).isoformat() if item.get("datetime") else "",
                    )
                )
            return self._build_wrapper(news_items, latency_ms)

        except Exception as exc:
            logger.warning("Finnhub news call failed: %s", exc)
            return self._build_wrapper([], 0.0, quality_flags=["PROVIDER_UNAVAILABLE"])

    def get_market_status(self, exchange: Exchange = Exchange.NYSE) -> NormalizedResponse[MarketStatus]:
        """Fetch market status via Finnhub /stock/market-status API."""
        try:
            raw, latency_ms = self._http_get("/stock/market-status", {"exchange": "US"})
            is_open = bool(raw.get("isOpen", False))
            session = MarketSession.REGULAR_HOURS if is_open else MarketSession.CLOSED

            status_obj = MarketStatus(
                exchange=exchange,
                session=session,
                is_open=is_open,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            return self._build_wrapper(status_obj, latency_ms)

        except Exception as exc:
            logger.warning("Finnhub market status call failed: %s", exc)
            return self._build_wrapper(
                MarketStatus(exchange=exchange, session=MarketSession.UNKNOWN, is_open=False, timestamp=datetime.now(timezone.utc).isoformat()),
                0.0,
                quality_flags=["PROVIDER_UNAVAILABLE"],
            )

    def get_options_chain(self, symbol: str, expiration_date: Optional[str] = None) -> NormalizedResponse[OptionsChain]:
        """Fetch options chain matrix via Finnhub /stock/option-chain API."""
        sym = symbol.upper()
        try:
            raw, latency_ms = self._http_get("/stock/option-chain", {"symbol": sym})
            data = raw.get("data", [])

            calls: List[OptionsContract] = []
            puts: List[OptionsContract] = []

            for entry in data:
                exp = entry.get("expirationDate", "")
                options = entry.get("options", {})
                for c in options.get("CALL", []):
                    calls.append(
                        OptionsContract(
                            contract_symbol=c.get("contractName", ""),
                            underlying_symbol=sym,
                            strike_price=float(c.get("strike", 0.0)),
                            expiration_date=exp,
                            option_type="CALL",
                            implied_volatility=float(c.get("impliedVolatility", 0.0)),
                        )
                    )
                for p in options.get("PUT", []):
                    puts.append(
                        OptionsContract(
                            contract_symbol=p.get("contractName", ""),
                            underlying_symbol=sym,
                            strike_price=float(p.get("strike", 0.0)),
                            expiration_date=exp,
                            option_type="PUT",
                            implied_volatility=float(p.get("impliedVolatility", 0.0)),
                        )
                    )

            chain_obj = OptionsChain(underlying_symbol=sym, expiration_date=expiration_date or "", calls=calls, puts=puts)
            return self._build_wrapper(chain_obj, latency_ms)

        except Exception as exc:
            logger.warning("Finnhub options chain call failed for %s: %s", sym, exc)
            return self._build_wrapper(
                OptionsChain(underlying_symbol=sym, expiration_date=expiration_date or ""),
                0.0,
                quality_flags=["PROVIDER_UNAVAILABLE"],
            )

    def get_corporate_actions(self, symbol: str) -> NormalizedResponse[List[CorporateAction]]:
        """Fetch corporate dividend actions via Finnhub /stock/dividend2 API."""
        sym = symbol.upper()
        try:
            raw, latency_ms = self._http_get("/stock/dividend2", {"symbol": sym})
            results = raw.get("data", [])
            actions: List[CorporateAction] = []

            for r in results:
                actions.append(
                    CorporateAction(
                        symbol=sym,
                        action_type="DIVIDEND",
                        value=float(r.get("amount", 0.0)),
                        execution_date=r.get("exDate", ""),
                        record_date=r.get("recordDate", ""),
                        payment_date=r.get("payDate", ""),
                    )
                )
            return self._build_wrapper(actions, latency_ms)

        except Exception as exc:
            logger.warning("Finnhub dividends call failed for %s: %s", sym, exc)
            return self._build_wrapper([], 0.0, quality_flags=["PROVIDER_UNAVAILABLE"])

    def get_economic_events(self, country: str = "US", limit: int = 10) -> NormalizedResponse[List[EconomicEvent]]:
        """Fetch macroeconomic events envelope (Unsupported data type on basic Finnhub tier)."""
        return self._build_wrapper([], 0.0, quality_flags=["UNSUPPORTED_DATA_TYPE"])

    def search_symbol(self, query: str) -> NormalizedResponse[List[Instrument]]:
        """Search symbol via Finnhub /search API."""
        try:
            raw, latency_ms = self._http_get("/search", {"q": query})
            results = raw.get("result", [])
            instruments: List[Instrument] = []

            for r in results:
                instruments.append(
                    Instrument(
                        internal_id=r.get("symbol", ""),
                        symbol=r.get("symbol", ""),
                        provider_symbol=r.get("symbol", ""),
                        exchange=Exchange.NASDAQ if "NASDAQ" in r.get("displaySymbol", "") else Exchange.NYSE,
                        asset_class=AssetClass.EQUITY,
                        currency=Currency.USD,
                        name=r.get("description", ""),
                        active=True,
                    )
                )
            return self._build_wrapper(instruments, latency_ms)

        except Exception as exc:
            logger.warning("Finnhub symbol search call failed for '%s': %s", query, exc)
            return self._build_wrapper([], 0.0, quality_flags=["PROVIDER_UNAVAILABLE"])

    def health(self) -> ProviderHealth:
        """Return operational ProviderHealth state for Finnhub."""
        total_calls = self._success_count + self._failure_count
        success_rate = (self._success_count / total_calls) if total_calls > 0 else 1.0
        healthy = bool(self.api_key) and (self._consecutive_failures < 3)

        return ProviderHealth(
            provider=ProviderType.FINNHUB,
            status="HEALTHY" if healthy else ("RATE_LIMITED" if not self.api_key else "UNHEALTHY"),
            latency_ms=110.0 if healthy else 0.0,
            last_success=self._last_success,
            last_failure=self._last_failure,
            success_rate=success_rate,
            failure_count=self._failure_count,
            consecutive_failures=self._consecutive_failures,
            rate_limit_remaining=60 if bool(self.api_key) else 0,
            healthy=healthy,
        )

    def provider_name(self) -> ProviderType:
        """Return unique ProviderType tag."""
        return ProviderType.FINNHUB

    def supported_asset_classes(self) -> List[AssetClass]:
        """Return list of AssetClass categories supported by Finnhub."""
        return [
            AssetClass.EQUITY,
            AssetClass.ETF,
            AssetClass.FOREX,
            AssetClass.CRYPTO,
            AssetClass.OPTION,
        ]

    def supported_data_types(self) -> List[DataType]:
        """Return list of DataType categories supported by Finnhub."""
        return [
            DataType.QUOTE,
            DataType.HISTORICAL_BARS,
            DataType.FUNDAMENTALS,
            DataType.CORPORATE_ACTIONS,
            DataType.NEWS,
            DataType.OPTIONS_CHAIN,
            DataType.MARKET_STATUS,
        ]

    def rate_limit(self) -> Dict[str, Any]:
        """Return rate limit allocation metadata for Finnhub (60 requests/minute)."""
        return {
            "tier": "Free (60 req/min)",
            "requests_remaining": 60 if self.api_key else 0,
            "reset_seconds": 60,
        }
