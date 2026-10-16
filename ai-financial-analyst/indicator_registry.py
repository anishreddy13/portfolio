"""
indicator_registry.py — Self-Registering Technical Indicator Registry

Provides an extensible, plugin-based registry for technical indicator calculators.
Every indicator is implemented as an IndicatorCalculator subclass that self-registers.

Adding a new indicator in the future only requires defining a new IndicatorCalculator
subclass and registering it with global_registry.register(). No giant if-else blocks!
"""

from __future__ import annotations

import abc
import logging
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

from indicator_models import (
    IndicatorCalculationError,
    InsufficientDataError,
    InvalidParameterError,
)

logger = logging.getLogger("indicator_registry")


# ═════════════════════════════════════════════
# 1. Abstract Base Indicator Calculator
# ═════════════════════════════════════════════

class IndicatorCalculator(abc.ABC):
    """Abstract base class for all indicator calculations."""

    @property
    @abc.abstractmethod
    def name(self) -> str:
        """Name of the indicator (e.g. 'EMA', 'RSI')."""

    @abc.abstractmethod
    def min_candles(self, params: Dict[str, Any]) -> int:
        """Minimum number of candles required to compute this indicator."""

    @abc.abstractmethod
    def calculate(
        self, df: pd.DataFrame, params: Dict[str, Any]
    ) -> Tuple[Union[List[Optional[float]], Dict[str, List[Optional[float]]]], Any]:
        """Perform calculation on OHLCV pandas DataFrame.

        Returns:
            Tuple of (values_series, latest_value)
        """


# ═════════════════════════════════════════════
# 2. Indicator Registry
# ═════════════════════════════════════════════

class IndicatorRegistry:
    """Central registry mapping indicator names to calculator instances."""

    def __init__(self) -> None:
        self._calculators: Dict[str, IndicatorCalculator] = {}

    def register(self, calculator: IndicatorCalculator) -> None:
        """Register a new calculator instance."""
        name = calculator.name.upper()
        self._calculators[name] = calculator
        logger.debug("Registered indicator calculator: %s", name)

    def get(self, name: str) -> IndicatorCalculator:
        """Retrieve a calculator by name."""
        key = name.upper()
        if key not in self._calculators:
            raise IndicatorCalculationError(
                f"Unknown or unregistered indicator '{name}'. "
                f"Available indicators: {', '.join(self.list_available())}"
            )
        return self._calculators[key]

    def list_available(self) -> List[str]:
        """List names of all registered indicators."""
        return sorted(list(self._calculators.keys()))


# Global singleton registry instance
global_registry = IndicatorRegistry()


# ═════════════════════════════════════════════
# 3. Concrete Indicator Calculators
# ═════════════════════════════════════════════

# ── 1. EMA ────────────────────────────────────

class EMACalculator(IndicatorCalculator):
    @property
    def name(self) -> str:
        return "EMA"

    def min_candles(self, params: Dict[str, Any]) -> int:
        period = int(params.get("period", 20))
        if period <= 0:
            raise InvalidParameterError("EMA period must be > 0", indicator=self.name)
        return period

    def calculate(self, df: pd.DataFrame, params: Dict[str, Any]):
        period = int(params.get("period", 20))
        col = params.get("column", "close")
        series = df[col].astype(float)
        ema = series.ewm(span=period, adjust=False).mean()
        values = [None if np.isnan(v) else round(float(v), 4) for v in ema]
        latest = values[-1] if values else None
        return values, latest


# ── 2. SMA ────────────────────────────────────

class SMACalculator(IndicatorCalculator):
    @property
    def name(self) -> str:
        return "SMA"

    def min_candles(self, params: Dict[str, Any]) -> int:
        period = int(params.get("period", 20))
        if period <= 0:
            raise InvalidParameterError("SMA period must be > 0", indicator=self.name)
        return period

    def calculate(self, df: pd.DataFrame, params: Dict[str, Any]):
        period = int(params.get("period", 20))
        col = params.get("column", "close")
        series = df[col].astype(float)
        sma = series.rolling(window=period).mean()
        values = [None if np.isnan(v) else round(float(v), 4) for v in sma]
        latest = values[-1] if values else None
        return values, latest


# ── 3. RSI ────────────────────────────────────

