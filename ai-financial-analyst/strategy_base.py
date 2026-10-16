"""
strategy_base.py — Abstract Base Class for Enterprise Strategy Plugins

Defines the universal Strategy interface implemented by all quantitative trading plugins.
Ensures BacktestEngine, PaperTradingEngine, and LiveTrading engines execute strategy code identically.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Optional

from strategy_models import StrategyConfiguration, StrategyContext, StrategySignal


class Strategy(ABC):
    """Abstract Base Class for Enterprise Quantitative Strategy Plugins.

    Usage::

        class CustomStrategy(Strategy):
            def initialize(self, config: StrategyConfiguration):
                ...
            def on_candle(self, candle, context) -> Optional[StrategySignal]:
                ...
    """

    def __init__(self, name: str = "BaseStrategy") -> None:
        self.name = name
        self.config: Optional[StrategyConfiguration] = None
        self.is_initialized = False

    def initialize(self, config: StrategyConfiguration) -> None:
        """Initialize strategy with configuration parameters."""
        self.config = config
        self.is_initialized = True

    @abstractmethod
    def on_candle(self, candle: Any, context: StrategyContext) -> Optional[StrategySignal]:
        """Evaluate incoming historical or live candle and emit StrategySignal."""
        pass

    def on_tick(self, tick: Any, context: StrategyContext) -> Optional[StrategySignal]:
        """Evaluate real-time streaming tick and emit StrategySignal."""
        return None

    def on_position_open(self, position: Any) -> None:
        """Lifecycle hook called when position is opened."""
        pass

    def on_position_close(self, position: Any) -> None:
        """Lifecycle hook called when position is closed."""
        pass

    def shutdown(self) -> None:
        """Cleanup strategy resources."""
        self.is_initialized = False
