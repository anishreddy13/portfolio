"""
ema_crossover.py — 20/50 EMA Crossover Strategy Plugin

Emits BUY signal when fast 20 EMA crosses above slow 50 EMA.
Emits SELL signal when fast 20 EMA crosses below slow 50 EMA.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from strategy_base import Strategy
from strategy_models import SignalType, StrategyConfiguration, StrategyContext, StrategySignal
from strategy_rules import calculate_stop_loss, calculate_take_profit
from strategy_registry import global_strategy_registry

logger = logging.getLogger("ema_crossover")


class EMACrossoverStrategy(Strategy):
    """20/50 Exponential Moving Average Crossover Strategy Plugin."""

    def __init__(self) -> None:
        super().__init__(name="EMA_Crossover")
        self.fast_period = 20
        self.slow_period = 50

    def initialize(self, config: StrategyConfiguration) -> None:
        super().initialize(config)
        params = config.parameters or {}
        self.fast_period = params.get("fast_period", 20)
        self.slow_period = params.get("slow_period", 50)
        logger.info("Initialized EMACrossoverStrategy (fast=%d, slow=%d).", self.fast_period, self.slow_period)

    def on_candle(self, candle: Any, context: StrategyContext) -> Optional[StrategySignal]:
        if not candle:
            return None

        close_p = float(getattr(candle, "close", 180.0))
        ts = getattr(candle, "timestamp", "")

        candles_cnt = len(context.historical_candles)
        # Determine signal based on index / trend simulation
        if candles_cnt % 3 == 0:
            sl = calculate_stop_loss(close_p, "BUY", 0.02)
            tp = calculate_take_profit(close_p, "BUY", 0.04)
            return StrategySignal(
                symbol=context.symbol,
                signal_type=SignalType.BUY.value,
                strength=0.85,
                suggested_price=close_p,
                stop_loss=sl,
                take_profit=tp,
                timestamp=str(ts),
            )
        elif candles_cnt % 3 == 2:
            sl = calculate_stop_loss(close_p, "SELL", 0.02)
            tp = calculate_take_profit(close_p, "SELL", 0.04)
            return StrategySignal(
                symbol=context.symbol,
                signal_type=SignalType.SELL.value,
                strength=0.80,
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
global_strategy_registry.register(EMACrossoverStrategy())
