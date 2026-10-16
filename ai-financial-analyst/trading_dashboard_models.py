"""
trading_dashboard_models.py — Data Models for Phase 5 Live Trading Dashboard

Defines WatchlistItem, AIAnalysisPanel, ProviderHealthPanel, StreamingTelemetryPanel,
MarketOverviewPanel, and DashboardSnapshot dataclasses with full JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class WatchlistItem:
    """Represents a single watchlist item driven by EnterpriseMarketCache & Consensus.

    Attributes:
        symbol: Ticker symbol string.
        price: Live mark price.
        bid: Current bid price.
        ask: Current ask price.
        confidence: Multi-provider consensus confidence score (0.0 to 1.0).
        provider: Winning provider tag string.
        agreement_status: Agreement state ('AGREED', 'SINGLE_SOURCE', 'DISAGREED').
        updated_at: ISO timestamp of last mark price update.
    """
    symbol: str
    price: float = 0.0
    bid: float = 0.0
    ask: float = 0.0
    confidence: float = 0.99
    provider: str = "POLYGON"
    agreement_status: str = "AGREED"
    updated_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert WatchlistItem to clean dictionary."""
        return {
            "symbol": self.symbol,
            "price": round(self.price, 2),
            "bid": round(self.bid, 2),
            "ask": round(self.ask, 2),
            "confidence": round(self.confidence, 4),
            "provider": self.provider,
            "agreement_status": self.agreement_status,
            "updated_at": self.updated_at,
        }


@dataclass
class AIAnalysisPanel:
    """AI CoPilot summary & risk insights aggregated from StrategyCoach & backend engines.

    Attributes:
        summary: Executive behavioral summary string.
        health_score: Overall health score (0-100).
        health_state: Health status state string ('HEALTHY', 'WARNING', 'CRITICAL').
        validity_score: Strategy validation quality score (0-100).
        drift_state: Strategy drift state string ('NO_DRIFT', 'MILD_DRIFT', 'SEVERE_DRIFT').
        risk_observations: List of key risk observation bullet strings.
        recommendations: List of operational recommendation bullet strings.
    """
    summary: str = ""
    health_score: float = 92.5
    health_state: str = "HEALTHY"
    validity_score: float = 95.0
    drift_state: str = "NO_DRIFT"
    risk_observations: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert AIAnalysisPanel to clean dictionary."""
        return {
            "summary": self.summary,
            "health_score": round(self.health_score, 1),
            "health_state": self.health_state,
            "validity_score": round(self.validity_score, 1),
            "drift_state": self.drift_state,
            "risk_observations": self.risk_observations,
            "recommendations": self.recommendations,
        }


@dataclass
class ProviderHealthEntry:
    """Represents real-time operational status for a single market data provider."""
    name: str
    status: str = "HEALTHY"
    latency_ms: float = 12.5
    success_rate: float = 99.8
    active: bool = True
    total_requests: int = 0
    failed_requests: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "status": self.status,
            "latency_ms": round(self.latency_ms, 1),
            "success_rate": round(self.success_rate, 2),
            "active": self.active,
            "total_requests": self.total_requests,
            "failed_requests": self.failed_requests,
        }


@dataclass
class ProviderHealthPanel:
    """Aggregates status across all enterprise data providers (Polygon, Alpaca, Finnhub)."""
    providers: List[ProviderHealthEntry] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "providers": [p.to_dict() for p in self.providers],
        }


@dataclass
class StreamingTelemetryPanel:
    """Real-time infrastructure throughput & caching telemetry metrics."""
    messages_per_sec: float = 45.2
    cache_hit_ratio: float = 98.4
    cache_misses: int = 12
    consensus_per_sec: float = 38.0
    stream_latency_ms: float = 8.4
    active_subscriptions: int = 15

    def to_dict(self) -> Dict[str, Any]:
        return {
            "messages_per_sec": round(self.messages_per_sec, 1),
            "cache_hit_ratio": round(self.cache_hit_ratio, 2),
            "cache_misses": self.cache_misses,
            "consensus_per_sec": round(self.consensus_per_sec, 1),
            "stream_latency_ms": round(self.stream_latency_ms, 2),
            "active_subscriptions": self.active_subscriptions,
        }


@dataclass
class MarketOverviewPanel:
    """Market status and technical regime overview for active symbol."""
    symbol: str = "AAPL"
    price: float = 182.50
    open: float = 181.00
    high: float = 183.20
    low: float = 180.80
    close: float = 182.50
    volume: float = 45200000.0
    trend: str = "Bullish"
    market_status: str = "OPEN"
    news_count: int = 8

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "price": round(self.price, 2),
            "open": round(self.open, 2),
            "high": round(self.high, 2),
            "low": round(self.low, 2),
            "close": round(self.close, 2),
            "volume": round(self.volume, 0),
            "trend": self.trend,
            "market_status": self.market_status,
            "news_count": self.news_count,
        }


@dataclass
class DashboardSnapshot:
    """Aggregates all 5 live trading dashboard panels."""
    timestamp: str = ""
    watchlist: List[WatchlistItem] = field(default_factory=list)
    ai_analysis: AIAnalysisPanel = field(default_factory=AIAnalysisPanel)
    provider_health: ProviderHealthPanel = field(default_factory=ProviderHealthPanel)
    telemetry: StreamingTelemetryPanel = field(default_factory=StreamingTelemetryPanel)
    market_overview: MarketOverviewPanel = field(default_factory=MarketOverviewPanel)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "watchlist": [w.to_dict() for w in self.watchlist],
            "ai_analysis": self.ai_analysis.to_dict(),
            "provider_health": self.provider_health.to_dict(),
            "telemetry": self.telemetry.to_dict(),
            "market_overview": self.market_overview.to_dict(),
        }
