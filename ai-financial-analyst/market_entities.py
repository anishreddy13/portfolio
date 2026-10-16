"""
market_entities.py — Enterprise Canonical Market Data Entities

Pure dataclass schemas for financial instruments, live quotes, OHLC bars,
historical series, fundamentals, corporate actions, market news, economic events,
options contracts, options chains, and market status.

No business logic, caching, network requests, or provider-specific references.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from market_types import AssetClass, Currency, Exchange, MarketSession


@dataclass
class Instrument:
    """Canonical instrument metadata representation across all providers.

    Attributes:
        internal_id: Unique global internal UUID / ticker ID.
        symbol: Standardized ticker symbol (e.g. 'AAPL').
        provider_symbol: Provider-specific ticker mapping (e.g. 'AAPL:US').
        exchange: Exchange venue where instrument is traded.
        asset_class: Category of asset.
        currency: Pricing currency.
        country: Two-letter ISO country code.
        timezone: Exchange timezone (e.g. 'America/New_York').
        name: Full corporate/asset name.
        sector: Economic sector designation.
        industry: Specific industry classification.
        active: Flag indicating whether instrument is actively traded.
    """
    internal_id: str
    symbol: str
    provider_symbol: str
    exchange: Exchange = Exchange.UNKNOWN
    asset_class: AssetClass = AssetClass.EQUITY
    currency: Currency = Currency.USD
    country: str = "US"
    timezone: str = "America/New_York"
    name: str = ""
    sector: str = ""
    industry: str = ""
    active: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert Instrument to clean dictionary."""
        return {
            "internal_id": self.internal_id,
            "symbol": self.symbol,
            "provider_symbol": self.provider_symbol,
            "exchange": self.exchange.value if isinstance(self.exchange, Enum) else self.exchange,
            "asset_class": self.asset_class.value if isinstance(self.asset_class, Enum) else self.asset_class,
            "currency": self.currency.value if isinstance(self.currency, Enum) else self.currency,
            "country": self.country,
            "timezone": self.timezone,
            "name": self.name,
            "sector": self.sector,
            "industry": self.industry,
            "active": self.active,
        }


@dataclass
class Quote:
    """Canonical real-time quote snapshot.

    Attributes:
        price: Current mark / last price.
        bid: Current top-of-book bid price.
        ask: Current top-of-book ask price.
        last_trade_price: Execution price of most recent trade.
        last_trade_size: Volume size of most recent trade.
        volume: Accumulated daily trading volume.
        open: Opening price for current session.
        high: Highest price during current session.
        low: Lowest price during current session.
        previous_close: Prior session close price.
        change: Absolute price delta vs previous close.
        change_percent: Percentage price delta vs previous close.
        market_status: Current market session state.
        timestamp: ISO timestamp of price update.
    """
    symbol: str
    price: float
    bid: float = 0.0
    ask: float = 0.0
    last_trade_price: float = 0.0
    last_trade_size: float = 0.0
    volume: float = 0.0
    open: float = 0.0
    high: float = 0.0
    low: float = 0.0
    previous_close: float = 0.0
    change: float = 0.0
    change_percent: float = 0.0
    market_status: MarketSession = MarketSession.REGULAR_HOURS
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert Quote to clean dictionary."""
        return {
            "symbol": self.symbol,
            "price": self.price,
            "bid": self.bid,
            "ask": self.ask,
            "last_trade_price": self.last_trade_price,
            "last_trade_size": self.last_trade_size,
            "volume": self.volume,
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "previous_close": self.previous_close,
            "change": self.change,
            "change_percent": self.change_percent,
            "market_status": self.market_status.value if isinstance(self.market_status, Enum) else self.market_status,
            "timestamp": self.timestamp,
        }


@dataclass
class OHLCBar:
    """Single Open-High-Low-Close-Volume candlestick bar.

    Attributes:
        symbol: Target ticker symbol.
        open: Bar opening price.
        high: Bar maximum price.
        low: Bar minimum price.
        close: Bar closing price.
        volume: Volume traded during bar period.
        vwap: Volume-weighted average price during bar.
        trade_count: Number of discrete transactions executed in bar.
        timestamp: ISO timestamp at bar opening or closing boundary.
    """
    symbol: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    vwap: Optional[float] = None
    trade_count: Optional[int] = None
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert OHLCBar to clean dictionary."""
        return {
            "symbol": self.symbol,
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
            "volume": self.volume,
            "vwap": self.vwap,
            "trade_count": self.trade_count,
            "timestamp": self.timestamp,
        }


