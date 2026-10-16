"""
market_context.py — Market Context Engine

High-level engine that computes technical indicators via IndicatorEngine, executes
market context rules from market_context_rules.py, and produces a standardized
MarketContext object.

Does NOT execute trades or generate recommendations. Describes market regime only.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from indicator_engine import IndicatorEngine
from market_context_models import MarketContext, MarketContextError
from market_context_rules import (
    calculate_adr,
    calculate_levels,
    calculate_market_health,
    detect_gap,
    detect_momentum,
    detect_regime,
    detect_trend,
    detect_volatility,
    detect_volume_profile,
)
from market_models import HistoricalSeries, Quote

logger = logging.getLogger("market_context")


class MarketContextEngine:
    """Core analysis engine for market context and regime detection.

    Usage::

        engine = MarketContextEngine()
        context = engine.analyze(series, quote)
        print(context.regime, context.market_health_score)
    """

    def __init__(self, indicator_engine: Optional[IndicatorEngine] = None) -> None:
        self._indicator_engine = indicator_engine or IndicatorEngine()
        logger.info("MarketContextEngine initialized.")

    def analyze(
        self,
        series: HistoricalSeries,
        quote: Optional[Quote] = None,
    ) -> MarketContext:
        """Analyze market condition for a HistoricalSeries and optional Quote.

        Args:
            series: HistoricalSeries OHLCV bar data.
            quote: Optional point-in-time Quote object.

        Returns:
            MarketContext object describing trend, volatility, momentum, regime, levels, health.

        Raises:
            MarketContextError: If historical series is missing or empty.
        """
        # Unroll enterprise consensus wrappers if passed
        if hasattr(series, "normalized_response"):
            series = series.normalized_response.value
        elif hasattr(series, "value"):
            series = series.value

        if quote and hasattr(quote, "normalized_response"):
            quote = quote.normalized_response.value
        elif quote and hasattr(quote, "value"):
            quote = quote.value

        if not series or not hasattr(series, "candles") or not series.candles:
            symbol = getattr(series, "symbol", "UNKNOWN")
            logger.error("MarketContextEngine error: Series contains no candles for '%s'.", symbol)
            raise MarketContextError("Cannot analyze empty HistoricalSeries.", symbol=symbol)

        symbol = series.symbol.upper()
        timeframe = getattr(series, "interval", getattr(series, "timeframe", "1d"))
        candles = series.candles
        latest_candle = candles[-1]
        close_price = latest_candle.close

        logger.info("Analyzing MarketContext for symbol=%s (%d candles, tf=%s)", symbol, len(candles), timeframe)

        # Step 1: Compute Batch Technical Indicators via IndicatorEngine
        requests = [
            {"indicator": "EMA", "parameters": {"period": 20}, "key": "EMA20"},
            {"indicator": "EMA", "parameters": {"period": 50}, "key": "EMA50"},
            {"indicator": "SMA", "parameters": {"period": 200}, "key": "SMA200"},
            {"indicator": "RSI", "parameters": {"period": 14}, "key": "RSI14"},
            {"indicator": "MACD", "parameters": {"fast": 12, "slow": 26, "signal": 9}, "key": "MACD"},
            {"indicator": "ATR", "parameters": {"period": 14}, "key": "ATR14"},
            {"indicator": "VOLUME_SMA", "parameters": {"period": 20}, "key": "VOLUME_SMA20"},
            {"indicator": "PRICE_CHANGE_PCT", "parameters": {"period": 1}, "key": "CHANGE1D"},
        ]

        ind_results = self._indicator_engine.compute_many(series, requests)

        # Extract latest indicator scalars
        ema20 = ind_results.get("EMA20").latest if ind_results.get("EMA20") else None
        ema50 = ind_results.get("EMA50").latest if ind_results.get("EMA50") else None
        sma200 = ind_results.get("SMA200").latest if ind_results.get("SMA200") else None
        rsi = ind_results.get("RSI14").latest if ind_results.get("RSI14") else None

        macd_res = ind_results.get("MACD")
        macd_latest = macd_res.latest if macd_res and isinstance(macd_res.latest, dict) else {}
        macd_hist = macd_latest.get("histogram")

        atr = ind_results.get("ATR14").latest if ind_results.get("ATR14") else None
        vol_sma = ind_results.get("VOLUME_SMA20").latest if ind_results.get("VOLUME_SMA20") else None
        change_pct = ind_results.get("CHANGE1D").latest if ind_results.get("CHANGE1D") else None

        latest_vol = float(latest_candle.volume)

        # Step 2: Execute Context Analysis Rules
        trend, trend_strength = detect_trend(close_price, ema20, ema50, sma200)
        volatility = detect_volatility(atr, close_price)
        momentum = detect_momentum(rsi, macd_hist, change_pct)
        volume_profile = detect_volume_profile(latest_vol, vol_sma)

        support, resistance, swing_high, swing_low = calculate_levels(candles)
        adr = calculate_adr(candles)

        # Gap detection
        gap_detected = False
        gap_percent = 0.0
        if len(candles) >= 2:
            prev_close = candles[-2].close
            open_price = quote.open if quote and quote.open > 0 else latest_candle.open
            gap_detected, gap_percent = detect_gap(open_price, prev_close)

        regime = detect_regime(trend, momentum, volatility, close_price, swing_high, swing_low, gap_detected)
        health_score = calculate_market_health(trend, trend_strength, volatility, momentum, volume_profile, rsi, macd_hist)

        snapshot = {
            "close": close_price,
            "ema20": ema20,
            "ema50": ema50,
            "sma200": sma200,
            "rsi14": rsi,
            "macd_histogram": macd_hist,
            "atr14": atr,
            "volume_sma20": vol_sma,
        }

        return MarketContext(
            symbol=symbol,
            timeframe=timeframe,
            trend=trend,
            volatility=volatility,
            momentum=momentum,
            volume_profile=volume_profile,
            trend_strength=trend_strength,
            regime=regime,
            support_level=support,
            resistance_level=resistance,
            recent_swing_high=swing_high,
            recent_swing_low=swing_low,
            average_daily_range=adr,
            gap_detected=gap_detected,
            gap_percent=gap_percent,
            market_health_score=health_score,
            key_indicators_snapshot=snapshot,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
