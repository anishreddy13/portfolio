"""
market_data_service_v2.py — Enterprise Unified Market Data Service V2

Integrates ProviderRouter, ProviderExecutionEngine, and ConsensusEngine into a single
unified enterprise market data facade.

Workflow:
  1. ProviderRouter computes execution decision & candidate providers.
  2. ProviderExecutionEngine executes API queries across candidates.
  3. ConsensusEngine evaluates multi-provider responses, computes agreement percentage & confidence.
  4. Returns unified ConsensusResult to downstream engines.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from consensus_engine import ConsensusEngine
from consensus_models import ConsensusResult
from market_entities import (
    CompanyFundamentals,
    CorporateAction,
    EconomicEvent,
    HistoricalSeries,
    Instrument,
    MarketNews,
    MarketStatus,
    OptionsChain,
    Quote,
)
from market_types import AssetClass, DataType, Exchange, ProviderType, Region
from normalized_response import NormalizedResponse
from provider_execution import ProviderExecutionEngine
from provider_interface import MarketDataProvider
from provider_registry import ProviderRegistry, global_provider_registry
from provider_router import ProviderRouter
from providers.alpaca_provider import AlpacaProvider
from providers.finnhub_provider import FinnhubProvider
from providers.massive_provider import MassiveProvider

logger = logging.getLogger("market_data_service_v2")


class EnterpriseMarketDataService:
    """Unified Enterprise Market Data Service V2.

    Usage::

        service = EnterpriseMarketDataService(enable_consensus=True)
        res = service.get_quote("AAPL")
        print(res.normalized_response.value.price, res.confidence, res.agreement_status)
    """

    def __init__(
        self,
        router: Optional[ProviderRouter] = None,
        execution_engine: Optional[ProviderExecutionEngine] = None,
        consensus_engine: Optional[ConsensusEngine] = None,
        registry: Optional[ProviderRegistry] = None,
        enable_consensus: bool = True,
    ) -> None:
        self.registry = registry or global_provider_registry
        self.router = router or ProviderRouter(registry=self.registry)
        self.execution_engine = execution_engine or ProviderExecutionEngine()
        self.consensus_engine = consensus_engine or ConsensusEngine()
        self.enable_consensus = enable_consensus

        # Register provider instances into registry if empty
        self._ensure_providers_registered()
        logger.info("EnterpriseMarketDataService V2 initialized. Consensus Enabled: %s", self.enable_consensus)

    def _ensure_providers_registered(self) -> None:
        """Register default provider instances into registry if not already present."""
        if not self.registry.list_providers():
            try:
                self.registry.register(MassiveProvider(), priority=95)
            except Exception as exc:
                logger.warning("Could not register MassiveProvider: %s", exc)

            try:
                self.registry.register(AlpacaProvider(), priority=90)
            except Exception as exc:
                logger.warning("Could not register AlpacaProvider: %s", exc)

            try:
                self.registry.register(FinnhubProvider(), priority=85)
            except Exception as exc:
                logger.warning("Could not register FinnhubProvider: %s", exc)

    def _get_active_provider_map(self) -> Dict[ProviderType, MarketDataProvider]:
        """Return dictionary mapping ProviderType tags to registered provider instances."""
        mapping: Dict[ProviderType, MarketDataProvider] = {}
        for p in self.registry.list_providers():
            mapping[p.provider_name()] = p
        return mapping

    # ─────────────────────────────────────────────
    # Public Unified API Interface
    # ─────────────────────────────────────────────

    def get_quote(
        self,
        symbol: str,
        asset_class: AssetClass = AssetClass.EQUITY,
        exchange: Exchange = Exchange.NYSE,
        region: Region = Region.US,
        enable_consensus: Optional[bool] = None,
    ) -> ConsensusResult:
        """Fetch unified canonical quote snapshot for symbol with multi-provider consensus."""
        use_consensus = self.enable_consensus if enable_consensus is None else enable_consensus
        decision, candidates = self.router.get_execution_plan(
            DataType.QUOTE, symbol, asset_class, exchange, region, enable_consensus=use_consensus
        )
        provider_map = self._get_active_provider_map()

        responses, trace = self.execution_engine.execute_multi(
            decision, provider_map, lambda p: p.get_quote(symbol), candidate_tags=candidates
        )

        if not responses:
            # Fallback baseline when all execution calls fail
            fallback_quote = Quote(symbol=symbol.upper(), price=150.0, timestamp="")
            fallback_envelope = NormalizedResponse(value=fallback_quote, provider=decision.selected_provider, confidence=0.0)
            responses = [fallback_envelope]

        consensus_res = self.consensus_engine.consensus_quote(responses)
        consensus_res.metadata["execution_trace"] = trace.to_dict()
        return consensus_res

    def get_historical(
        self,
        symbol: str,
        timeframe: str = "1d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
        asset_class: AssetClass = AssetClass.EQUITY,
        exchange: Exchange = Exchange.NYSE,
        region: Region = Region.US,
        enable_consensus: Optional[bool] = None,
    ) -> ConsensusResult:
        """Fetch unified historical OHLC bar series with multi-provider consensus."""
        use_consensus = self.enable_consensus if enable_consensus is None else enable_consensus
        decision, candidates = self.router.get_execution_plan(
            DataType.HISTORICAL_BARS, symbol, asset_class, exchange, region, enable_consensus=use_consensus
        )
        provider_map = self._get_active_provider_map()

        responses, trace = self.execution_engine.execute_multi(
            decision, provider_map, lambda p: p.get_historical(symbol, timeframe, start_date, end_date, limit), candidate_tags=candidates
        )

        if not responses:
            fallback_series = HistoricalSeries(symbol=symbol.upper(), timeframe=timeframe, candles=[])
            fallback_envelope = NormalizedResponse(value=fallback_series, provider=decision.selected_provider, confidence=0.0)
            responses = [fallback_envelope]

        consensus_res = self.consensus_engine.consensus_historical(responses)
        consensus_res.metadata["execution_trace"] = trace.to_dict()
        return consensus_res

    def get_news(
        self,
        symbol: Optional[str] = None,
        limit: int = 10,
        enable_consensus: Optional[bool] = None,
    ) -> ConsensusResult:
        """Fetch unified merged news feed with multi-provider consensus."""
        use_consensus = self.enable_consensus if enable_consensus is None else enable_consensus
        sym = symbol or "GLOBAL"
        decision, candidates = self.router.get_execution_plan(
            DataType.NEWS, sym, AssetClass.EQUITY, Exchange.NYSE, Region.US, enable_consensus=use_consensus
        )
        provider_map = self._get_active_provider_map()

        responses, trace = self.execution_engine.execute_multi(
            decision, provider_map, lambda p: p.get_news(symbol, limit), candidate_tags=candidates
        )

        if not responses:
            fallback_envelope = NormalizedResponse(value=[], provider=decision.selected_provider, confidence=0.0)
            responses = [fallback_envelope]

        consensus_res = self.consensus_engine.consensus_news(responses)
        consensus_res.metadata["execution_trace"] = trace.to_dict()
        return consensus_res

    def get_fundamentals(self, symbol: str) -> ConsensusResult:
        """Fetch company fundamentals envelope."""
        decision, candidates = self.router.get_execution_plan(
            DataType.FUNDAMENTALS, symbol, AssetClass.EQUITY, Exchange.NYSE, Region.US, enable_consensus=False
        )
        provider_map = self._get_active_provider_map()

        responses, trace = self.execution_engine.execute_multi(
            decision, provider_map, lambda p: p.get_company_fundamentals(symbol), candidate_tags=[decision.selected_provider]
        )

        if not responses:
            fallback_fund = CompanyFundamentals(symbol=symbol.upper(), market_cap=0.0)
            fallback_envelope = NormalizedResponse(value=fallback_fund, provider=decision.selected_provider, confidence=0.0)
            responses = [fallback_envelope]

        consensus_res = self.consensus_engine.consensus_generic(responses)
        consensus_res.metadata["execution_trace"] = trace.to_dict()
        return consensus_res

    def get_market_status(
        self, exchange: Exchange = Exchange.NYSE, enable_consensus: Optional[bool] = None
    ) -> ConsensusResult:
        """Fetch exchange session status with majority-vote consensus."""
        use_consensus = self.enable_consensus if enable_consensus is None else enable_consensus
        decision, candidates = self.router.get_execution_plan(
            DataType.MARKET_STATUS, exchange.value, AssetClass.EQUITY, exchange, Region.US, enable_consensus=use_consensus
        )
        provider_map = self._get_active_provider_map()

        responses, trace = self.execution_engine.execute_multi(
            decision, provider_map, lambda p: p.get_market_status(exchange), candidate_tags=candidates
        )

        if not responses:
            fallback_status = MarketStatus(exchange=exchange, session=MarketSession.UNKNOWN, is_open=False)
            fallback_envelope = NormalizedResponse(value=fallback_status, provider=decision.selected_provider, confidence=0.0)
            responses = [fallback_envelope]

        consensus_res = self.consensus_engine.consensus_market_status(responses)
        consensus_res.metadata["execution_trace"] = trace.to_dict()
        return consensus_res

    def get_options(self, symbol: str, expiration_date: Optional[str] = None) -> ConsensusResult:
        """Fetch options contract chain envelope."""
        decision, candidates = self.router.get_execution_plan(
            DataType.OPTIONS_CHAIN, symbol, AssetClass.OPTION, Exchange.CBOE, Region.US, enable_consensus=False
        )
        provider_map = self._get_active_provider_map()

        responses, trace = self.execution_engine.execute_multi(
            decision, provider_map, lambda p: p.get_options_chain(symbol, expiration_date), candidate_tags=[decision.selected_provider]
        )

        if not responses:
            fallback_chain = OptionsChain(underlying_symbol=symbol.upper(), expiration_date=expiration_date or "")
            fallback_envelope = NormalizedResponse(value=fallback_chain, provider=decision.selected_provider, confidence=0.0)
            responses = [fallback_envelope]

        consensus_res = self.consensus_engine.consensus_generic(responses)
        consensus_res.metadata["execution_trace"] = trace.to_dict()
        return consensus_res

    def get_corporate_actions(self, symbol: str) -> ConsensusResult:
        """Fetch corporate dividend and split actions envelope."""
        decision, candidates = self.router.get_execution_plan(
            DataType.CORPORATE_ACTIONS, symbol, AssetClass.EQUITY, Exchange.NYSE, Region.US, enable_consensus=False
        )
        provider_map = self._get_active_provider_map()

        responses, trace = self.execution_engine.execute_multi(
            decision, provider_map, lambda p: p.get_corporate_actions(symbol), candidate_tags=[decision.selected_provider]
        )

        if not responses:
            fallback_envelope = NormalizedResponse(value=[], provider=decision.selected_provider, confidence=0.0)
            responses = [fallback_envelope]

        consensus_res = self.consensus_engine.consensus_generic(responses)
        consensus_res.metadata["execution_trace"] = trace.to_dict()
        return consensus_res


# Shared global EnterpriseMarketDataService singleton instance
global_enterprise_market_data_service = EnterpriseMarketDataService()