@dataclass
class HistoricalSeries:
    """Sequence of OHLC bars representing historical series.

    Attributes:
        symbol: Target ticker symbol.
        timeframe: Bar aggregation period (e.g. '1m', '15m', '1h', '1d').
        candles: List of OHLCBar objects ordered chronologically.
    """
    symbol: str
    timeframe: str = "1d"
    candles: List[OHLCBar] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert HistoricalSeries to clean dictionary."""
        return {
            "symbol": self.symbol,
            "timeframe": self.timeframe,
            "candles": [c.to_dict() for c in self.candles],
        }


@dataclass
class CompanyFundamentals:
    """Normalized corporate balance sheet and financial valuation metrics.

    Attributes:
        symbol: Target ticker symbol.
        market_cap: Total market capitalization.
        pe_ratio: Price-to-Earnings ratio.
        pb_ratio: Price-to-Book ratio.
        ps_ratio: Price-to-Sales ratio.
        eps: Earnings Per Share.
        dividend_yield: Annual dividend yield percentage.
        revenue: Trailing twelve-month revenue.
        net_income: Trailing twelve-month net income.
        free_cash_flow: Trailing twelve-month free cash flow.
        total_debt: Total outstanding corporate debt.
        gross_margin: Gross profit margin percentage.
        operating_margin: Operating margin percentage.
        net_margin: Net profit margin percentage.
        fiscal_period: Period designation (e.g. 'FY2025', 'Q3-2025').
        timestamp: ISO timestamp of report.
    """
    symbol: str
    market_cap: float = 0.0
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    ps_ratio: Optional[float] = None
    eps: Optional[float] = None
    dividend_yield: Optional[float] = None
    revenue: Optional[float] = None
    net_income: Optional[float] = None
    free_cash_flow: Optional[float] = None
    total_debt: Optional[float] = None
    gross_margin: Optional[float] = None
    operating_margin: Optional[float] = None
    net_margin: Optional[float] = None
    fiscal_period: str = ""
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert CompanyFundamentals to clean dictionary."""
        return {
            "symbol": self.symbol,
            "market_cap": self.market_cap,
            "pe_ratio": self.pe_ratio,
            "pb_ratio": self.pb_ratio,
            "ps_ratio": self.ps_ratio,
            "eps": self.eps,
            "dividend_yield": self.dividend_yield,
            "revenue": self.revenue,
            "net_income": self.net_income,
            "free_cash_flow": self.free_cash_flow,
            "total_debt": self.total_debt,
            "gross_margin": self.gross_margin,
            "operating_margin": self.operating_margin,
            "net_margin": self.net_margin,
            "fiscal_period": self.fiscal_period,
            "timestamp": self.timestamp,
        }


@dataclass
class CorporateAction:
    """Normalized corporate action (dividends, splits, mergers).

    Attributes:
        symbol: Target ticker symbol.
        action_type: Action classification ('DIVIDEND', 'SPLIT', 'MERGER', 'SPINOFF').
        value: Dividend amount per share or split ratio factor.
        execution_date: ISO date when action takes effect (ex-date).
        record_date: ISO record date.
        payment_date: ISO payment distribution date.
    """
    symbol: str
    action_type: str
    value: float
    execution_date: str
    record_date: str = ""
    payment_date: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert CorporateAction to clean dictionary."""
        return {
            "symbol": self.symbol,
            "action_type": self.action_type,
            "value": self.value,
            "execution_date": self.execution_date,
            "record_date": self.record_date,
            "payment_date": self.payment_date,
        }


@dataclass
class MarketNews:
    """Normalized financial news article item.

    Attributes:
        headline: Article headline / title string.
        source: News provider / publisher name.
        url: Direct link to article source.
        summary: Executive article summary.
        sentiment_score: Calculated sentiment score (-1.0 to +1.0).
        related_symbols: Ticker symbols referenced in article.
        published_at: ISO timestamp of publication.
    """
    headline: str
    source: str
    url: str
    summary: str = ""
    sentiment_score: float = 0.0
    related_symbols: List[str] = field(default_factory=list)
    published_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert MarketNews to clean dictionary."""
        return {
            "headline": self.headline,
            "source": self.source,
            "url": self.url,
            "summary": self.summary,
            "sentiment_score": self.sentiment_score,
            "related_symbols": self.related_symbols,
            "published_at": self.published_at,
        }


