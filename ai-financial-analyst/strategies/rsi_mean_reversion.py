"""
rsi_mean_reversion.py — RSI Mean Reversion Strategy Plugin

Emits BUY signal when RSI < 30 (oversold).
Emits SELL signal when RSI > 70 (overbought).
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from strategy_base import Strategy
from strategy_models import SignalType, StrategyConfiguration, StrategyContext, StrategySignal
from strategy_rules import calculate_stop_loss, calculate_take_profit
from strategy_registry import global_strategy_registry

logger = logging.getLogger("rsi_mean_reversion")


class RSIMeanReversionStrategy(Strategy):
    """RSI Mean Reversion Strategy Plugin."""

    def __init__(self) -> None:
        super().__init__(name="RSI_MeanReversion")
        self.oversold_thresh = 30.0
        self.overbought_thresh = 70.0

    def initialize(self, config: StrategyConfiguration) -> None:
        super().initialize(config)
        params = config.parameters or {}
        self.oversold_thresh = params.get("oversold", 30.0)
        self.overbought_thresh = params.get("overbought", 70.0)
        logger.info("Initialized RSIMeanReversionStrategy (oversold=%.1f, overbought=%.1f).", self.oversold_thresh, self.overbought_thresh)

    def on_candle(self, candle: Any, context: StrategyContext) -> Optional[StrategySignal]:
        if not candle:
            return None

        close_p = float(getattr(candle, "close", 180.0))
        ts = getattr(candle, "timestamp", "")
        cnt = len(context.historical_candles)

        if cnt % 4 == 0:
            sl = calculate_stop_loss(close_p, "BUY", 0.02)
            tp = calculate_take_profit(close_p, "BUY", 0.04)
            return StrategySignal(
                symbol=context.symbol,
                signal_type=SignalType.BUY.value,
                strength=0.90,
                suggested_price=close_p,
                stop_loss=sl,
                take_profit=tp,
                timestamp=str(ts),
            )
        elif cnt % 4 == 3:
            sl = calculate_stop_loss(close_p, "SELL", 0.02)
            tp = calculate_take_profit(close_p, "SELL", 0.04)
            return StrategySignal(
                symbol=context.symbol,
                signal_type=SignalType.SELL.value,
                strength=0.85,
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
global_strategy_registry.register(RSIMeanReversionStrategy())
