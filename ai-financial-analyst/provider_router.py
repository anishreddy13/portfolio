"""
provider_router.py — Intelligent Provider Selection Router

Decides which market data provider should service a given request based on health,
priority, latency, and capability support.

Delegates requests to selected providers. Does NOT perform HTTP requests directly.
"""

from __future__ import annotations

import logging
import time
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
    Quote,
)
from market_types import AssetClass, DataType, Exchange, ProviderType, Region
from normalized_response import NormalizedResponse
from provider_health import ProviderHealth
from provider_interface import MarketDataProvider
from provider_registry import ProviderRegistry, global_provider_registry
from routing_models import RoutingDecision, RoutingResult
from routing_rules import build_fallback_chain, choose_best_provider

logger = logging.getLogger("provider_router")


class ProviderRouter:
    """Intelligent provider router layer servicing downstream data queries.

    Usage::

        router = ProviderRouter()
        res = router.route_quote("AAPL")
        print(res.decision.selected_provider, res.provider_response.value.price)
    """

    def __init__(self, registry: Optional[ProviderRegistry] = None) -> None:
        self.registry = registry or global_provider_registry
        logger.info("ProviderRouter initialized.")

    def get_execution_plan(
        self,
        data_type: DataType,
        symbol: str = "",
        asset_class: AssetClass = AssetClass.EQUITY,
        exchange: Exchange = Exchange.NYSE,
        region: Region = Region.US,
        enable_consensus: bool = True,
    ) -> Tuple[RoutingDecision, List[ProviderType]]:
        """Return execution decision and candidate provider tags for consensus execution."""
        all_providers = self.registry.list_providers()
        best_provider, score, reason = choose_best_provider(
            all_providers, data_type, asset_class, exchange, region
        )
        fallback_chain = build_fallback_chain(all_providers, best_provider, data_type)
        selected_tag = best_provider.provider_name() if best_provider else ProviderType.INTERNAL

        now = datetime.now(timezone.utc).isoformat()
        decision = RoutingDecision(
            requested_data_type=data_type,
            requested_symbol=symbol,
            requested_exchange=exchange,
            requested_region=region,
            selected_provider=selected_tag,
            fallback_chain=fallback_chain,
            selection_reason=reason,
            decision_timestamp=now,
        )

        candidates: List[ProviderType] = [selected_tag]
        if enable_consensus and best_provider:
            for fb_tag in fallback_chain:
                if fb_tag not in candidates:
                    candidates.append(fb_tag)

        return decision, candidates

    def _execute_route(
        self,
        data_type: DataType,
        symbol: str,
        asset_class: AssetClass,
        exchange: Exchange,
        region: Region,
        call_fn: Any,
    ) -> RoutingResult:
        """Internal router dispatcher executing provider selection and fallback handling."""
        start_t = time.monotonic()
        now = datetime.now(timezone.utc).isoformat()

        all_providers = self.registry.list_providers()
        best_provider, score, reason = choose_best_provider(
            all_providers, data_type, asset_class, exchange, region
        )
        fallback_chain = build_fallback_chain(all_providers, best_provider, data_type)

        selected_tag = best_provider.provider_name() if best_provider else ProviderType.INTERNAL

        decision = RoutingDecision(
            requested_data_type=data_type,
            requested_symbol=symbol,
            requested_exchange=exchange,
            requested_region=region,
            selected_provider=selected_tag,
            fallback_chain=fallback_chain,
            selection_reason=reason,
            decision_timestamp=now,
        )

        if not best_provider:
            # Generate fallback empty/error response when no provider is available
            empty_response = NormalizedResponse(
                value=None,
                provider=ProviderType.INTERNAL,
                confidence=0.0,
                quality_flags=["NO_PROVIDER_AVAILABLE"],
            )
            overhead_ms = (time.monotonic() - start_t) * 1000.0
            return RoutingResult(
                decision=decision,
                provider_response=empty_response,
                provider_health_snapshot=None,
                routing_duration_ms=overhead_ms,
            )

        # Delegate execution to selected provider
        try:
            response = call_fn(best_provider)
            health_snap = best_provider.health().to_dict()
        except Exception as exc:
            logger.warning("Primary provider %s failed execution: %s. Attempting fallback...", selected_tag, exc)
            # Try fallback chain
            response = None
            health_snap = None

            for fb_tag in fallback_chain:
                fb_provider = self.registry.get(fb_tag)
                if fb_provider and fb_provider.health().healthy:
                    try:
                        logger.info("Failing over to fallback provider %s", fb_tag)
                        response = call_fn(fb_provider)
                        health_snap = fb_provider.health().to_dict()
                        decision.selected_provider = fb_tag
                        decision.selection_reason += f" (Failed over to {fb_tag.value})"
                        break
                    except Exception as fb_exc:
                        logger.warning("Fallback provider %s failed: %s", fb_tag, fb_exc)

            if response is None:
                response = NormalizedResponse(
                    value=None,
                    provider=selected_tag,
                    confidence=0.0,
                    quality_flags=["ALL_PROVIDERS_FAILED"],
                )

        overhead_ms = (time.monotonic() - start_t) * 1000.0
        return RoutingResult(
            decision=decision,
            provider_response=response,
            provider_health_snapshot=health_snap,
            routing_duration_ms=overhead_ms,
        )

    # ─────────────────────────────────────────────
    # Public Routing API Methods
    # ─────────────────────────────────────────────

    def route_quote(
        self,
        symbol: str,
        asset_class: AssetClass = AssetClass.EQUITY,
        exchange: Exchange = Exchange.NYSE,
        region: Region = Region.US,
    ) -> RoutingResult:
        """Route quote request to optimal provider."""
        return self._execute_route(
            DataType.QUOTE,
            symbol,
            asset_class,
            exchange,
            region,
            lambda p: p.get_quote(symbol),
        )

    def route_historical(
        self,
        symbol: str,
        timeframe: str = "1d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
        asset_class: AssetClass = AssetClass.EQUITY,
        exchange: Exchange = Exchange.NYSE,
        region: Region = Region.US,
    ) -> RoutingResult:
        """Route historical OHLC series request to optimal provider."""
        return self._execute_route(
            DataType.HISTORICAL_BARS,
            symbol,
            asset_class,
            exchange,
            region,
            lambda p: p.get_historical(symbol, timeframe, start_date, end_date, limit),
        )

    def route_news(self, symbol: Optional[str] = None, limit: int = 10) -> RoutingResult:
        """Route news request to optimal provider."""
        return self._execute_route(
            DataType.NEWS,
            symbol or "GLOBAL",
            AssetClass.EQUITY,
            Exchange.NYSE,
            Region.US,
            lambda p: p.get_news(symbol, limit),
        )

    def route_fundamentals(self, symbol: str) -> RoutingResult:
        """Route company fundamentals request to optimal provider."""
        return self._execute_route(
            DataType.FUNDAMENTALS,
            symbol,
            AssetClass.EQUITY,
            Exchange.NYSE,
            Region.US,
            lambda p: p.get_company_fundamentals(symbol),
        )

    def route_options(self, symbol: str, expiration_date: Optional[str] = None) -> RoutingResult:
        """Route options chain matrix request to optimal provider."""
        return self._execute_route(
            DataType.OPTIONS_CHAIN,
            symbol,
            AssetClass.OPTION,
            Exchange.CBOE,
            Region.US,
            lambda p: p.get_options_chain(symbol, expiration_date),
        )

    def route_market_status(self, exchange: Exchange = Exchange.NYSE) -> RoutingResult:
        """Route market status request to optimal provider."""
        return self._execute_route(
            DataType.MARKET_STATUS,
            exchange.value,
            AssetClass.EQUITY,
            exchange,
            Region.US,
            lambda p: p.get_market_status(exchange),
        )

    def route_corporate_actions(self, symbol: str) -> RoutingResult:
        """Route corporate actions request to optimal provider."""
        return self._execute_route(
            DataType.CORPORATE_ACTIONS,
            symbol,
            AssetClass.EQUITY,
            Exchange.NYSE,
            Region.US,
            lambda p: p.get_corporate_actions(symbol),
        )

    def route_economic_events(self, country: str = "US", limit: int = 10) -> RoutingResult:
        """Route macroeconomic events request to optimal provider."""
        return self._execute_route(
            DataType.ECONOMIC_EVENT,
            country,
            AssetClass.EQUITY,
            Exchange.NYSE,
            Region.US,
            lambda p: p.get_economic_events(country, limit),
        )

    def route_search(self, query: str) -> RoutingResult:
        """Route ticker search query request to optimal provider."""
        return self._execute_route(
            DataType.QUOTE,
            query,
            AssetClass.EQUITY,
            Exchange.NYSE,
            Region.US,
            lambda p: p.search_symbol(query),
        )
