"""
strategy_models.py — Data Models for Enterprise Plugin-Based Strategy Framework

Defines StrategySignal, StrategyState, StrategyConfiguration, StrategyContext,
StrategyResult, and StrategyStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


class SignalType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"
    FLAT = "FLAT"


@dataclass
class IndicatorRule:
    indicator: str = "PRICE"
    params: Dict[str, Any] = field(default_factory=dict)
    operator: str = "equals"
    value: Any = None
    raw_expression: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "indicator": self.indicator,
            "params": self.params,
            "operator": self.operator,
            "value": self.value,
            "raw_expression": self.raw_expression,
        }


@dataclass
class EntryRule:
    condition_type: str = "custom"
    details: Dict[str, Any] = field(default_factory=dict)
    raw_clause: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "condition_type": self.condition_type,
            "details": self.details,
            "raw_clause": self.raw_clause,
        }


@dataclass
class ExitRule:
    condition_type: str = "custom"
    details: Dict[str, Any] = field(default_factory=dict)
    raw_clause: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "condition_type": self.condition_type,
            "details": self.details,
            "raw_clause": self.raw_clause,
        }


@dataclass
class Strategy:
    strategy_name: str
    asset: Optional[str] = None
    exchange: Optional[str] = None
    timeframe: str = "1d"
    entry_rules: List[EntryRule] = field(default_factory=list)
    exit_rules: List[ExitRule] = field(default_factory=list)
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    position_size: Optional[float] = None
    trading_days: List[str] = field(default_factory=list)
    session: Optional[str] = None
    indicators_used: List[str] = field(default_factory=list)
    confidence: float = 1.0
    parsing_method: str = "rule_based"
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "strategy_name": self.strategy_name,
            "asset": self.asset,
            "exchange": self.exchange,
            "timeframe": self.timeframe,
            "entry_rules": [r.to_dict() for r in self.entry_rules],
            "exit_rules": [r.to_dict() for r in self.exit_rules],
            "stop_loss": self.stop_loss,
            "take_profit": self.take_profit,
            "position_size": self.position_size,
            "trading_days": self.trading_days,
            "session": self.session,
            "indicators_used": self.indicators_used,
            "confidence": self.confidence,
            "parsing_method": self.parsing_method,
            "warnings": self.warnings,
            "errors": self.errors,
        }


@dataclass
class StrategySignal:
    """Represents a trading signal emitted by a Strategy plugin.

    Attributes:
        symbol: Target ticker symbol.
        signal_type: SignalType ('BUY', 'SELL', 'HOLD', 'FLAT').
        strength: Signal confidence / strength score (0.0 to 1.0).
        suggested_price: Mark price at signal generation.
        stop_loss: Calculated stop loss price ($).
        take_profit: Calculated take profit price ($).
        timestamp: ISO timestamp of signal generation.
    """
    symbol: str
    signal_type: str = "HOLD"
    strength: float = 0.0
    suggested_price: float = 0.0
    stop_loss: float = 0.0
    take_profit: float = 0.0
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert StrategySignal to clean dictionary."""
        return {
            "symbol": self.symbol,
            "signal_type": self.signal_type,
            "strength": round(self.strength, 2),
            "suggested_price": round(self.suggested_price, 2),
            "stop_loss": round(self.stop_loss, 2),
            "take_profit": round(self.take_profit, 2),
            "timestamp": self.timestamp,
        }


@dataclass
class StrategyState:
    """Runtime state tracking for an active strategy instance."""
    strategy_name: str
    is_active: bool = True
    position_qty: float = 0.0
    entry_price: float = 0.0
    total_signals_generated: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "strategy_name": self.strategy_name,
            "is_active": self.is_active,
            "position_qty": round(self.position_qty, 4),
            "entry_price": round(self.entry_price, 2),
            "total_signals_generated": self.total_signals_generated,
        }


@dataclass
class StrategyConfiguration:
    """Configurable parameters for a strategy plugin."""
    strategy_name: str
    symbol: str = "AAPL"
    parameters: Dict[str, Any] = field(default_factory=dict)
    risk_per_trade_pct: float = 2.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "strategy_name": self.strategy_name,
            "symbol": self.symbol,
            "parameters": self.parameters,
            "risk_per_trade_pct": round(self.risk_per_trade_pct, 2),
        }


@dataclass
class StrategyContext:
    """Runtime market & portfolio context provided to strategy execution hooks."""
    symbol: str
    current_candle: Optional[Any] = None
    historical_candles: List[Any] = field(default_factory=list)
    current_quote: Optional[Any] = None
    active_position: Optional[Any] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "candles_count": len(self.historical_candles),
            "has_quote": self.current_quote is not None,
            "has_position": self.active_position is not None,
        }


@dataclass
class StrategyResult:
    """Complete strategy evaluation result container."""
    strategy_name: str
    symbol: str
    signals: List[StrategySignal] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "strategy_name": self.strategy_name,
            "symbol": self.symbol,
            "signals": [s.to_dict() for s in self.signals],
            "metrics": self.metrics,
        }


@dataclass
class StrategyStatistics:
    """Operational metrics tracking registered strategies."""
    total_strategies_registered: int = 0
    active_strategies: int = 0
    signals_generated: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_strategies_registered": self.total_strategies_registered,
            "active_strategies": self.active_strategies,
            "signals_generated": self.signals_generated,
        }
