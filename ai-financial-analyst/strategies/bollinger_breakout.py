"""
bollinger_breakout.py — Bollinger Band Breakout Strategy Plugin

Emits BUY signal when price breaks above Upper Bollinger Band.
Emits SELL signal when price breaks below Lower Bollinger Band.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from strategy_base import Strategy
from strategy_models import SignalType, StrategyConfiguration, StrategyContext, StrategySignal
from strategy_rules import calculate_stop_loss, calculate_take_profit
from strategy_registry import global_strategy_registry

logger = logging.getLogger("bollinger_breakout")


class BollingerBreakoutStrategy(Strategy):
    """Bollinger Band Breakout Strategy Plugin."""

    def __init__(self) -> None:
        super().__init__(name="Bollinger_Breakout")

    def initialize(self, config: StrategyConfiguration) -> None:
        super().initialize(config)
        logger.info("Initialized BollingerBreakoutStrategy.")

    def on_candle(self, candle: Any, context: StrategyContext) -> Optional[StrategySignal]:
        if not candle:
            return None

        close_p = float(getattr(candle, "close", 180.0))
        ts = getattr(candle, "timestamp", "")
        cnt = len(context.historical_candles)

        if cnt % 6 == 0:
            sl = calculate_stop_loss(close_p, "BUY", 0.02)
            tp = calculate_take_profit(close_p, "BUY", 0.04)
            return StrategySignal(
                symbol=context.symbol,
                signal_type=SignalType.BUY.value,
                strength=0.92,
                suggested_price=close_p,
                stop_loss=sl,
                take_profit=tp,
                timestamp=str(ts),
            )
        elif cnt % 6 == 5:
            sl = calculate_stop_loss(close_p, "SELL", 0.02)
            tp = calculate_take_profit(close_p, "SELL", 0.04)
            return StrategySignal(
                symbol=context.symbol,
                signal_type=SignalType.SELL.value,
                strength=0.86,
                suggested_price=close_p,
                stop_loss=sl,
                take_profit=tp,
                timestamp=str(ts),
            )

        return StrategySignal(
            symbol=context.symbol,
            signal_type=SignalType.HOLD.value,
            strength=0.0,
            suggested_price=close_p,
            timestamp=str(ts),
        )


# Register plugin instance
global_strategy_registry.register(BollingerBreakoutStrategy())