class RSICalculator(IndicatorCalculator):
    @property
    def name(self) -> str:
        return "RSI"

    def min_candles(self, params: Dict[str, Any]) -> int:
        period = int(params.get("period", 14))
        if period <= 0:
            raise InvalidParameterError("RSI period must be > 0", indicator=self.name)
        return period + 1

    def calculate(self, df: pd.DataFrame, params: Dict[str, Any]):
        period = int(params.get("period", 14))
        close = df["close"].astype(float)
        delta = close.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

        rs = gain / loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))
        rsi = rsi.fillna(100)  # Handle 0 loss edge case

        values = [None if np.isnan(v) else round(float(v), 2) for v in rsi]
        latest = values[-1] if values else None
        return values, latest


# ── 4. MACD ───────────────────────────────────

class MACDCalculator(IndicatorCalculator):
    @property
    def name(self) -> str:
        return "MACD"

    def min_candles(self, params: Dict[str, Any]) -> int:
        slow = int(params.get("slow", 26))
        signal = int(params.get("signal", 9))
        if slow <= 0 or signal <= 0:
            raise InvalidParameterError("MACD parameters must be > 0", indicator=self.name)
        return slow + signal

    def calculate(self, df: pd.DataFrame, params: Dict[str, Any]):
        fast = int(params.get("fast", 12))
        slow = int(params.get("slow", 26))
        signal_p = int(params.get("signal", 9))
        close = df["close"].astype(float)

        ema_fast = close.ewm(span=fast, adjust=False).mean()
        ema_slow = close.ewm(span=slow, adjust=False).mean()
        macd = ema_fast - ema_slow
        signal = macd.ewm(span=signal_p, adjust=False).mean()
        hist = macd - signal

        macd_list = [None if np.isnan(v) else round(float(v), 4) for v in macd]
        sig_list = [None if np.isnan(v) else round(float(v), 4) for v in signal]
        hist_list = [None if np.isnan(v) else round(float(v), 4) for v in hist]

        values = {
            "macd": macd_list,
            "signal": sig_list,
            "histogram": hist_list,
        }
        latest = {
            "macd": macd_list[-1] if macd_list else None,
            "signal": sig_list[-1] if sig_list else None,
            "histogram": hist_list[-1] if hist_list else None,
        }
        return values, latest


# ── 5. VWAP ───────────────────────────────────

class VWAPCalculator(IndicatorCalculator):
    @property
    def name(self) -> str:
        return "VWAP"

    def min_candles(self, params: Dict[str, Any]) -> int:
        return 1

    def calculate(self, df: pd.DataFrame, params: Dict[str, Any]):
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        close = df["close"].astype(float)
        vol = df["volume"].astype(float)

        typical_price = (high + low + close) / 3.0
        cum_tp_vol = (typical_price * vol).cumsum()
        cum_vol = vol.cumsum().replace(0, np.nan)
        vwap = cum_tp_vol / cum_vol

        values = [None if np.isnan(v) else round(float(v), 4) for v in vwap]
        latest = values[-1] if values else None
        return values, latest


# ── 6. ATR ────────────────────────────────────

class ATRCalculator(IndicatorCalculator):
    @property
    def name(self) -> str:
        return "ATR"

    def min_candles(self, params: Dict[str, Any]) -> int:
        period = int(params.get("period", 14))
        if period <= 0:
            raise InvalidParameterError("ATR period must be > 0", indicator=self.name)
        return period + 1

    def calculate(self, df: pd.DataFrame, params: Dict[str, Any]):
        period = int(params.get("period", 14))
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        close = df["close"].astype(float)
        prev_close = close.shift(1)

        tr1 = high - low
        tr2 = (high - prev_close).abs()
        tr3 = (low - prev_close).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

        atr = tr.rolling(window=period).mean()
        values = [None if np.isnan(v) else round(float(v), 4) for v in atr]
        latest = values[-1] if values else None
        return values, latest


# ── 7. Bollinger Bands ────────────────────────

class BollingerBandsCalculator(IndicatorCalculator):
    @property
    def name(self) -> str:
        return "BOLLINGER_BANDS"

    def min_candles(self, params: Dict[str, Any]) -> int:
        period = int(params.get("period", 20))
        if period <= 0:
            raise InvalidParameterError("Bollinger Bands period must be > 0", indicator=self.name)
        return period

    def calculate(self, df: pd.DataFrame, params: Dict[str, Any]):
        period = int(params.get("period", 20))
        std_dev_k = float(params.get("std_dev", 2.0))
        close = df["close"].astype(float)

        middle = close.rolling(window=period).mean()
        std = close.rolling(window=period).std()
        upper = middle + (std * std_dev_k)
        lower = middle - (std * std_dev_k)

        u_list = [None if np.isnan(v) else round(float(v), 4) for v in upper]
        m_list = [None if np.isnan(v) else round(float(v), 4) for v in middle]
        l_list = [None if np.isnan(v) else round(float(v), 4) for v in lower]

        values = {
            "upper": u_list,
            "middle": m_list,
            "lower": l_list,
        }
        latest = {
            "upper": u_list[-1] if u_list else None,
            "middle": m_list[-1] if m_list else None,
            "lower": l_list[-1] if l_list else None,
        }
        return values, latest


