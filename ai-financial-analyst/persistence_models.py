"""
persistence_models.py — Data Models for Persistence & Snapshot Subsystem

Defines UserSettings, WatchlistRecord, PortfolioSnapshot, OrderHistoryRecord,
TradeHistoryRecord, DashboardPreferences, and PersistenceStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class UserSettings:
    """User preferences & application settings model.

    Attributes:
        user_id: Unique user identifier string.
        theme: UI theme preference ('dark', 'light').
        auto_save: Enable background autosave boolean.
        auto_save_interval_sec: Background autosave frequency in seconds.
        notifications_enabled: Enable event alerts boolean.
    """
    user_id: str = "default"
    theme: str = "dark"
    auto_save: bool = True
    auto_save_interval_sec: int = 30
    notifications_enabled: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert UserSettings to clean dictionary."""
        return {
            "user_id": self.user_id,
            "theme": self.theme,
            "auto_save": self.auto_save,
            "auto_save_interval_sec": self.auto_save_interval_sec,
            "notifications_enabled": self.notifications_enabled,
        }


@dataclass
class WatchlistRecord:
    """Persisted user watchlist symbols record."""
    user_id: str = "default"
    symbols: List[str] = field(default_factory=lambda: ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN"])
    updated_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "symbols": self.symbols,
            "updated_at": self.updated_at,
        }


@dataclass
class PortfolioSnapshot:
    """Point-in-time state snapshot of portfolio holdings and cash balance.

    Attributes:
        snapshot_id: Unique snapshot identifier string.
        user_id: Associated user identifier.
        portfolio_data: Serialized portfolio summary dictionary.
        created_at: ISO timestamp of snapshot creation.
    """
    snapshot_id: str
    user_id: str
    portfolio_data: Dict[str, Any]
    created_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "snapshot_id": self.snapshot_id,
            "user_id": self.user_id,
            "portfolio_data": self.portfolio_data,
            "created_at": self.created_at,
        }


@dataclass
class OrderHistoryRecord:
    """Persisted paper trading order history record."""
    user_id: str = "default"
    orders_data: List[Dict[str, Any]] = field(default_factory=list)
    updated_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "orders_data": self.orders_data,
            "updated_at": self.updated_at,
        }


@dataclass
class TradeHistoryRecord:
    """Persisted trade execution history record."""
    user_id: str = "default"
    trades_data: List[Dict[str, Any]] = field(default_factory=list)
    updated_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "trades_data": self.trades_data,
            "updated_at": self.updated_at,
        }


@dataclass
class DashboardPreferences:
    """Persisted dashboard layout preferences."""
    user_id: str = "default"
    default_symbol: str = "AAPL"
    layout_mode: str = "GRID"
    refresh_rate_ms: int = 1500

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "default_symbol": self.default_symbol,
            "layout_mode": self.layout_mode,
            "refresh_rate_ms": self.refresh_rate_ms,
        }


@dataclass
class PersistenceStatistics:
    """Operational metrics tracking the PersistenceManager."""
    save_count: int = 0
    load_count: int = 0
    autosaves: int = 0
    snapshot_count: int = 0
    average_save_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "save_count": self.save_count,
            "load_count": self.load_count,
            "autosaves": self.autosaves,
            "snapshot_count": self.snapshot_count,
            "average_save_ms": round(self.average_save_ms, 2),
        }
