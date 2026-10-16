"""
provider_interface.py — Abstract Base Interface for Market Data Providers

Defines the contract MarketDataProvider that all concrete data providers
(Polygon/Massive, Alpaca, Finnhub, FMP, Twelve Data, Tiingo, Yahoo Finance) must implement.

No networking, HTTP calls, or provider implementations inside this module.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

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
from market_types import AssetClass, DataType, Exchange, ProviderType
from normalized_response import NormalizedResponse
from provider_health import ProviderHealth


class MarketDataProvider(ABC):
    """Abstract Base Class for all enterprise market data providers.

    All methods return a standardized NormalizedResponse[T] wrapper containing
    the canonical market entity.
    """

    @abstractmethod
    def get_quote(self, symbol: str) -> NormalizedResponse[Quote]:
        """Fetch real-time normalized Quote for symbol."""
        pass

    @abstractmethod
    def get_historical(
        self,
        symbol: str,
        timeframe: str = "1d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
    ) -> NormalizedResponse[HistoricalSeries]:
        """Fetch normalized HistoricalSeries (OHLC bars) for symbol."""
        pass

    @abstractmethod
    def get_company_fundamentals(self, symbol: str) -> NormalizedResponse[CompanyFundamentals]:
        """Fetch normalized CompanyFundamentals for corporate balance sheet / valuation."""
        pass

    @abstractmethod
    def get_news(self, symbol: Optional[str] = None, limit: int = 10) -> NormalizedResponse[List[MarketNews]]:
        """Fetch normalized list of MarketNews articles."""
        pass

    @abstractmethod
    def get_market_status(self, exchange: Exchange = Exchange.NYSE) -> NormalizedResponse[MarketStatus]:
        """Fetch normalized operational MarketStatus for exchange."""
        pass

    @abstractmethod
    def get_options_chain(self, symbol: str, expiration_date: Optional[str] = None) -> NormalizedResponse[OptionsChain]:
        """Fetch normalized OptionsChain matrix for underlying symbol."""
        pass

    @abstractmethod
    def get_corporate_actions(self, symbol: str) -> NormalizedResponse[List[CorporateAction]]:
        """Fetch normalized list of CorporateAction items (dividends, splits)."""
        pass

    @abstractmethod
    def get_economic_events(self, country: str = "US", limit: int = 10) -> NormalizedResponse[List[EconomicEvent]]:
        """Fetch normalized list of macroeconomic EconomicEvent items."""
        pass

    @abstractmethod
    def search_symbol(self, query: str) -> NormalizedResponse[List[Instrument]]:
        """Search instruments matching ticker or company name query."""
        pass

    @abstractmethod
    def health(self) -> ProviderHealth:
        """Return operational ProviderHealth state."""
        pass

    @abstractmethod
    def provider_name(self) -> ProviderType:
        """Return unique ProviderType tag."""
        pass

    @abstractmethod
    def supported_asset_classes(self) -> List[AssetClass]:
        """Return list of AssetClass categories supported by provider."""
        pass

    @abstractmethod
    def supported_data_types(self) -> List[DataType]:
        """Return list of DataType categories supported by provider."""
        pass

    @abstractmethod
    def rate_limit(self) -> Dict[str, Any]:
        """Return rate limit allocation and consumption metadata."""
        pass