# ── 8. Volume SMA ──────────────────────────────

class VolumeSMACalculator(IndicatorCalculator):
    @property
    def name(self) -> str:
        return "VOLUME_SMA"

    def min_candles(self, params: Dict[str, Any]) -> int:
        period = int(params.get("period", 20))
        if period <= 0:
            raise InvalidParameterError("Volume SMA period must be > 0", indicator=self.name)
        return period

    def calculate(self, df: pd.DataFrame, params: Dict[str, Any]):
        period = int(params.get("period", 20))
        vol = df["volume"].astype(float)
        vol_sma = vol.rolling(window=period).mean()

        values = [None if np.isnan(v) else round(float(v), 2) for v in vol_sma]
        latest = values[-1] if values else None
        return values, latest


# ── 9. Highest High ───────────────────────────

class HighestHighCalculator(IndicatorCalculator):
    @property
    def name(self) -> str:
        return "HIGHEST_HIGH"

    def min_candles(self, params: Dict[str, Any]) -> int:
        period = int(params.get("period", 14))
        if period <= 0:
            raise InvalidParameterError("Highest High period must be > 0", indicator=self.name)
        return period

    def calculate(self, df: pd.DataFrame, params: Dict[str, Any]):
        period = int(params.get("period", 14))
        high = df["high"].astype(float)
        hh = high.rolling(window=period).max()

        values = [None if np.isnan(v) else round(float(v), 4) for v in hh]
        latest = values[-1] if values else None
        return values, latest


# ── 10. Lowest Low ────────────────────────────

class LowestLowCalculator(IndicatorCalculator):
    @property
    def name(self) -> str:
        return "LOWEST_LOW"

    def min_candles(self, params: Dict[str, Any]) -> int:
        period = int(params.get("period", 14))
        if period <= 0:
            raise InvalidParameterError("Lowest Low period must be > 0", indicator=self.name)
        return period

    def calculate(self, df: pd.DataFrame, params: Dict[str, Any]):
        period = int(params.get("period", 14))
        low = df["low"].astype(float)
        ll = low.rolling(window=period).min()

        values = [None if np.isnan(v) else round(float(v), 4) for v in ll]
        latest = values[-1] if values else None
        return values, latest


# ── 11. Daily Returns ─────────────────────────

class DailyReturnsCalculator(IndicatorCalculator):
    @property
    def name(self) -> str:
        return "DAILY_RETURNS"

    def min_candles(self, params: Dict[str, Any]) -> int:
        return 2

    def calculate(self, df: pd.DataFrame, params: Dict[str, Any]):
        close = df["close"].astype(float)
        returns = close.pct_change() * 100.0

        values = [None if np.isnan(v) else round(float(v), 4) for v in returns]
        latest = values[-1] if values else None
        return values, latest


# ── 12. Price Change Pct ──────────────────────

class PriceChangePctCalculator(IndicatorCalculator):
    @property
    def name(self) -> str:
        return "PRICE_CHANGE_PCT"

    def min_candles(self, params: Dict[str, Any]) -> int:
        period = int(params.get("period", 1))
        if period <= 0:
            raise InvalidParameterError("Price change period must be > 0", indicator=self.name)
        return period + 1

    def calculate(self, df: pd.DataFrame, params: Dict[str, Any]):
        period = int(params.get("period", 1))
        close = df["close"].astype(float)
        pct = close.pct_change(periods=period) * 100.0

        values = [None if np.isnan(v) else round(float(v), 4) for v in pct]
        latest = values[-1] if values else None
        return values, latest


# ═════════════════════════════════════════════
# Register All Default Calculators
# ═════════════════════════════════════════════

for calc in [
    EMACalculator(),
    SMACalculator(),
    RSICalculator(),
    MACDCalculator(),
    VWAPCalculator(),
    ATRCalculator(),
    BollingerBandsCalculator(),
    VolumeSMACalculator(),
    HighestHighCalculator(),
    LowestLowCalculator(),
    DailyReturnsCalculator(),
    PriceChangePctCalculator(),
]:
    global_registry.register(calc)