@dataclass
class EconomicEvent:
    """Normalized macroeconomic indicator release event (CPI, Fed Interest Rate, Non-Farm Payroll).

    Attributes:
        event_name: Title of economic event / metric.
        country: Two-letter ISO country code.
        actual: Published actual value.
        forecast: Consensus forecast estimate.
        previous: Prior period published value.
        impact: Market impact classification ('LOW', 'MEDIUM', 'HIGH').
        timestamp: ISO timestamp of release.
    """
    event_name: str
    country: str = "US"
    actual: Optional[float] = None
    forecast: Optional[float] = None
    previous: Optional[float] = None
    impact: str = "MEDIUM"
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert EconomicEvent to clean dictionary."""
        return {
            "event_name": self.event_name,
            "country": self.country,
            "actual": self.actual,
            "forecast": self.forecast,
            "previous": self.previous,
            "impact": self.impact,
            "timestamp": self.timestamp,
        }


@dataclass
class OptionsContract:
    """Single options contract specification and pricing metrics.

    Attributes:
        contract_symbol: Unique OCC option symbol ID.
        underlying_symbol: Ticker symbol of underlying asset.
        strike_price: Exercise strike price.
        expiration_date: ISO expiration date.
        option_type: Contract type ('CALL' or 'PUT').
        implied_volatility: Option IV percentage.
        delta: Option Delta Greek.
        gamma: Option Gamma Greek.
        theta: Option Theta Greek.
        vega: Option Vega Greek.
        rho: Option Rho Greek.
        open_interest: Number of outstanding open contracts.
        volume: Total daily contract volume traded.
    """
    contract_symbol: str
    underlying_symbol: str
    strike_price: float
    expiration_date: str
    option_type: str
    implied_volatility: float = 0.0
    delta: Optional[float] = None
    gamma: Optional[float] = None
    theta: Optional[float] = None
    vega: Optional[float] = None
    rho: Optional[float] = None
    open_interest: int = 0
    volume: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert OptionsContract to clean dictionary."""
        return {
            "contract_symbol": self.contract_symbol,
            "underlying_symbol": self.underlying_symbol,
            "strike_price": self.strike_price,
            "expiration_date": self.expiration_date,
            "option_type": self.option_type,
            "implied_volatility": self.implied_volatility,
            "delta": self.delta,
            "gamma": self.gamma,
            "theta": self.theta,
            "vega": self.vega,
            "rho": self.rho,
            "open_interest": self.open_interest,
            "volume": self.volume,
        }


@dataclass
class OptionsChain:
    """Full options chain matrix for an expiration date.

    Attributes:
        underlying_symbol: Ticker symbol of underlying asset.
        expiration_date: Target ISO expiration date.
        underlying_price: Mark price of underlying asset.
        calls: List of CALL OptionsContract objects.
        puts: List of PUT OptionsContract objects.
    """
    underlying_symbol: str
    expiration_date: str
    underlying_price: float = 0.0
    calls: List[OptionsContract] = field(default_factory=list)
    puts: List[OptionsContract] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert OptionsChain to clean dictionary."""
        return {
            "underlying_symbol": self.underlying_symbol,
            "expiration_date": self.expiration_date,
            "underlying_price": self.underlying_price,
            "calls": [c.to_dict() for c in self.calls],
            "puts": [p.to_dict() for p in self.puts],
        }


@dataclass
class MarketStatus:
    """Exchange and session operational status snapshot.

    Attributes:
        exchange: Target Exchange venue.
        session: Active MarketSession state.
        is_open: True if exchange is currently open for regular trading.
        next_open: ISO timestamp of upcoming session opening boundary.
        next_close: ISO timestamp of upcoming session closing boundary.
        timestamp: ISO timestamp of status measurement.
    """
    exchange: Exchange
    session: MarketSession
    is_open: bool = True
    next_open: str = ""
    next_close: str = ""
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert MarketStatus to clean dictionary."""
        return {
            "exchange": self.exchange.value if isinstance(self.exchange, Enum) else self.exchange,
            "session": self.session.value if isinstance(self.session, Enum) else self.session,
            "is_open": self.is_open,
            "next_open": self.next_open,
            "next_close": self.next_close,
            "timestamp": self.timestamp,
        }
