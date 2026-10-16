"""
market_types.py — Enterprise Market Data Type Definitions

Defines canonical enums for asset classes, exchanges, geographic regions,
data providers, data types, market sessions, and currencies.
"""

from __future__ import annotations

from enum import Enum


class AssetClass(str, Enum):
    """Supported financial asset classes."""
    EQUITY = "EQUITY"
    ETF = "ETF"
    CRYPTO = "CRYPTO"
    FOREX = "FOREX"
    COMMODITY = "COMMODITY"
    INDEX = "INDEX"
    OPTION = "OPTION"
    BOND = "BOND"
    MUTUAL_FUND = "MUTUAL_FUND"
    UNKNOWN = "UNKNOWN"


class Exchange(str, Enum):
    """Global exchange venues."""
    NYSE = "NYSE"
    NASDAQ = "NASDAQ"
    AMEX = "AMEX"
    ARCA = "ARCA"
    CBOE = "CBOE"
    CME = "CME"
    FOREX = "FOREX"
    CRYPTO = "CRYPTO"
    LSE = "LSE"
    TSE = "TSE"
    NSE = "NSE"
    BSE = "BSE"
    UNKNOWN = "UNKNOWN"


class Region(str, Enum):
    """Geographic market regions."""
    US = "US"
    EU = "EU"
    UK = "UK"
    APAC = "APAC"
    LATAM = "LATAM"
    GLOBAL = "GLOBAL"


class ProviderType(str, Enum):
    """Supported market data providers for normalization."""
    POLYGON = "POLYGON"
    ALPACA = "ALPACA"
    FINNHUB = "FINNHUB"
    FMP = "FMP"
    TWELVE_DATA = "TWELVE_DATA"
    TIINGO = "TIINGO"
    YFINANCE = "YFINANCE"
    INTERNAL = "INTERNAL"
    UNKNOWN = "UNKNOWN"


class DataType(str, Enum):
    """Categories of market data payloads."""
    QUOTE = "QUOTE"
    HISTORICAL_BARS = "HISTORICAL_BARS"
    FUNDAMENTALS = "FUNDAMENTALS"
    CORPORATE_ACTIONS = "CORPORATE_ACTIONS"
    NEWS = "NEWS"
    ECONOMIC_EVENT = "ECONOMIC_EVENT"
    OPTIONS_CONTRACT = "OPTIONS_CONTRACT"
    OPTIONS_CHAIN = "OPTIONS_CHAIN"
    MARKET_STATUS = "MARKET_STATUS"


class MarketSession(str, Enum):
    """Trading session states."""
    PRE_MARKET = "PRE_MARKET"
    REGULAR_HOURS = "REGULAR_HOURS"
    AFTER_HOURS = "AFTER_HOURS"
    CLOSED = "CLOSED"
    UNKNOWN = "UNKNOWN"


class Currency(str, Enum):
    """Fiat and crypto currency designations."""
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"
    CAD = "CAD"
    AUD = "AUD"
    CHF = "CHF"
    INR = "INR"
    BTC = "BTC"
    ETH = "ETH"
    UNKNOWN = "UNKNOWN"
